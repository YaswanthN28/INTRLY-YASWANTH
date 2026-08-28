import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { EvaluationService } from "@/services/evaluation-service"
import { Share2, CheckCircle2, AlertCircle, Download, FileText, Mic, Target, Link as LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PageHeader } from "@/components/dashboard/page-header"

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

  const transcripts = interview.transcripts || {}
  
  // Clean evaluation based *only* on actual transcripts provided
  const report = EvaluationService.evaluate(interview.questions, transcripts)
  const rawJson = interview.resumes?.raw_json || {}
  const candidateName = rawJson.name || "Candidate"
  const detectedRole = rawJson.roleDetails?.primaryRole?.role || rawJson.detectedRole || "General Practice"
  const resumeSkills = (rawJson.extractedSkills || []).map((s: string) => s.toLowerCase())

  // EVIDENCE CHAIN CALCULATION
  // Find concepts that were both claimed on the resume AND demonstrated in the practice interview
  const demonstratedConcepts = new Set<string>()
  const newlyDemonstratedConcepts = new Set<string>()
  const missedExpectedConcepts = new Set<string>()
  
  report.questionResults.forEach(qr => {
    qr.matchedKeywords.forEach(kw => {
      if (resumeSkills.includes(kw.toLowerCase())) {
        demonstratedConcepts.add(kw)
      } else {
        newlyDemonstratedConcepts.add(kw)
      }
    })
    qr.missedKeywords.forEach(kw => missedExpectedConcepts.add(kw))
  })

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-12 font-sans animate-in fade-in duration-500" id="report-container">
      
      {/* HEADER */}
      <PageHeader 
        eyebrow="Practice Results"
        title={`${candidateName}'s Interview Report`}
        description={`Role Context: ${detectedRole} • Completed on ${new Date(interview.created_at).toLocaleDateString()}`}
        actions={
          <div className="flex gap-3">
             <Link href="/history">
               <Button variant="outline" className="shadow-sm">Back to History</Button>
             </Link>
          </div>
        }
      />

      {/* HONEST SCORE BREAKDOWN */}
      <div className="grid md:grid-cols-3 gap-6">
         {/* Overall Practice Score */}
         <div className="bg-card rounded-xl p-6 border border-border/50 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" /> Overall Score
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Calculated holistically from keyword density, answer length, and filler-word detection.</p>
            </div>
            <div className="mt-6 flex items-end gap-2">
              <span className={`text-5xl font-bold tracking-tight ${report.overallScore >= 75 ? 'text-green-500' : report.overallScore >= 50 ? 'text-amber-500' : 'text-destructive'}`}>
                {report.overallScore}%
              </span>
            </div>
         </div>

         {/* Technical Score */}
         <div className="bg-card rounded-xl p-6 border border-border/50 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-muted-foreground" /> Concept Match
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Evaluates the presence of expected technical concepts and keywords in your answers.</p>
            </div>
            <div className="mt-6 flex items-end gap-2">
              <span className="text-3xl font-bold tracking-tight text-foreground">{report.technicalScore}%</span>
            </div>
         </div>

         {/* Delivery Score */}
         <div className="bg-card rounded-xl p-6 border border-border/50 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Mic className="w-5 h-5 text-muted-foreground" /> Delivery Confidence
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Calculated negatively by the presence of filler words (um, uh, like) in your speech.</p>
            </div>
            <div className="mt-6 flex items-end gap-2">
              <span className="text-3xl font-bold tracking-tight text-foreground">{report.confidenceScore}%</span>
            </div>
         </div>
      </div>

      {/* ROLE READINESS FOUNDATION (Honest Placeholder) */}
      <div className="bg-primary/5 rounded-xl p-6 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center gap-6 shadow-sm">
         <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
           <Target className="w-6 h-6 text-primary" />
         </div>
         <div>
            <h3 className="text-lg font-bold text-foreground">Role Readiness <span className="ml-2 text-xs uppercase tracking-wider font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">Coming Soon</span></h3>
            <p className="text-sm text-foreground/80 mt-1 max-w-3xl leading-relaxed">
              Role readiness will synthesize what you <strong>Claim</strong> (Resume Evidence) and what you <strong>Demonstrate</strong> (Practice Performance) into a final predictive metric before your real interview.
            </p>
         </div>
      </div>

      {/* EVIDENCE CHAIN */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Evidence Chain</h2>
        <div className="grid md:grid-cols-2 gap-6">
          
          <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-muted/20 border-b border-border/50 p-4">
              <h3 className="font-semibold flex items-center gap-2">
                 <LinkIcon className="w-4 h-4 text-green-500" /> Verified Evidence
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Concepts claimed on your resume and proven in practice.</p>
            </div>
            <div className="p-6 flex-1">
              {demonstratedConcepts.size > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {Array.from(demonstratedConcepts).map(kw => (
                    <span key={kw} className="bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 px-2.5 py-1 rounded-md text-xs font-medium">
                      {kw}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No overlapping evidence detected between your resume and your practice answers.</p>
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-muted/20 border-b border-border/50 p-4">
              <h3 className="font-semibold flex items-center gap-2">
                 <AlertCircle className="w-4 h-4 text-amber-500" /> Not Demonstrated
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Expected concepts that were missing from your answers.</p>
            </div>
            <div className="p-6 flex-1">
              {missedExpectedConcepts.size > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {Array.from(missedExpectedConcepts).map(kw => (
                    <span key={kw} className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-md text-xs font-medium">
                      {kw}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">You successfully demonstrated all expected concepts.</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* QUESTION-LEVEL BREAKDOWN */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Question Breakdown</h2>
        <div className="space-y-4">
          {report.questionResults.map((qr, i) => (
            <div key={i} className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
              <div className="p-5 md:p-6 bg-muted/10 border-b border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h4 className="font-medium text-base leading-relaxed max-w-3xl">
                  <span className="text-muted-foreground mr-2 font-mono text-sm">Q{i+1}.</span>
                  {qr.question.question}
                </h4>
                <div className="shrink-0 flex items-center gap-2 bg-background px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider">
                  <span className={qr.score >= 75 ? "text-green-500" : qr.score >= 50 ? "text-amber-500" : "text-destructive"}>
                    Score: {qr.score}%
                  </span>
                </div>
              </div>
              
              <div className="p-5 md:p-6 space-y-6">
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Your Answer</h5>
                  <div className="bg-background rounded-lg p-4 text-sm text-foreground leading-relaxed border border-border/50 font-mono whitespace-pre-wrap">
                    {qr.transcript || <span className="text-muted-foreground italic">(No answer provided)</span>}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6">
                  {qr.matchedKeywords.length > 0 && (
                    <div className="flex-1 space-y-2">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400">Detected Concepts</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {qr.matchedKeywords.map(kw => (
                          <span key={kw} className="bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-md border border-green-500/20 text-xs">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {qr.missedKeywords.length > 0 && (
                    <div className="flex-1 space-y-2">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Expected (Not Detected)</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {qr.missedKeywords.map(kw => (
                          <span key={kw} className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/20 text-xs">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  )
}
