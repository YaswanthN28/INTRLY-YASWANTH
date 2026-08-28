import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { AuthorizationService } from "@/services/authorization-service"
import { ApplicationService } from "@/services/application-service"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Briefcase, Eye, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default async function OrganizationApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const memberships = await AuthorizationService.getUserMemberships(user.id)
  if (memberships.length === 0) redirect("/dashboard")

  const activeOrgId = memberships[0].organizationId;
  const activeRole = memberships[0].role;

  if (activeRole !== 'owner' && activeRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">Only Admins can view the applications inbox.</p>
      </div>
    )
  }

  const applications = await ApplicationService.getOrganizationApplications(user.id, activeOrgId)

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        eyebrow="Organization Workspace"
        title="Candidate Applications"
        description="Review candidate evidence dossiers submitted to your organization."
      />

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle>Application Inbox</CardTitle>
            <CardDescription>
              Candidates who have securely shared their verified evidence with you.
            </CardDescription>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {applications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
              <Briefcase className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p>No applications have been submitted to your organization yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border/50 rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/30">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Candidate</th>
                    <th className="px-6 py-4 font-semibold">Target Role</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Applied</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {app.candidateLabel}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground capitalize">
                        {app.targetRole}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          app.status === 'shortlisted' ? 'bg-primary/10 text-primary border-primary/20' :
                          app.status === 'rejected' || app.status === 'withdrawn' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                          'bg-muted text-muted-foreground border-border'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/organization/applications/${app.id}`}>
                          <Button variant="ghost" size="sm" className="hover:bg-muted/50">
                            <Eye className="w-4 h-4 mr-1.5" /> Review
                          </Button>
                        </Link>
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
