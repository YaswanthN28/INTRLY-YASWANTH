"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { AuthorizationService } from "@/services/authorization-service"

/**
 * CANDIDATE ACTION: Submit an Application to an Organization
 */
export async function submitApplication(organizationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Unauthorized" }

  const targetRole = user.user_metadata?.target_role;
  if (!targetRole) return { success: false, error: "You must select a Target Role first." }

  const supabaseAdmin = createAdminClient()

  // 1. Verify Organization Exists
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('id', organizationId)
    .single()

  if (!org) return { success: false, error: "Invalid organization selected." }

  // 2. Prevent duplicate active applications
  const { data: activeApp } = await supabaseAdmin
    .from('candidate_applications')
    .select('id')
    .eq('candidate_id', user.id)
    .eq('organization_id', organizationId)
    .eq('target_role', targetRole)
    .in('status', ['submitted', 'reviewed', 'shortlisted'])
    .single()

  if (activeApp) {
    return { success: false, error: "You already have an active application for this role at this organization." }
  }

  // 3. Insert Application
  const { error } = await supabaseAdmin
    .from('candidate_applications')
    .insert({
      candidate_id: user.id,
      organization_id: organizationId,
      target_role: targetRole,
      status: 'submitted'
    })

  if (error) {
    console.error("Application submission error:", error)
    return { success: false, error: "Failed to submit application." }
  }

  revalidatePath('/applications')
  return { success: true }
}

/**
 * CANDIDATE ACTION: Withdraw Application
 */
export async function withdrawApplication(applicationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Unauthorized" }

  const supabaseAdmin = createAdminClient()

  // Verify ownership
  const { data: app } = await supabaseAdmin
    .from('candidate_applications')
    .select('id, status')
    .eq('id', applicationId)
    .eq('candidate_id', user.id)
    .single()

  if (!app) return { success: false, error: "Application not found." }
  if (app.status === 'withdrawn' || app.status === 'rejected') {
    return { success: false, error: "Application cannot be withdrawn from this state." }
  }

  const { error } = await supabaseAdmin
    .from('candidate_applications')
    .update({ 
      status: 'withdrawn',
      updated_at: new Date().toISOString()
    })
    .eq('id', applicationId)

  if (error) return { success: false, error: "Failed to withdraw application." }

  revalidatePath('/applications')
  return { success: true }
}

/**
 * ORG ADMIN ACTION: Update Application Status
 */
export async function updateApplicationStatus(applicationId: string, newStatus: 'reviewed' | 'shortlisted' | 'rejected') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Unauthorized" }

  const supabaseAdmin = createAdminClient()

  // Fetch App
  const { data: app } = await supabaseAdmin
    .from('candidate_applications')
    .select('organization_id, status')
    .eq('id', applicationId)
    .single()

  if (!app) return { success: false, error: "Application not found." }

  // Verify Org Admin/Owner Auth
  const hasAccess = await AuthorizationService.verifyOrganizationAccess(user.id, app.organization_id, ['owner', 'admin'])
  if (!hasAccess) return { success: false, error: "Unauthorized to update this application." }

  // State Machine validation
  if (app.status === 'withdrawn') return { success: false, error: "Candidate has withdrawn this application." }
  if (app.status === 'rejected') return { success: false, error: "Application is already rejected." }

  // Valid Transitions: submitted -> reviewed, reviewed -> shortlisted, etc.
  
  const { error } = await supabaseAdmin
    .from('candidate_applications')
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', applicationId)

  if (error) return { success: false, error: "Failed to update status." }

  revalidatePath(`/organization/applications`)
  revalidatePath(`/organization/applications/${applicationId}`)
  return { success: true }
}
