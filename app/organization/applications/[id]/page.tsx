import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ApplicationService } from "@/services/application-service"
import { PageHeader } from "@/components/dashboard/page-header"
import { UnifiedMatrix } from "@/components/report/unified-matrix"
import { ApplicationStatusUpdater } from "@/components/organization/application-status-updater"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, ShieldCheck } from "lucide-react"
import { format } from "date-fns"

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const appDetail = await ApplicationService.getApplicationDetail(user.id, params.id)

  if (!appDetail) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <h2 className="text-xl font-bold">Application Not Found</h2>
        <p className="text-muted-foreground">This application is invalid or you do not have permission to view it.</p>
        <Link href="/organization/applications" className="text-primary hover:underline">Return to Inbox</Link>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500">
      <Link href="/organization/applications" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inbox
      </Link>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <PageHeader 
          eyebrow="Application Review"
          title={`Candidate Dossier`}
          description={`Submitted for the ${appDetail.targetRole} role on ${format(new Date(appDetail.createdAt), "MMM d, yyyy")}.`}
        />

        <div className="flex flex-col items-end gap-3 bg-card p-4 border border-border shadow-sm rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Current Status</span>
            <Badge variant="outline" className={`
              ${appDetail.status === 'shortlisted' ? 'bg-primary/10 text-primary border-primary/20' : 
                appDetail.status === 'rejected' || appDetail.status === 'withdrawn' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                'bg-muted text-muted-foreground'}`}>
              {appDetail.status}
            </Badge>
          </div>
          <ApplicationStatusUpdater applicationId={appDetail.id} currentStatus={appDetail.status} />
        </div>
      </div>

      {/* Trust & Provenance Badge */}
      <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400">
        <ShieldCheck className="w-6 h-6 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-semibold text-sm">Evidence Integrity Maintained</h4>
          <p className="text-xs opacity-90 leading-relaxed">
            This dossier contains the candidate's exact evidence snapshot at the time of submission. It separates Claimed (Resume) from Practiced (AI) and Proven (Human Verified) evidence. INTRLY does not calculate arbitrary hiring probabilities.
          </p>
        </div>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle>Evidence Matrix</CardTitle>
          <CardDescription>
            Performance and verification across {appDetail.targetRole} competencies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* We safely cast the PublicEvidenceMatrixRow array since the UnifiedMatrix component only reads shared properties */}
          <UnifiedMatrix matrix={appDetail.evidence.matrix as any} />
        </CardContent>
      </Card>
    </div>
  )
}
