import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AuthorizationService } from "@/services/authorization-service"
import { OrganizationDashboardService } from "@/services/organization-dashboard-service"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Activity, Clock, CheckCircle, FileCheck2, Building2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default async function OrganizationDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const memberships = await AuthorizationService.getUserMemberships(user.id)
  
  if (memberships.length === 0) {
    redirect("/dashboard")
  }

  // MVP: Use the first membership
  const activeOrgId = memberships[0].organizationId;
  const data = await OrganizationDashboardService.getDashboardData(user.id, activeOrgId);

  if (!data) {
    return (
      <div className="flex justify-center p-12">
        <p className="text-muted-foreground">Unable to load organization dashboard.</p>
      </div>
    )
  }

  const { metrics, recentAssessments } = data;

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        eyebrow="Organization Workspace"
        title={data.organizationName}
        description="Monitor and manage your organization's candidate assessment pipeline."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-muted-foreground mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Total</span>
            </div>
            <div className="text-3xl font-bold">{metrics.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-muted-foreground mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Pending</span>
            </div>
            <div className="text-3xl font-bold">{metrics.pending}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-blue-500 mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">In Progress</span>
            </div>
            <div className="text-3xl font-bold text-foreground">{metrics.accepted}</div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20 shadow-sm relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center gap-3 text-primary mb-2">
              <FileCheck2 className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Submitted</span>
            </div>
            <div className="text-3xl font-bold text-primary">{metrics.submitted}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle>Recent Assessments</CardTitle>
          <CardDescription>
            Candidates verified or currently being assessed by your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentAssessments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
              <Building2 className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p>No assessments found for your organization.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 font-semibold rounded-tl-lg">Candidate</th>
                    <th className="px-4 py-3 font-semibold">Target Role</th>
                    <th className="px-4 py-3 font-semibold">Interviewer</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold rounded-tr-lg">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {recentAssessments.map((a) => (
                    <tr key={a.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {a.candidateLabel}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">
                        {a.targetRole}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {a.interviewerEmail}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          a.status === 'submitted' ? 'bg-primary/10 text-primary border-primary/20' :
                          a.status === 'accepted' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                          'bg-muted text-muted-foreground border-border'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(a.submittedAt || a.createdAt), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
