import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UnifiedEvidenceService } from "@/services/unified-evidence-service"
import { RemediationService } from "@/services/remediation-service"
import { getActiveShare } from "@/app/actions/sharing"
import { PageHeader } from "@/components/dashboard/page-header"
import { UnifiedMatrix } from "@/components/report/unified-matrix"
import { ShareDossier } from "@/components/report/share-dossier"
import { RemediationList } from "@/components/remediation/remediation-list"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileText, Mic, ShieldCheck, AlertTriangle, Target } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

export default async function UnifiedEvidencePage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  const targetRole = user.user_metadata?.target_role as string | undefined

  if (!targetRole) {
    return (
      <div className="max-w-[1200px] mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
        <PageHeader 
          eyebrow="Unified Evidence Report"
          title="Candidate Evidence Dossier"
          description="A transparent view of your claimed, practiced, and human-verified evidence."
        />
        <Card className="border-dashed border-2 border-border/60 bg-muted/10">
          <CardContent className="flex flex-col items-center text-center p-12 space-y-4">
            <Target className="w-12 h-12 text-muted-foreground/50" />
            <div className="space-y-1">
              <h3 className="text-xl font-semibold">Choose a Target Role</h3>
              <p className="text-muted-foreground max-w-md">
                Select the role you are preparing for before generating your Unified Evidence Report.
              </p>
            </div>
            <Link href="/dashboard">
              <Button className="mt-4">Choose Target Role</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const report = await UnifiedEvidenceService.getReport(user.id, targetRole)
  const activeShare = await getActiveShare(user.id)
  const remediations = await RemediationService.getRecommendations(user.id, targetRole)

  // Empty state handling variables
  const hasClaimed = report.matrix.some(r => r.claimed)
  const hasPracticed = report.matrix.some(r => r.practiceInterviewCount > 0)
  const hasProven = report.totalAssessments > 0

  return (
    <div className="max-w-[1200px] mx-auto space-y-10 pb-12 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between">
        <PageHeader 
          eyebrow="Unified Evidence Report"
          title={targetRole}
          description="A transparent view of your claimed, practiced, and human-verified evidence."
        />
        <div className="text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-md border border-border/50 self-start md:self-auto shrink-0">
          Generated {format(new Date(), "MMM d, yyyy")}
        </div>
      </div>

      {/* SHARE CONTROLS */}
      <ShareDossier 
        targetRole={targetRole} 
        activeShare={activeShare ? {
          token: activeShare.token,
          expiresAt: activeShare.expires_at,
          isPublic: activeShare.is_public
        } : null} 
      />

      {/* WARNINGS */}
      {report.historicalWarnings.map((warning, idx) => (
        <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">Historical Alignment Warning</h4>
            <p className="text-xs opacity-90 leading-relaxed">{warning}</p>
          </div>
        </div>
      ))}

      {/* REMEDIATION / ACTIONABLE FEEDBACK */}
      <RemediationList userId={user.id} recommendations={remediations} />

      {/* THREE PILLARS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={`shadow-sm border-border transition-colors ${hasClaimed ? 'bg-card' : 'bg-muted/10'}`}>
          <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${hasClaimed ? 'bg-pink-500/10' : 'bg-muted/30'}`}>
              <FileText className={`w-6 h-6 ${hasClaimed ? 'text-pink-700 dark:text-pink-500' : 'text-muted-foreground/30'}`} />
            </div>
            <h3 className="font-semibold text-lg">Claimed Evidence</h3>
            <p className="text-sm text-muted-foreground">Self-reported skills extracted directly from your Resume.</p>
          </CardContent>
        </Card>
        
        <Card className={`shadow-sm border-border transition-colors ${hasPracticed ? 'bg-card' : 'bg-muted/10'}`}>
          <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${hasPracticed ? 'bg-orange-500/10' : 'bg-muted/30'}`}>
              <Mic className={`w-6 h-6 ${hasPracticed ? 'text-orange-700 dark:text-orange-500' : 'text-muted-foreground/30'}`} />
            </div>
            <h3 className="font-semibold text-lg">Practiced Evidence</h3>
            <p className="text-sm text-muted-foreground">Skills demonstrated and assessed during Mock AI Interviews.</p>
          </CardContent>
        </Card>

        <Card className={`shadow-sm border-border transition-colors relative overflow-hidden ${hasProven ? 'bg-card' : 'bg-muted/10'}`}>
          <div className={`absolute top-0 left-0 w-full h-1 ${hasProven ? 'bg-emerald-500' : 'bg-muted/30'}`}></div>
          <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${hasProven ? 'bg-emerald-500/10' : 'bg-muted/30'}`}>
              <ShieldCheck className={`w-6 h-6 ${hasProven ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/30'}`} />
            </div>
            <h3 className="font-semibold text-lg">Proven Evidence</h3>
            <p className="text-sm text-muted-foreground">Skills independently verified by an authorized human interviewer.</p>
          </CardContent>
        </Card>
      </div>

      {/* MATRIX */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="border-b border-border/50 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl">Evidence Matrix: {targetRole}</CardTitle>
              <CardDescription>
                Your capability footprint mapped across {report.matrix.length} critical requirements.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                <span className="text-muted-foreground">Preparation Alignment:</span>
                <span className="font-semibold">{Math.round(report.preparationAlignment * 100)}%</span>
              </div>
              <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                <span className="text-muted-foreground">Proven Assessments:</span>
                <span className="font-semibold">{report.totalAssessments}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 p-0 sm:p-6">
          <UnifiedMatrix matrix={report.matrix} />
        </CardContent>
      </Card>
    </div>
  )
}
