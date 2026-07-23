import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ResumeUpload } from "@/components/dashboard/resume-upload"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StartInterviewButton } from "@/components/dashboard/start-interview-button"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to INTRLY. Here is an overview of your interview progress.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-2">
          <ResumeUpload userId={user.id} />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Interviews</CardTitle>
            <CardDescription>You haven&apos;t completed any interviews yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <StartInterviewButton userId={user.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
