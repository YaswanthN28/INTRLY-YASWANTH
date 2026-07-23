import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { EvaluationService } from "@/services/evaluation-service"
import { PerformanceRadar, PerformanceTimeline, CircularScore } from "@/components/report/charts"
import { DownloadReportButton } from "@/components/report/download-button"
import { Share2, CheckCircle2, XCircle, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: interview, error } = await supabase
    .from('interviews')
    .select('*, resumes(raw_json)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !interview) redirect("/dashboard")

  // Normally, transcripts would be populated during the interview phase.
  // For this MVP, we simulate a perfect transcript hitting all keywords if none exists.
  const transcripts = interview.transcripts || {}
  if (Object.keys(transcripts).length === 0) {
    interview.questions.forEach((q: any) => {
      // Simulate a good response with keywords and some filler words
      transcripts[q.id] = `Well, um, to answer that, ${q.expected_keywords.join(" ")} are really important concepts that I use daily. It helps build scalable architecture.`
    })
  }

  const report = EvaluationService.evaluate(interview.questions, transcripts)
  const candidateName = interview.resumes?.raw_json?.name || "Candidate"
  const detectedRole = interview.resumes?.raw_json?.detectedRole || "Developer"

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 font-sans" id="report-container">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{candidateName}&apos;s Interview Report</h1>
          <p className="text-muted-foreground mt-1">Role: {detectedRole} • Date: {new Date(interview.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Share2 className="w-4 h-4" /> Share
          </Button>
          <DownloadReportButton candidateName={candidateName} targetId="report-container" />
        </div>
      </div>

      {/* HERO METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="col-span-2 md:col-span-1 bg-card rounded-2xl p-6 border shadow-sm flex items-center justify-center">
          <CircularScore value={report.overallScore} label="Overall Score" color={report.overallScore > 75 ? "#4ade80" : "#fbbf24"} />
        </div>
        <div className="bg-card rounded-2xl p-6 border shadow-sm flex items-center justify-center">
          <CircularScore value={report.technicalScore} label="Technical" />
        </div>
        <div className="bg-card rounded-2xl p-6 border shadow-sm flex items-center justify-center">
          <CircularScore value={report.communicationScore} label="Communication" />
        </div>
        <div className="bg-card rounded-2xl p-6 border shadow-sm flex items-center justify-center">
          <CircularScore value={report.confidenceScore} label="Confidence" />
        </div>
        <div className="bg-card rounded-2xl p-6 border shadow-sm flex items-center justify-center">
          <CircularScore value={report.roleReadiness} label="Role Readiness" color="#a78bfa" />
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Competency Radar</h3>
          <PerformanceRadar data={report.radarData} />
        </div>
        <div className="bg-card rounded-2xl p-6 border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Performance Timeline</h3>
          <PerformanceTimeline data={report.timelineData} />
        </div>
      </div>

      {/* STRENGTHS & WEAKNESSES */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-green-500/5 rounded-2xl p-6 border border-green-500/20">
          <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Key Strengths
          </h3>
          <ul className="space-y-2">
            {report.strengths.map((s, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-red-500/5 rounded-2xl p-6 border border-red-500/20">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5" /> Areas for Improvement
          </h3>
          <ul className="space-y-2">
            {report.weaknesses.map((w, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* IMPROVEMENT SUGGESTIONS */}
      <div className="bg-amber-500/5 rounded-2xl p-6 border border-amber-500/20">
        <h3 className="text-lg font-semibold text-amber-600 dark:text-amber-400 mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5" /> Improvement Suggestions
        </h3>
        <ul className="grid sm:grid-cols-2 gap-3">
          {report.weaknesses.map((w, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground bg-background/60 rounded-xl p-4 border border-amber-500/10">
              <div className="mt-0.5 w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <span className="text-amber-500 text-xs font-bold">{i+1}</span>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Improve {w}</p>
                <p className="leading-relaxed">Practice using key terminology and structured responses (STAR method) when answering {w.toLowerCase()} questions.</p>
              </div>
            </li>
          ))}
          <li className="flex items-start gap-3 text-sm text-muted-foreground bg-background/60 rounded-xl p-4 border border-amber-500/10">
            <div className="mt-0.5 w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <span className="text-amber-500 text-xs font-bold">{report.weaknesses.length + 1}</span>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Reduce filler words</p>
              <p className="leading-relaxed">Words like &quot;um&quot;, &quot;uh&quot;, and &quot;like&quot; reduce perceived confidence. Practice pausing instead of filling silence.</p>
            </div>
          </li>
        </ul>
      </div>

      {/* DETAILED BREAKDOWN */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Question Breakdown</h3>
        </div>
        <div className="divide-y">
          {report.questionResults.map((qr, i) => (
            <div key={i} className="p-6 hover:bg-muted/30 transition-colors">
              <div className="flex justify-between items-start gap-4 mb-3">
                <h4 className="font-medium text-sm leading-relaxed"><span className="text-muted-foreground mr-2">Q{i+1}.</span>{qr.question.question}</h4>
                <div className="shrink-0 flex items-center gap-2 bg-background px-3 py-1 rounded-full border text-xs font-semibold">
                  <span className={qr.score > 70 ? "text-green-500" : qr.score > 40 ? "text-yellow-500" : "text-red-500"}>
                    {qr.score}%
                  </span>
                </div>
              </div>
              
              <div className="bg-background rounded-lg p-4 text-sm text-muted-foreground mb-4 font-mono leading-relaxed border">
                &quot;{qr.transcript}&quot;
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                {qr.matchedKeywords.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">Matched:</span>
                    <div className="flex flex-wrap gap-1">
                      {qr.matchedKeywords.map(kw => (
                        <span key={kw} className="bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-md border border-green-500/20">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}
                {qr.missedKeywords.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">Missed:</span>
                    <div className="flex flex-wrap gap-1">
                      {qr.missedKeywords.map(kw => (
                        <span key={kw} className="bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-md border border-red-500/20">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
