import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { AuthorizationService } from "@/services/authorization-service"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Shield, User, Crown, MailPlus } from "lucide-react"
import { format } from "date-fns"
import { InviteMember } from "@/components/organization/invite-member"
import { PendingInvitations } from "@/components/organization/pending-invitations"

export default async function OrganizationMembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const memberships = await AuthorizationService.getUserMemberships(user.id)
  
  if (memberships.length === 0) {
    redirect("/dashboard")
  }

  const activeOrgId = memberships[0].organizationId;
  const activeRole = memberships[0].role;

  // Block Interviewers from viewing team management
  if (activeRole !== 'owner' && activeRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <Shield className="w-12 h-12 text-destructive opacity-80" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">Only Organization Owners and Admins can view team management.</p>
      </div>
    )
  }

  // Fetch Members Securely using Admin Client
  const supabaseAdmin = createAdminClient();
  const { data: members, error } = await supabaseAdmin
    .from('organization_members')
    .select(`
      id,
      role,
      created_at,
      users:user_id ( email )
    `)
    .eq('organization_id', activeOrgId)
    .order('created_at', { ascending: true })

  // Fetch Pending Invitations
  const { data: pendingInvites } = await supabaseAdmin
    .from('organization_invitations')
    .select('id, invited_email, role, created_at, expires_at')
    .eq('organization_id', activeOrgId)
    .is('accepted_at', null)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error || !members) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Failed to load organization members.</p>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <PageHeader 
          eyebrow="Organization Workspace"
          title="Team Members"
          description="Manage interviewers and administrators for your organization."
        />
        <div className="mt-8">
          <InviteMember organizationId={activeOrgId} />
        </div>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle>Authorized Members</CardTitle>
            <CardDescription>
              Users who can conduct assessments on behalf of this organization.
            </CardDescription>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto border border-border/50 rounded-xl">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/30">
                <tr>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {members.map((m: any) => {
                  const email = m.users?.email || 'Unknown User'
                  
                  let RoleIcon = User;
                  let roleStyle = "bg-muted text-muted-foreground";
                  
                  if (m.role === 'owner') {
                    RoleIcon = Crown;
                    roleStyle = "bg-amber-500/10 text-amber-700 dark:text-amber-500 border border-amber-500/20";
                  } else if (m.role === 'admin') {
                    RoleIcon = Shield;
                    roleStyle = "bg-primary/10 text-primary border border-primary/20";
                  }

                  return (
                    <tr key={m.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {email} {user.email === email && <span className="ml-2 text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">You</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${roleStyle}`}>
                          <RoleIcon className="w-3 h-3" /> {m.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {format(new Date(m.created_at), "MMM d, yyyy")}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              Active invitations sent to external interviewers.
            </CardDescription>
          </div>
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <MailPlus className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <PendingInvitations invitations={pendingInvites || []} />
        </CardContent>
      </Card>
    </div>
  )
}
