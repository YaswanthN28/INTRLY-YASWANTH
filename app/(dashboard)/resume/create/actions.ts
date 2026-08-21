"use server"

import { createClient } from "@/lib/supabase/server"

export async function saveResume(latexCode: string, pdfUrl: string | null, atsScore: number | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // We are creating or updating the latest resume. 
  // In a real app we might create new versions or find by ID.
  const { error } = await supabase.from("resumes").insert({
    user_id: user.id,
    title: "My ATS Resume",
    latex_source: latexCode,
    pdf_path: pdfUrl,
    ats_score: atsScore,
    status: "draft",
    // Providing default values for NOT NULL columns of the existing table if migration isn't run yet
    // Since we can't be 100% sure the migration is run, let's put dummy data just in case
    file_url: pdfUrl || "",
    file_name: "resume.pdf",
    file_type: "application/pdf",
    file_size: 0,
  })

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}
