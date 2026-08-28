import { PublicEvidenceService } from "@/services/public-evidence-service"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/dashboard/page-header"
import { UnifiedMatrix } from "@/components/report/unified-matrix"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Mic, ShieldCheck, Target, Info } from "lucide-react"
import { format } from "date-fns"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Evidence Dossier | INTRLY",
  description: "A secure, verified candidate evidence dossier.",
}

export default async function SharedEvidencePage({ params }: { params: { token: string } }) {
  const { token } = params

  const report = await PublicEvidenceService.getSharedReport(token)

  if (!report) {
    // We intentionally return a 404 for missing, revoked, or expired tokens
    // to prevent enumeration or leaking token existence states.
    notFound()
  }

  // Empty state handling variables
  const hasClaimed = report.matrix.some(r => r.claimed)
  const hasPracticed = report.matrix.some(r => r.practiceInterviewCount > 0)
  const hasProven = report.totalAssessments > 0

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-[1200px] mx-auto space-y-10 pb-12 animate-in fade-in duration-500">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between">
          <div className="space-y-1.5">
            <h1 className="text-sm font-semibold uppercase tracking-widest text-primary">Evidence Dossier</h1>
            <h2 className="text-3xl font-bold tracking-tight">{report.targetRole}</h2>
            <p className="text-muted-foreground">
              This dossier presents evidence collected from the candidate's resume, practice activity, and authorized human assessments. It is not an employability score or hiring guarantee.
            </p>
          </div>
        </div>

        {/* PREPARATION ALIGNMENT SEPARATION */}
        {report.preparationAlignment && (
          <div className="bg-card rounded-2xl p-6 md:p-8 border border-border/50 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between relative z-10">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight">Preparation Coverage</h2>
                  <Info className="w-4 h-4 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Measures preparation coverage across resume claims and target-role practice evidence. 
                  <strong> It is not a hiring, employability, or competency score.</strong>
                </p>
              </div>
              
              <div className="shrink-0 flex items-center gap-4 bg-background p-4 rounded-xl border border-border/50 shadow-sm">
                <div className="text-4xl font-black text-primary">
                  {report.preparationAlignment.alignmentPercentage}<span className="text-2xl text-muted-foreground">%</span>
                </div>
                <div className="text-xs font-medium text-muted-foreground max-w-[100px] leading-tight">
                  Practice & Claim Coverage
                </div>
              </div>
            </div>
          </div>
        )}

        {/* THREE EVIDENCE PILLARS */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground tracking-tight">Claimed</h3>
                <p className="text-sm text-muted-foreground mt-1">What the resume indicates.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Mic className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground tracking-tight">Practiced</h3>
                <p className="text-sm text-muted-foreground mt-1">What the candidate has demonstrated during mock practice.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-amber-50/30 dark:bg-amber-950/10">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30">
                <ShieldCheck className="w-5 h-5 text-amber-700 dark:text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground tracking-tight">Proven</h3>
                <p className="text-sm text-muted-foreground mt-1">Requirements assessed by authorized human interviewers.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MATRIX */}
        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-bold tracking-tight">Evidence Dossier</h2>
          {/* We safely cast this array because PublicEvidenceMatrixRow is a structural subset of UnifiedMatrixRow, removing comments and IDs */}
          <UnifiedMatrix matrix={report.matrix as any} />
        </div>

      </div>
    </div>
  )
}
