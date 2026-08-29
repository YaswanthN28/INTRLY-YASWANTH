import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, ArrowRight, Briefcase, ExternalLink, RefreshCcw } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: 'Interview Results | INTRLY',
  description: 'View your interview score and feedback.',
}

export default function InterviewResultsPage({ searchParams }: { searchParams: { mode?: string, score?: string, role?: string } }) {
  const mode = searchParams.mode || 'mock'
  const score = parseInt(searchParams.score || '0', 10)
  const role = searchParams.role || "Target Role"
  const isPassed = score >= 80

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      <PageHeader 
        eyebrow="Step 4"
        title="Interview Results" 
        description={`Your final evaluation for the ${role} position.`}
      />
      
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Score Card */}
        <Card className={`md:col-span-1 border-border/50 shadow-sm border-t-4 ${isPassed ? 'border-t-green-500' : (mode === 'real' ? 'border-t-destructive' : 'border-t-primary')}`}>
          <CardHeader className="text-center pb-2">
            <CardTitle>Final Score</CardTitle>
            <CardDescription>{mode === 'real' ? 'Real-time Evaluation' : 'Mock Assessment'}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-6">
            <div className={`w-32 h-32 rounded-full border-8 flex items-center justify-center my-6 ${isPassed ? 'border-green-500 text-green-500' : 'border-primary text-primary'}`}>
              <div className="text-center">
                <span className="text-4xl font-bold">{score}</span>
                <span className="block text-sm opacity-70">/ 100</span>
              </div>
            </div>
            
            {mode === 'real' && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm ${isPassed ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                {isPassed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                {isPassed ? 'Passed (80+ Achieved)' : 'Did not pass (Requires 80)'}
              </div>
            )}
            {mode === 'mock' && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm bg-primary/10 text-primary">
                <CheckCircle2 className="w-5 h-5" /> Great Practice Session!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feedback / Rewards Card */}
        <Card className="md:col-span-2 border-border/50 shadow-sm flex flex-col">
          {mode === 'real' && isPassed ? (
            <>
              <CardHeader className="bg-green-500/5 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-500">
                  <Briefcase className="w-5 h-5" /> Job Matches Unlocked
                </CardTitle>
                <CardDescription>Congratulations! Your score qualifies you for immediate referrals.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-6 space-y-4">
                {[
                  { company: "TechNova", role: "Senior Frontend Engineer", match: "98%" },
                  { company: "Apex Systems", role: "Full Stack Developer", match: "92%" },
                  { company: "Global AI", role: "UI Engineer", match: "89%" }
                ].map((job, i) => (
                  <div key={i} className="p-4 border rounded-xl flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div>
                      <h4 className="font-semibold text-foreground">{job.company}</h4>
                      <p className="text-sm text-muted-foreground">{job.role}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">{job.match} Match</span>
                      <Button size="sm" variant="outline" className="gap-2">
                        Apply <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="bg-muted/20 border-b border-border/50">
                <CardTitle>Detailed Feedback</CardTitle>
                <CardDescription>Areas for improvement identified during your session.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-6 space-y-6">
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-muted-foreground uppercase">Strengths</h4>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>Clear communication of past experiences.</li>
                    <li>Good understanding of core concepts in {role}.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-muted-foreground uppercase">Areas to Improve</h4>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>Provide more quantifiable metrics when discussing project impact (e.g., "improved speed by 40%").</li>
                    {mode === 'real' && <li>Technical implementation speed could be improved during the live coding section.</li>}
                  </ul>
                </div>
                
                <div className="pt-6 border-t border-border mt-auto">
                  <Link href="/interview/setup" className="block">
                    <Button className="w-full gap-2">
                      <RefreshCcw className="w-4 h-4" /> Try Again
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </>
          )}
        </Card>

      </div>
    </div>
  )
}
