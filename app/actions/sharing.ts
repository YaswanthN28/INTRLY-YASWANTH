"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import crypto from "crypto"

export async function createShareLink(expiresInDays?: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Unauthorized" }

  const targetRole = user.user_metadata?.target_role;
  if (!targetRole) return { success: false, error: "No target role selected." }

  // Check if active share already exists for this role
  const { data: existing } = await supabase
    .from('evidence_shares')
    .select('id')
    .eq('candidate_id', user.id)
    .eq('target_role', targetRole)
    .is('revoked_at', null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .single()

  if (existing) {
    return { success: false, error: "An active share link already exists for this role. Revoke it before creating a new one." }
  }

  // Generate 32 bytes of secure randomness
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

  let expiresAt = null
  if (expiresInDays && expiresInDays > 0) {
    const d = new Date()
    d.setDate(d.getDate() + expiresInDays)
    expiresAt = d.toISOString()
  }

  // Insert using Admin Client to handle hash storage safely
  const supabaseAdmin = createAdminClient()
  const { error } = await supabaseAdmin
    .from('evidence_shares')
    .insert({
      candidate_id: user.id,
      target_role: targetRole,
      token_hash: tokenHash,
      expires_at: expiresAt
    })

  if (error) {
    console.error("Failed to create share:", error)
    return { success: false, error: "Database error creating share link." }
  }

  revalidatePath('/evidence')
  
  // Return the raw token EXACTLY ONCE to the user.
  // It is never stored in the database in plain text.
  return { success: true, token: rawToken }
}

export async function revokeShareLink(shareId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Unauthorized" }

  // Verify ownership using regular client
  const { data: share, error: fetchError } = await supabase
    .from('evidence_shares')
    .select('id')
    .eq('id', shareId)
    .eq('candidate_id', user.id)
    .single()

  if (fetchError || !share) {
    return { success: false, error: "Share record not found." }
  }

  const supabaseAdmin = createAdminClient()
  const { error } = await supabaseAdmin
    .from('evidence_shares')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', shareId)

  if (error) return { success: false, error: "Failed to revoke share link." }

  revalidatePath('/evidence')
  return { success: true }
}

export async function getActiveShare() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const targetRole = user.user_metadata?.target_role;
  if (!targetRole) return null

  const { data } = await supabase
    .from('evidence_shares')
    .select('id, expires_at, created_at')
    .eq('candidate_id', user.id)
    .eq('target_role', targetRole)
    .is('revoked_at', null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return data
}
