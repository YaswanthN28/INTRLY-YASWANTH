"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { ROLE_WEIGHTS } from "@/services/role-detection-service"
import { AuthorizationService } from "@/services/authorization-service"
import crypto from "crypto"

export type AssessmentPayload = {
  requirement: string;
  status: 'VERIFIED' | 'NOT_VERIFIED' | 'NOT_ASSESSED';
  comments: string;
}

/**
 * CANDIDATE ACTION: Create a new invitation.
 */
export async function createInvitation(interviewerEmail: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Unauthorized" }
  
  const targetRole = user.user_metadata?.target_role;
  if (!targetRole) return { success: false, error: "You must select a Target Role first." }

  // Snapshot the requirements
  const roleWeights = ROLE_WEIGHTS.find(r => r.role === targetRole)
  const requirements = roleWeights ? Object.keys(roleWeights.keywords) : []
  
  if (requirements.length === 0) return { success: false, error: "No requirements found for this role." }

  // Check for existing pending duplicates using regular client
  const { data: existing } = await supabase
    .from('interview_invitations')
    .select('id')
    .eq('candidate_id', user.id)
    .eq('interviewer_email', interviewerEmail.toLowerCase())
    .eq('target_role', targetRole)
    .eq('status', 'pending')
    .single()
    
  if (existing) {
    return { success: false, error: "An active pending invitation already exists for this interviewer and role." }
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 day expiration

  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin
    .from('interview_invitations')
    .insert({
      candidate_id: user.id,
      interviewer_email: interviewerEmail.toLowerCase(),
      target_role: targetRole,
      role_requirements: requirements,
      status: 'pending',
      token: token,
      expires_at: expiresAt.toISOString()
    })
    .select('id')
    .single()

  if (error) {
    console.error("Failed to create invitation:", error)
    return { success: false, error: "Database error creating invitation." }
  }

  revalidatePath('/readiness')
  return { success: true, invitationId: data.id, token }
}

/**
 * CANDIDATE ACTION: Revoke a pending invitation.
 */
export async function revokeInvitation(invitationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Unauthorized" }

  // Fetch using regular client to enforce ownership RLS
  const { data: invitation, error: fetchError } = await supabase
    .from('interview_invitations')
    .select('id, status')
    .eq('id', invitationId)
    .eq('candidate_id', user.id)
    .single()
    
  if (fetchError || !invitation) return { success: false, error: "Invitation not found." }
  if (invitation.status !== 'pending') return { success: false, error: "Only pending invitations can be revoked." }

  const supabaseAdmin = createAdminClient()
  const { error } = await supabaseAdmin
    .from('interview_invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId)

  if (error) return { success: false, error: "Could not revoke invitation." }

  revalidatePath('/readiness')
  return { success: true }
}

/**
 * INTERVIEWER ACTION: Accept an invitation using a secure token.
 */
export async function acceptInvitation(token: string, organizationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || !user.email) return { success: false, error: "Unauthorized" }

  // Verify Organization Membership
  const hasAccess = await AuthorizationService.verifyOrganizationAccess(user.id, organizationId, ['owner', 'admin', 'interviewer'])
  if (!hasAccess) return { success: false, error: "You are not an authorized member of this organization." }

  // Find the invitation using Admin client since Interviewer RLS doesn't apply until accepted
  const supabaseAdmin = createAdminClient()
  const { data: invitation, error: fetchError } = await supabaseAdmin
    .from('interview_invitations')
    .select('id, interviewer_email, status, expires_at')
    .eq('token', token)
    .single()

  if (fetchError || !invitation) return { success: false, error: "Invalid invitation link." }
  
  if (invitation.status !== 'pending') return { success: false, error: "Invitation is no longer pending." }
  if (new Date(invitation.expires_at) < new Date()) return { success: false, error: "Invitation has expired." }
  if (invitation.interviewer_email.toLowerCase() !== user.email.toLowerCase()) {
    return { success: false, error: "This invitation was sent to a different email address." }
  }

  // Accept it
  const { error: updateError } = await supabaseAdmin
    .from('interview_invitations')
    .update({
      status: 'accepted',
      interviewer_id: user.id,
      organization_id: organizationId,
      accepted_at: new Date().toISOString()
    })
    .eq('id', invitation.id)

  if (updateError) return { success: false, error: "Failed to accept invitation." }

  revalidatePath('/assessment')
  return { success: true, invitationId: invitation.id }
}

/**
 * INTERVIEWER ACTION: Submit Proven Evidence (Assessments).
 */
export async function submitAssessment(invitationId: string, assessments: AssessmentPayload[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Unauthorized" }

  // Verify ownership and status using regular client
  const { data: invitation, error: fetchError } = await supabase
    .from('interview_invitations')
    .select('status, interviewer_id, role_requirements')
    .eq('id', invitationId)
    .single()

  if (fetchError || !invitation) return { success: false, error: "Assessment not found." }
  if (invitation.interviewer_id !== user.id) return { success: false, error: "You are not authorized for this assessment." }
  if (invitation.status === 'submitted') return { success: false, error: "Assessment has already been submitted." }
  if (invitation.status === 'revoked' || invitation.status === 'expired') return { success: false, error: "Assessment is no longer valid." }

  // Strictly validate that submitted requirements match the snapshot
  const validRequirements = new Set(invitation.role_requirements as string[])
  
  const evidenceRecords = []
  for (const a of assessments) {
    if (!validRequirements.has(a.requirement)) {
      return { success: false, error: `Invalid requirement submitted: ${a.requirement}` }
    }
    
    // Ensure valid status
    if (!['VERIFIED', 'NOT_VERIFIED', 'NOT_ASSESSED'].includes(a.status)) {
       return { success: false, error: "Invalid status submitted." }
    }

    evidenceRecords.push({
      invitation_id: invitationId,
      requirement: a.requirement,
      status: a.status,
      comments: a.comments
    })
  }

  const supabaseAdmin = createAdminClient()
  
  const { error: insertError } = await supabaseAdmin
    .from('proven_evidence')
    .insert(evidenceRecords)

  if (insertError) return { success: false, error: "Failed to save proven evidence." }

  // Mark completed
  await supabaseAdmin
    .from('interview_invitations')
    .update({
      status: 'submitted',
      completed_at: new Date().toISOString()
    })
    .eq('id', invitationId)

  revalidatePath('/assessment')
  return { success: true }
}
