import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { FileText, Clock, CheckCircle2, ArrowRight, Trophy, XCircle } from "lucide-react"
import { EvaluationService } from "@/services/evaluation-service"
import { Button } from "@/components/ui/button"

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
  return "text-red-500"
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
        <p className="text-muted-foreground">Failed to load interview history.</p>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Interview History</h1>
          <p className="text-muted-foreground mt-1">{interviews?.length || 0} interview{interviews?.length !== 1 ? "s" : ""} completed</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" /> Upload New Resume
          </Button>
        </Link>
      </div>

      {/* Interview Cards */}
      {!interviews || interviews.length === 0 ? (
        <div className="bg-card rounded-2xl border p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No interviews yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Upload your resume and generate your first personalized AI interview to get started.</p>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {interviews.map((interview: any, idx: number) => {
            const status = getStatusStyle(interview.status)
            
            // Compute a quick overall score for preview
            let overallScore: number | null = null
            if (interview.questions?.length > 0) {
              const transcripts = interview.transcripts || {}
              if (Object.keys(transcripts).length > 0) {
                const report = EvaluationService.evaluate(interview.questions, transcripts)
                overallScore = report.overallScore
              }
            }

            const candidateName = interview.resumes?.raw_json?.name || "Candidate"
            const detectedRole = interview.resumes?.raw_json?.roleDetails?.primaryRole?.role || interview.resumes?.raw_json?.detectedRole || "Unknown Role"
            const questionCount = interview.questions?.length || 0
            const date = new Date(interview.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            const time = new Date(interview.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

            return (
              <div
                key={interview.id}
                className="group bg-card rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/30 overflow-hidden"
              >
                <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                  {/* Left: Info */}
                  <div className="flex items-start gap-4">
                    {/* Index Badge */}
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary text-lg">
                      #{(interviews.length - idx)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold">{candidateName}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${status.badge} flex items-center gap-1`}>
                          {status.icon} {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{detectedRole}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {date} at {time}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {questionCount} Questions
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Score + Action */}
                  <div className="flex items-center gap-6 ml-auto shrink-0">
                    {overallScore !== null && (
                      <div className="text-center">
                        <div className={`text-3xl font-bold tabular-nums ${getScoreColor(overallScore)}`}>
                          {overallScore}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Overall Score</p>
                      </div>
                    )}
                    <Link href={`/report/${interview.id}`}>
                      <Button variant="outline" className="gap-2 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                        View Report <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Bottom progress bar */}
                {overallScore !== null && (
                  <div className="h-1 bg-muted">
                    <div
                      className={`h-full transition-all duration-1000 ${overallScore >= 80 ? 'bg-green-500' : overallScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
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
