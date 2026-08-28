"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { AuthorizationService } from "@/services/authorization-service"
import crypto from "crypto"

export async function createOrganizationInvitation(organizationId: string, invitedEmailRaw: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Unauthorized" }

  const invitedEmail = invitedEmailRaw.trim().toLowerCase()
  if (!invitedEmail) return { success: false, error: "Email is required." }

  // 1. Verify Authorization (Owner or Admin only)
  const hasAccess = await AuthorizationService.verifyOrganizationAccess(user.id, organizationId, ['owner', 'admin'])
  if (!hasAccess) {
    return { success: false, error: "You are not authorized to invite members to this organization." }
  }

  const supabaseAdmin = createAdminClient()

  // 2. Check if user is already a member
  // (We must look up the user by email if they exist, or just check organization_members joining on auth.users.
  // Since we don't have direct access to auth.users emails for arbitrary users via regular query without admin, 
  // we use admin client to find if a member with this email exists.)
  const { data: existingMembers, error: membersError } = await supabaseAdmin
    .from('organization_members')
    .select('id, users!inner(email)')
    .eq('organization_id', organizationId)
    .eq('users.email', invitedEmail)

  if (!membersError && existingMembers && existingMembers.length > 0) {
    return { success: false, error: "User is already a member of this organization." }
  }

  // 3. Check for active pending invitations
  const { data: existingInvites } = await supabaseAdmin
    .from('organization_invitations')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('invited_email', invitedEmail)
    .is('accepted_at', null)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .limit(1)

  if (existingInvites && existingInvites.length > 0) {
    return { success: false, error: "An active pending invitation already exists for this email." }
  }

  // 4. Generate Cryptographic Token
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 day expiration

  // 5. Insert Invitation
  const { data, error } = await supabaseAdmin
    .from('organization_invitations')
    .insert({
      organization_id: organizationId,
      invited_email: invitedEmail,
      role: 'interviewer',
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      created_by: user.id
    })
    .select('id')
    .single()

  if (error) {
    console.error("Error creating org invitation:", error)
    return { success: false, error: "Database error creating invitation." }
  }

  revalidatePath('/organization/members')
  // We return the raw token exactly once. It is never stored in the database.
  return { success: true, invitationId: data.id, rawToken }
}


export async function revokeOrganizationInvitation(invitationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Unauthorized" }

  const supabaseAdmin = createAdminClient()

  // Fetch the invitation to verify which organization it belongs to
  const { data: invitation } = await supabaseAdmin
    .from('organization_invitations')
    .select('organization_id, accepted_at, revoked_at')
    .eq('id', invitationId)
    .single()

  if (!invitation) return { success: false, error: "Invitation not found." }
  if (invitation.accepted_at) return { success: false, error: "Cannot revoke an already accepted invitation." }
  if (invitation.revoked_at) return { success: false, error: "Invitation is already revoked." }

  // Verify the acting user has Owner/Admin rights for THAT organization
  const hasAccess = await AuthorizationService.verifyOrganizationAccess(user.id, invitation.organization_id, ['owner', 'admin'])
  if (!hasAccess) {
    return { success: false, error: "You are not authorized to revoke this invitation." }
  }

  // Revoke it
  const { error } = await supabaseAdmin
    .from('organization_invitations')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', invitationId)

  if (error) return { success: false, error: "Database error revoking invitation." }

  revalidatePath('/organization/members')
  return { success: true }
}


export async function acceptOrganizationInvitation(rawToken: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || !user.email) return { success: false, error: "Unauthorized" }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const supabaseAdmin = createAdminClient()

  // 1. Find Invitation
  const { data: invitation, error } = await supabaseAdmin
    .from('organization_invitations')
    .select('id, organization_id, invited_email, role, expires_at, accepted_at, revoked_at')
    .eq('token_hash', tokenHash)
    .single()

  if (error || !invitation) return { success: false, error: "Invalid invitation link." }

  // 2. Validate Lifecycle State
  if (invitation.accepted_at) return { success: false, error: "This invitation has already been accepted." }
  if (invitation.revoked_at) return { success: false, error: "This invitation is no longer active." }
  if (new Date(invitation.expires_at) < new Date()) return { success: false, error: "This invitation has expired." }
  
  // 3. Validate Identity
  if (invitation.invited_email.toLowerCase() !== user.email.toLowerCase()) {
    return { success: false, error: "This invitation was issued to a different email address." }
  }

  // 4. Validate Organization Existence
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('id', invitation.organization_id)
    .single()

  if (!org) return { success: false, error: "The associated organization no longer exists." }

  // 5. Execute Atomic Acceptance via RPC or sequential guarded updates
  // Check if member already exists to prevent duplicate key errors cleanly
  const { data: existingMember } = await supabaseAdmin
    .from('organization_members')
    .select('id')
    .eq('organization_id', invitation.organization_id)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    // If they are somehow already a member, just mark the invitation accepted and return success
    await supabaseAdmin
      .from('organization_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)
    return { success: false, error: "You are already a member of this organization." }
  }

  // Insert membership
  const { error: insertError } = await supabaseAdmin
    .from('organization_members')
    .insert({
      organization_id: invitation.organization_id,
      user_id: user.id,
      role: invitation.role
    })

  if (insertError) {
    console.error("Failed to insert member:", insertError)
    return { success: false, error: "Failed to join organization." }
  }

  // Mark invitation accepted
  await supabaseAdmin
    .from('organization_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitation.id)

  revalidatePath('/organization/dashboard')
  revalidatePath('/organization/members')
  return { success: true, organizationId: invitation.organization_id }
}
