import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { FileText, Clock, CheckCircle2, ArrowRight, XCircle, UserCircle2, BrainCircuit, Mic } from "lucide-react"
import { EvaluationService } from "@/services/evaluation-service"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/dashboard/page-header"
import { StartInterviewButton } from "@/components/dashboard/start-interview-button"

function getStatusStyle(status: string) {
  switch (status) {
    case "completed": return { icon: <CheckCircle2 className="w-4 h-4 text-green-500" />, label: "Completed", badge: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" }
    case "in_progress": return { icon: <Clock className="w-4 h-4 text-amber-500" />, label: "In Progress", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" }
    default: return { icon: <FileText className="w-4 h-4 text-muted-foreground" />, label: "Pending", badge: "bg-muted text-muted-foreground border-border" }
  }
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-green-500"
  if (score >= 60) return "text-amber-500"
  return "text-destructive"
}

export default async function InterviewHistoryPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: interviews, error } = await supabase
    .from('interviews')
    .select('id, status, created_at, questions, transcripts, resumes(raw_json)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-muted-foreground">Failed to load practice history.</p>
      </div>
    )
  }

  const hasInterviews = interviews && interviews.length > 0;

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      <PageHeader 
        eyebrow="Practice"
        title="Practice Studio"
        description="Rehearse your answers and review feedback before the real interview."
        actions={
          hasInterviews ? (
            <StartInterviewButton userId={user.id} className="shadow-sm" />
          ) : null
        }
      />

      {/* Empty State */}
      {!hasInterviews ? (
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm flex flex-col items-center justify-center p-16 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Mic className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Ready to practice?</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            Start a mock interview session tailored to the skills and experience on your resume. Your history and feedback reports will appear here.
          </p>
          <StartInterviewButton userId={user.id} className="w-auto px-8 py-6 text-base" />
        </div>
      ) : (
        <div className="grid gap-4">
          {interviews.map((interview: any, idx: number) => {
            const status = getStatusStyle(interview.status)
            
            // Compute real evaluation score dynamically based on transcripts
            let overallScore: number | null = null
            if (interview.questions?.length > 0) {
              const transcripts = interview.transcripts || {}
              if (Object.keys(transcripts).length > 0) {
                const report = EvaluationService.evaluate(interview.questions, transcripts)
                overallScore = report.overallScore
              }
            }

            const rawJson = interview.resumes?.raw_json || {}
            const candidateName = rawJson.name || "Candidate"
            const detectedRole = rawJson.roleDetails?.primaryRole?.role || rawJson.detectedRole || "General Interview"
            const questionCount = interview.questions?.length || 0
            
            const date = new Date(interview.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            const time = new Date(interview.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

            return (
              <div
                key={interview.id}
                className="group bg-card rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/40 overflow-hidden flex flex-col"
              >
                <div className="p-5 md:p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  
                  {/* Left Column: Context */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 border border-border/50">
                       <UserCircle2 className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg leading-none">{detectedRole}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${status.badge} flex items-center gap-1`}>
                          {status.icon} {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">Prepared for {candidateName}</p>
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground font-medium">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {date} • {time}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span className="flex items-center gap-1.5">
                          <BrainCircuit className="w-3.5 h-3.5" /> {questionCount} Questions
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Score & Action */}
                  <div className="flex items-center gap-6 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-border/50">
                    {interview.status === "completed" && overallScore !== null && (
                      <div className="text-center md:text-right hidden sm:block">
                        <div className={`text-3xl font-bold tabular-nums tracking-tight ${getScoreColor(overallScore)}`}>
                          {overallScore}%
                        </div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Score</p>
                      </div>
                    )}
                    
                    <div className="flex-1 md:flex-none">
                      {interview.status === "completed" ? (
                        <Link href={`/report/${interview.id}`} className="block w-full">
                          <Button variant="outline" className="w-full md:w-auto gap-2 group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/30 transition-colors">
                            View Report <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/interview/${interview.id}`} className="block w-full">
                          <Button className="w-full md:w-auto gap-2">
                            Resume Session <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                </div>

                {/* Optional subtle progress indicator for completed items */}
                {interview.status === "completed" && overallScore !== null && (
                  <div className="h-1 w-full bg-muted overflow-hidden">
                    <div
                      className={`h-full opacity-80 ${overallScore >= 80 ? 'bg-green-500' : overallScore >= 60 ? 'bg-amber-500' : 'bg-destructive'}`}
                      style={{ width: `${overallScore}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
