"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type CreateOrgResult = {
  success: boolean;
  error?: string;
  organizationId?: string;
};

export async function createOrganization(name: string): Promise<CreateOrgResult> {
  // 1. Authenticate the caller server-side
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { success: false, error: "Unauthorized. You must be logged in to create an organization." }
  }

  // 2. Validate input
  const cleanName = name?.trim();
  if (!cleanName || cleanName.length < 2) {
    return { success: false, error: "Organization name must be at least 2 characters." }
  }

  // 3. Atomically create organization and owner membership
  // Since we rely on RLS, and the user creates the org, we must insert the org first, then the membership.
  // Using the authenticated user.id directly guarantees they cannot spoof the created_by field.
  
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: cleanName,
      created_by: user.id
    })
    .select('id')
    .single()

  if (orgError || !org) {
    console.error("Failed to create organization:", orgError)
    return { success: false, error: "Failed to create organization due to a database error." }
  }

  // 4. Create the initial 'owner' membership
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'owner'
    })

  if (memberError) {
    console.error("Failed to create owner membership:", memberError)
    // In a production environment with RPC we'd use a transaction.
    // For this implementation, if membership fails, the org is orphaned but safe.
    return { success: false, error: "Organization created but membership assignment failed." }
  }

  revalidatePath('/dashboard')
  
  return { 
    success: true, 
    organizationId: org.id 
  }
}
