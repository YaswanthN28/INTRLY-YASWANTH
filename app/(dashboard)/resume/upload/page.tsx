import { ResumeUpload } from "@/components/dashboard/resume-upload"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

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
    <div className="h-full flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-extrabold tracking-tight mb-8">Upload Resume</h1>
        <ResumeUpload userId={user.id} />
      </div>
    </div>
  )
}
