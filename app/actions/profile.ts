"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function setTargetRole(role: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { error } = await supabase.auth.updateUser({
    data: { target_role: role }
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/readiness")
  revalidatePath("/dashboard")
  return { success: true }
}
