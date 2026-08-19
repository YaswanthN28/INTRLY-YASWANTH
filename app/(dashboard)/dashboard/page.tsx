import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ResumeUpload } from "@/components/dashboard/resume-upload"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StartInterviewButton } from "@/components/dashboard/start-interview-button"
import { Activity, Trophy, Clock } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  // Placeholder stats for production feel
  const stats = [
    { name: 'Completed Interviews', value: '0', icon: Activity },
    { name: 'Average Score', value: 'N/A', icon: Trophy },
    { name: 'Time Practiced', value: '0m', icon: Clock },
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Welcome back.
          </h1>
          <p className="text-muted-foreground text-lg mt-2">Ready to master your next interview?</p>
        </div>
        <StartInterviewButton userId={user.id} />
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.name} className="bg-card/40 backdrop-blur-md border-white/10 shadow-lg hover:shadow-primary/10 transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                <h2 className="text-3xl font-bold mt-1">{stat.value}</h2>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <stat.icon className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-2">
          <Card className="h-full bg-card/40 backdrop-blur-md border-white/10 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl">Resume & Profile</CardTitle>
              <CardDescription>Upload your latest resume to tailor the AI questions specifically to your experience.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResumeUpload userId={user.id} />
            </CardContent>
          </Card>
        </div>
        
        <Card className="bg-card/40 backdrop-blur-md border-white/10 shadow-xl flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl">Recent Activity</CardTitle>
            <CardDescription>Your latest mock interviews will appear here.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-secondary/20 rounded-xl m-4 mt-0 border border-white/5">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
              <Activity className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-muted-foreground font-medium mb-4">No interviews yet.</p>
            <StartInterviewButton userId={user.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
