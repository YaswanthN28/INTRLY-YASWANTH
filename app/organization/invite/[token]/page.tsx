import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import crypto from "crypto"
import { acceptOrganizationInvitation } from "@/app/actions/organization-invitation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ShieldAlert, Building2, UserPlus, CheckCircle, ArrowRight } from "lucide-react"

export default async function AcceptOrganizationInvitationPage({ params }: { params: { token: string } }) {
  const { token: rawToken } = params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Requires Authentication to accept
    redirect(`/login?next=/organization/invite/${rawToken}`)
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const supabaseAdmin = createAdminClient()

  // 1. Fetch Invitation
  const { data: invitation, error } = await supabaseAdmin
    .from('organization_invitations')
    .select(`
      id, 
      invited_email, 
      role, 
      expires_at, 
      accepted_at, 
      revoked_at,
      organization_id,
      organizations ( name )
    `)
    .eq('token_hash', tokenHash)
    .single()

  if (error || !invitation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-destructive" />
        <h1 className="text-2xl font-bold">Invalid Invitation</h1>
        <p className="text-muted-foreground">This invitation link is invalid or does not exist.</p>
      </div>
    )
  }

  // 2. Validate Lifecycle State
  if (invitation.accepted_at) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center space-y-4">
        <CheckCircle className="w-12 h-12 text-primary" />
        <h1 className="text-2xl font-bold">Already Accepted</h1>
        <p className="text-muted-foreground">You have already accepted this invitation.</p>
        <a href="/organization/dashboard" className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Go to Workspace</a>
      </div>
    )
  }

  if (invitation.revoked_at) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-destructive" />
        <h1 className="text-2xl font-bold">Invitation Revoked</h1>
        <p className="text-muted-foreground">This invitation is no longer active.</p>
      </div>
    )
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Invitation Expired</h1>
        <p className="text-muted-foreground">This invitation link has expired. Please request a new one.</p>
      </div>
    )
  }

  // 3. Validate Identity Match
  if (invitation.invited_email.toLowerCase() !== user.email?.toLowerCase()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-destructive" />
        <h1 className="text-2xl font-bold">Email Mismatch</h1>
        <p className="text-muted-foreground">
          This invitation was issued to <strong>{invitation.invited_email}</strong>. 
          You are currently logged in as <strong>{user.email}</strong>.
        </p>
        <form action={async () => {
          "use server"
          const supabase = await createClient()
          await supabase.auth.signOut()
          redirect(`/login?next=/organization/invite/${rawToken}`)
        }}>
          <Button variant="outline" className="mt-4">Sign Out</Button>
        </form>
      </div>
    )
  }

  // 4. Check if already a member
  const { data: existingMember } = await supabaseAdmin
    .from('organization_members')
    .select('id')
    .eq('organization_id', invitation.organization_id)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center space-y-4">
        <CheckCircle className="w-12 h-12 text-primary" />
        <h1 className="text-2xl font-bold">Already a Member</h1>
        <p className="text-muted-foreground">You are already a member of {invitation.organizations?.name}.</p>
        <a href="/organization/dashboard" className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Go to Workspace</a>
      </div>
    )
  }

  // Action for Acceptance
  const handleAccept = async () => {
    "use server"
    const result = await acceptOrganizationInvitation(rawToken)
    if (result.success) {
      redirect('/organization/dashboard')
    } else {
      redirect(`/organization/invite/${rawToken}?error=${encodeURIComponent(result.error || 'Failed to accept invitation')}`)
    }
  }

  return (
    <div className="min-h-screen bg-muted/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="text-center pb-8 pt-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Join Organization</CardTitle>
          <CardDescription className="text-base mt-2">
            You have been invited to join <strong>{invitation.organizations?.name}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/30 p-4 rounded-xl border border-border/50 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Role</span>
              <span className="font-semibold capitalize flex items-center gap-1.5"><UserPlus className="w-4 h-4"/> {invitation.role}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="font-semibold">{invitation.invited_email}</span>
            </div>
          </div>
          
          <form action={handleAccept}>
            <Button type="submit" className="w-full gap-2 text-base h-12">
              Accept Invitation <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-xs text-center text-muted-foreground">
            By accepting, you agree to act on behalf of this organization.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
