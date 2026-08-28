import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ApplicationService } from "@/services/application-service"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ApplyToOrganization } from "@/components/candidate/apply-organization"
import { WithdrawApplication } from "@/components/candidate/withdraw-application"
import { Send, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default async function CandidateApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const applications = await ApplicationService.getCandidateApplications(user.id)
  const availableOrgs = await ApplicationService.getAvailableOrganizations()

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <PageHeader 
          eyebrow="Career Journey"
          title="My Applications"
          description="Track the evidence dossiers you have shared with registered employers."
        />
        <div className="md:mt-8">
          <ApplyToOrganization organizations={availableOrgs} />
        </div>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle>Submitted Dossiers</CardTitle>
            <CardDescription>
              Organizations reviewing your role-specific evidence.
            </CardDescription>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {applications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl bg-muted/10">
              <Send className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-foreground">No applications submitted.</p>
              <p className="text-sm mt-1">When you are ready, use the Apply button above to share your verified evidence.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border/50 rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/30">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Employer</th>
                    <th className="px-6 py-4 font-semibold">Target Role</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Applied</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {applications.map((app: any) => (
                    <tr key={app.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {app.organizations?.name || "Unknown Organization"}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground capitalize">
                        {app.target_role}
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
                          {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <WithdrawApplication applicationId={app.id} status={app.status} />
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
