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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card/60 backdrop-blur-xl border border-border/50 p-8 rounded-3xl shadow-sm relative overflow-hidden">
        {/* Decorative background blob */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none mix-blend-screen" />
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight">
            Welcome back.
          </h1>
          <p className="text-muted-foreground text-lg mt-2">Ready to master your next interview?</p>
        </div>
        <div className="relative z-10">
          <StartInterviewButton userId={user.id} />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.name} className="bg-card hover:bg-card/80 border-border/50 shadow-sm hover:shadow-md transition-all rounded-2xl group overflow-hidden">
            <CardContent className="p-6 flex flex-col justify-between h-full relative">
              <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] transition-transform group-hover:scale-110" />
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight">{stat.value}</h2>
                <p className="text-sm font-medium text-muted-foreground mt-1">{stat.name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-2">
          <Card className="h-full bg-card border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border/50 pb-6">
              <CardTitle className="text-xl flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Resume & Context
              </CardTitle>
              <CardDescription>Upload your latest resume to tailor the AI questions specifically to your experience.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ResumeUpload userId={user.id} />
            </CardContent>
          </Card>
        </div>
        
        <Card className="bg-card border-border/50 shadow-sm flex flex-col rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/20 border-b border-border/50 pb-6">
            <CardTitle className="text-xl">Recent Activity</CardTitle>
            <CardDescription>Your latest mock interviews</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-4 rotate-3 border border-border/50">
              <Clock className="w-7 h-7 opacity-50" />
            </div>
            <p className="text-muted-foreground font-medium mb-4">No interviews yet.</p>
            <StartInterviewButton userId={user.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
