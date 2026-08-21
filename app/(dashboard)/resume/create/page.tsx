import { ResumeBuilder } from "@/components/resume/resume-builder"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const metadata = {
  title: 'Create Resume | INTRLY',
  description: 'Create an ATS-friendly LaTeX resume',
}

export default async function CreateResumePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  return (
    <div className="h-full">
      <ResumeBuilder />
    </div>
  )
}
