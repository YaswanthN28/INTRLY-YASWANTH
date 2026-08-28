import { ResumeUpload } from "@/components/dashboard/resume-upload"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/dashboard/page-header"

export const metadata = {
  title: 'Upload Resume | INTRLY',
  description: 'Upload an existing PDF or DOCX resume',
}

export default async function UploadResumePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      <PageHeader 
        eyebrow="Create"
        title="Upload Resume"
        description="Import your existing resume to instantly prepare for tailored interviews."
      />
      <div className="w-full max-w-4xl mx-auto">
        <ResumeUpload userId={user.id} />
      </div>
    </div>
  )
}
