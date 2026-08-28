import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Target, FileText, CheckCircle2, ArrowRight, Activity, Clock, Lock, Brain, Briefcase, ChevronRight, Building2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PracticeEvidenceService } from "@/services/practice-evidence-service"
import { AuthorizationService } from "@/services/authorization-service"
import { PageHeader } from "@/components/dashboard/page-header"
import { StartInterviewButton } from "@/components/dashboard/start-interview-button"

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Authenticate User
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect("/login")
  }

  const targetRole = user.user_metadata?.target_role as string | undefined

  // 2. Fetch Core Data securely
  const { data: resumes } = await supabase
    .from('resumes')
    .select('id, raw_json, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    
  const { data: interviews } = await supabase
    .from('interviews')
    .select('id, status, created_at, questions, resumes(raw_json)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  // 3. Fetch Organization Context
  const orgMemberships = await AuthorizationService.getUserMemberships(user.id)
  const hasInterviewerCapability = orgMemberships.length > 0

  const hasResume = resumes && resumes.length > 0
  const hasInterviews = interviews && interviews.length > 0
  const candidateName = user.email?.split('@')[0] || 'Candidate'

  // L4: Journey State Logic
  const journeyStages = [
    { id: 'create', name: "Create", status: hasResume ? "completed" : "current", icon: FileText },
    { id: 'understand', name: "Understand", status: hasResume ? "completed" : "locked", icon: Brain },
    { id: 'practice', name: "Practice", status: hasInterviews ? "completed" : (hasResume ? "current" : "locked"), icon: Clock },
    { id: 'prove', name: "Prove", status: hasInterviews ? "current" : "locked", icon: Target },
    { id: 'discover', name: "Discover", status: "soon", icon: Briefcase },
  ]

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* L1: ORIENTATION */}
      <PageHeader 
        title="Overview" 
        description={`Welcome back, ${candidateName}. Here is your career readiness status.`}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* L2: NEXT BEST ACTION (Primary Card, takes up 2 columns on md) */}
        <div className="md:col-span-2">
          <Card className="h-full bg-primary text-primary-foreground border-transparent shadow-sm relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-50 pointer-events-none mix-blend-screen transition-transform duration-700 group-hover:scale-110" />
            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold tracking-tight">Your Next Step</CardTitle>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner">
                  <Activity className="w-5 h-5 text-white" />
                </div>
              </div>
              <CardDescription className="text-primary-foreground/80 text-base mt-2">
                {!hasResume 
                  ? "Upload or create your resume to establish your baseline Claimed evidence."
                  : "Start a mock practice session to generate Practiced evidence."}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 mt-4">
              <div className="flex items-center gap-4">
                {!hasResume ? (
                  <Link href="/resume">
                    <Button variant="secondary" className="px-8 rounded-full shadow-sm hover:bg-secondary/90 transition-all font-semibold">
                      Add Resume <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                ) : !hasInterviews ? (
                  <StartInterviewButton 
                    userId={user.id}
                    variant="secondary"
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm border-none font-semibold rounded-full px-8"
                  />
                ) : (
                  <Link href="/history">
                    <Button variant="secondary" className="px-8 rounded-full shadow-sm hover:bg-secondary/90 transition-all font-semibold">
                      View History <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* L3: CAREER READINESS */}
        <div className="md:col-span-1">
          <Card className="h-full bg-card border-border shadow-sm flex flex-col justify-between group">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-muted-foreground" />
              </div>
              <CardTitle>Role Readiness</CardTitle>
            </CardHeader>
            <CardContent>
              {user.user_metadata?.target_role ? (
                <>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    Evidence is being collected for <strong>{user.user_metadata.target_role}</strong>.
                  </p>
                  <div className="space-y-3 flex flex-col">
                    <Link href="/evidence" className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors w-full px-4 py-2 rounded-lg">
                      View Evidence Dossier <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link href="/readiness" className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted hover:bg-muted/80 transition-colors w-full px-4 py-2 rounded-lg">
                      Manage Preparation <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    Select a target role to begin building your preparation evidence.
                  </p>
                  <Link href="/readiness" className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted hover:bg-muted/80 transition-colors w-full px-4 py-2 rounded-lg">
                    Choose Target Role <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* L4: JOURNEY PROGRESS */}
      <Card className="bg-card border-border shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
          <CardTitle className="text-lg">Career Journey</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row overflow-x-auto hide-scrollbar divide-y md:divide-y-0 md:divide-x divide-border">
            {journeyStages.map((stage, idx) => (
              <div key={stage.id} className="flex-1 min-w-[160px] p-6 relative flex flex-col gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  stage.status === 'completed' ? 'bg-primary text-primary-foreground' :
                  stage.status === 'current' ? 'bg-primary/20 text-primary border border-primary/30' :
                  'bg-muted text-muted-foreground'
                }`}>
                  <stage.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{stage.name}</p>
                  <p className="text-xs font-medium mt-1 uppercase tracking-wider">
                    {stage.status === 'completed' && <span className="text-primary flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Done</span>}
                    {stage.status === 'current' && <span className="text-secondary-foreground flex items-center gap-1">In Progress</span>}
                    {stage.status === 'soon' && <span className="text-muted-foreground flex items-center gap-1"><Lock className="w-3 h-3"/> Soon</span>}
                    {stage.status === 'locked' && <span className="text-muted-foreground/50 flex items-center gap-1"><Lock className="w-3 h-3"/> Locked</span>}
                  </p>
                </div>
                {idx < journeyStages.length - 1 && (
                  <ChevronRight className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-border bg-card rounded-full w-5 h-5 z-10" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* L5: RECENT ACTIVITY */}
        <Card className="bg-card border-border shadow-sm flex flex-col h-[350px]">
          <CardHeader className="bg-muted/20 border-b border-border/50 shrink-0">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {!hasInterviews ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                <Clock className="w-8 h-8 opacity-20 mb-3" />
                <p className="text-sm">No recent activity.</p>
                <p className="text-xs mt-1">Your practice sessions will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {interviews.map((interview) => (
                  <div key={interview.id} className="p-4 hover:bg-muted/30 transition-colors flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">Practice Interview</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(interview.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Link href={interview.status === 'completed' ? `/report/${interview.id}` : `/interview/${interview.id}`} className="shrink-0">
                      <Button variant="ghost" size="sm" className="text-xs">
                        {interview.status === 'completed' ? 'View' : 'Resume'}
                      </Button>
                    </Link>
                  </div>
                ))}
                {interviews.length >= 3 && (
                   <div className="p-4 text-center">
                     <Link href="/history" className="text-xs font-semibold text-primary hover:underline">
                        View All History
                     </Link>
                   </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* L6: OPPORTUNITIES */}
        <Card className="bg-card border-border shadow-sm flex flex-col h-[350px]">
          <CardHeader className="bg-muted/20 border-b border-border/50 shrink-0">
            <CardTitle className="text-lg flex items-center gap-2">
              Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
             <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-muted-foreground/40" />
             </div>
             <p className="font-semibold text-foreground mb-1">No matches yet</p>
             <p className="text-sm max-w-[250px]">Job recommendations will appear here once you've completed your profile and assessments.</p>
             <div className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider bg-muted/50 px-3 py-1 rounded-full">
              <Lock className="w-3 h-3" /> Coming Soon
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
