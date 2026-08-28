import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AuthorizationService } from "@/services/authorization-service"
import { AlertCircle, FileText, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { AssessmentClient } from "./assessment-client"

interface PageProps {
  params: {
    token: string
  }
}

export default async function AssessmentPage({ params }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    redirect(`/login?next=/assessment/${params.token}`)
  }

  // 1. Fetch Invitation Securely by Token (Bypassing RLS strictly for token lookup, but we validate carefully)
  // Wait, RLS on interview_invitations allows selection if interviewer_email matches auth email.
  // We can just query with RLS active.
  const { data: invitation, error } = await supabase
    .from('interview_invitations')
    .select(`
      id,
      status,
      target_role,
      role_requirements,
      interviewer_email,
      expires_at,
      organization_id,
      candidate:candidate_id(email, raw_user_meta_data)
    `)
    .eq('token', params.token)
    .single()

  if (error || !invitation) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Invitation Not Found</h2>
        <p className="text-muted-foreground">The invitation link is invalid or you do not have permission to access it.</p>
      </div>
    )
  }

  // 2. Validate Expiration
  if (new Date(invitation.expires_at) < new Date() && invitation.status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Invitation Expired</h2>
        <p className="text-muted-foreground">This assessment invitation has expired.</p>
      </div>
    )
  }

  if (invitation.status === 'revoked') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Invitation Revoked</h2>
        <p className="text-muted-foreground">This assessment was revoked by the candidate.</p>
      </div>
    )
  }

  // 3. Fetch Organization Memberships for the Interviewer
  const memberships = await AuthorizationService.getUserMemberships(user.id)
  
  if (memberships.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Organization Required</h2>
        <p className="text-muted-foreground">You must belong to an organization to perform interviewer assessments.</p>
      </div>
    )
  }

  // 4. Fetch Proven Evidence if already submitted
  let existingEvidence = []
  if (invitation.status === 'submitted') {
    const { data: evidence } = await supabase
      .from('proven_evidence')
      .select('requirement, status, comments')
      .eq('invitation_id', invitation.id)
    
    if (evidence) existingEvidence = evidence
  }

  // Formatting Candidate Name safely
  const candidateMeta = invitation.candidate?.raw_user_meta_data as { full_name?: string } | undefined
  const candidateName = candidateMeta?.full_name || invitation.candidate?.email?.split('@')[0] || 'Candidate'

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Candidate Assessment</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          You are evaluating <strong className="text-foreground">{candidateName}</strong> for the role of <strong className="text-foreground">{invitation.target_role}</strong>.
        </p>
      </div>

      <AssessmentClient 
        invitation={invitation}
        memberships={memberships}
        token={params.token}
        existingEvidence={existingEvidence}
      />
    </div>
  )
}
