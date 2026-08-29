import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/dashboard/page-header"
import { InterviewSetupForm } from "./setup-form"

export const metadata = {
  title: 'Setup Interview | INTRLY',
  description: 'Select your target role and interview mode.',
}

export default async function InterviewSetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect("/login")

  // Fetch roles from the latest parsed resume
  const { data: resumes } = await supabase
    .from('resumes')
    .select('raw_json')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const currentResume = resumes?.[0]
  const data = currentResume?.raw_json

  let roles = []
  if (data?.roleDetails?.primaryRole) {
    roles.push(data.roleDetails.primaryRole.role)
  }
  if (data?.roleDetails?.secondaryRoles) {
    roles.push(...data.roleDetails.secondaryRoles.map((r: any) => r.role))
  }
  
  if (roles.length === 0) {
    roles = ["Software Engineer", "Product Manager", "Data Scientist", "Frontend Developer"]
  }

  // Deduplicate roles just in case
  roles = Array.from(new Set(roles))

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      <PageHeader 
        eyebrow="Step 3"
        title="Interview Setup" 
        description="Choose your target role and how you want to interview."
      />
      <div className="w-full max-w-4xl mx-auto">
        <InterviewSetupForm roles={roles} />
      </div>
    </div>
  )
}
