import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ROLE_WEIGHTS } from "@/services/role-detection-service"
import { PreparationAlignmentService } from "@/services/preparation-alignment-service"
import { PageHeader } from "@/components/dashboard/page-header"
import { TargetRoleSelector } from "@/components/readiness/target-role-selector"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, Target, Clock, AlertCircle, TrendingUp, HelpCircle, ShieldCheck, XCircle, Info, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { InviteInterviewer } from "@/components/readiness/invite-interviewer"

export default async function ReadinessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect("/login")

  const targetRole = user.user_metadata?.target_role as string | undefined

  // Check if resume exists for CTA logic
  const { data: resumes } = await supabase.from('resumes').select('id, raw_json').eq('user_id', user.id).limit(1)
  const hasResume = resumes && resumes.length > 0
  const detectedRole = hasResume ? (resumes[0].raw_json?.roleDetails?.primaryRole?.role || resumes[0].raw_json?.detectedRole) : null

  // Fetch Preparation Alignment
  const alignmentResult = targetRole ? await PreparationAlignmentService.calculateAlignment(user.id, targetRole) : null
  
  // Fetch Proven Evidence & Invitations
  const provenMap = new Map<string, string>()
  let invitationsList: any[] = []

  if (targetRole) {
    const { data: invitations } = await supabase
      .from('interview_invitations')
      .select('id, interviewer_email, target_role, status, created_at, expires_at, token, proven_evidence(requirement, status)')
      .eq('candidate_id', user.id)
      .order('created_at', { ascending: false })

    if (invitations) {
      invitationsList = invitations
      invitations.filter(i => i.status === 'submitted').forEach(inv => {
        if (Array.isArray(inv.proven_evidence)) {
          inv.proven_evidence.forEach((ev: any) => {
            const req = ev.requirement.toLowerCase()
            if (ev.status === 'VERIFIED') provenMap.set(req, 'VERIFIED')
            else if (!provenMap.has(req) || provenMap.get(req) === 'NOT_ASSESSED') provenMap.set(req, ev.status)
          })
        }
      })
    }
  }

  const allRoles = ROLE_WEIGHTS.map(r => r.title)

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      
      <PageHeader 
        eyebrow="Role Readiness"
        title="Preparation Evidence"
        description="Track your verified readiness signals against the specific requirements of your target role."
      />

      <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between bg-card rounded-2xl p-6 border border-border/50 shadow-sm">
        <div className="space-y-4 flex-1">
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Target Role Objective</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Select the role you are preparing for. Your evidence matrix will dynamically re-align to show your coverage of the essential requirements for this specific role.
            </p>
          </div>
          <TargetRoleSelector currentRole={targetRole || null} availableRoles={allRoles} />
        </div>
        
        {targetRole && detectedRole && targetRole.toLowerCase() !== detectedRole.toLowerCase() && (
          <div className="md:w-80 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-500">Role Pivot Detected</h4>
              <p className="text-xs text-amber-700/80 dark:text-amber-500/80 leading-relaxed">
                Your resume is tuned for <strong className="font-medium">{detectedRole}</strong>, but your target is <strong className="font-medium">{targetRole}</strong>. Ensure you build practice evidence to bridge the gap.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {!targetRole ? (
          <div className="bg-card rounded-2xl border border-dashed border-border/60 p-16 text-center">
            <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-border/50">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Choose a target role to begin</h3>
            <p className="text-muted-foreground max-w-sm mb-6 mx-auto">Your evidence matrix will appear here once you select the role you want to prepare for.</p>
          </div>
        ) : !alignmentResult ? (
          <div className="bg-card rounded-2xl border border-dashed border-border/60 p-16 text-center">
             <h3 className="text-lg font-semibold">No Requirements Available</h3>
             <p className="text-muted-foreground text-sm mt-2">Preparation requirements are not available for this role yet.</p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
            {/* Disclaimer Banner */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400">Preparation Alignment is not an assessment.</h4>
                <p className="text-xs text-blue-700/80 dark:text-blue-400/80 leading-relaxed">
                  This percentage measures your coverage of required concepts during mock practice. It is <strong>not</strong> a hiring probability, an AI certification, or a guarantee of technical mastery. True competency is verified during a real interview.
                </p>
              </div>
            </div>

            {legacyInterviews.length > 0 && (
              <div className="bg-muted/30 border border-border/50 rounded-xl p-4 flex justify-between items-center gap-4">
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">Legacy Practice Sessions Excluded</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      You have {legacyInterviews.length} older practice sessions that were not linked to a specific Target Role. They are safely preserved but excluded from this alignment score.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Preparation Alignment Overview */}
            <Card className="shadow-sm border-border/50 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
              <CardContent className="p-8 relative">
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-between">
                  <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-lg font-medium text-muted-foreground tracking-tight">Preparation Alignment</h3>
                    <div className="flex items-baseline justify-center md:justify-start gap-2">
                      <span className="text-6xl font-bold tracking-tighter text-foreground">{alignmentResult.alignmentPercentage}%</span>
                      <span className="text-sm font-medium text-muted-foreground">coverage</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto flex-1">
                    <div className="bg-muted/30 rounded-xl p-4 border border-border/30 text-center">
                       <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Concepts</p>
                       <p className="text-2xl font-bold">{alignmentResult.totalRequirements}</p>
                    </div>
                    <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20 text-center">
                       <p className="text-xs font-medium text-purple-700 dark:text-purple-400 uppercase tracking-wider mb-1">Repeatedly Practiced</p>
                       <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{alignmentResult.repeatedlyPracticedCount}</p>
                    </div>
                    <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 text-center">
                       <p className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">Practiced</p>
                       <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{alignmentResult.practicedCount}</p>
                    </div>
                    <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20 text-center">
                       <p className="text-xs font-medium text-green-700 dark:text-green-400 uppercase tracking-wider mb-1">Claimed Only</p>
                       <p className="text-2xl font-bold text-green-700 dark:text-green-400">{alignmentResult.claimedCount}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Evidence Matrix */}
            <Card className="shadow-sm overflow-hidden border-border/50">
              <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                 <CardTitle className="text-lg">Requirement Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                     <thead className="bg-muted/10 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/50">
                       <tr>
                         <th className="px-6 py-4 font-semibold w-[20%]">Concept</th>
                         <th className="px-6 py-4 font-semibold w-[20%]">Practice State</th>
                         <th className="px-6 py-4 font-semibold w-[20%] text-amber-700 dark:text-amber-500">Proven (Interviewer)</th>
                         <th className="px-6 py-4 font-semibold w-[40%]">Contribution Explanation</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-border/50">
                       {alignmentResult.requirements.map((req, idx) => {
                         const pState = provenMap.get(req.concept.toLowerCase()) || 'NOT_ASSESSED'
                         return (
                           <tr key={idx} className="hover:bg-muted/10 transition-colors">
                             <td className="px-6 py-4 font-medium text-foreground capitalize">{req.concept}</td>
                             <td className="px-6 py-4">
                               {req.evidenceState === 'REPEATEDLY_PRACTICED' && (
                                 <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20">
                                   <Check className="w-3 h-3" /> Repeatedly Practiced
                                 </span>
                               )}
                               {req.evidenceState === 'PRACTICED' && (
                                 <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                                   <Check className="w-3 h-3" /> Practiced
                                 </span>
                               )}
                               {req.evidenceState === 'CLAIMED' && (
                                 <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-500/10 px-2.5 py-1 rounded-md border border-green-500/20">
                                   <Check className="w-3 h-3" /> Claimed
                                 </span>
                               )}
                               {req.evidenceState === 'NO_EVIDENCE' && (
                                 <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                   <X className="w-3 h-3 opacity-50" /> No Evidence
                                 </span>
                               )}
                             </td>
                             <td className="px-6 py-4">
                               {pState === 'VERIFIED' && (
                                 <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/30">
                                   <ShieldCheck className="w-3.5 h-3.5" /> Verified
                                 </span>
                               )}
                               {pState === 'NOT_VERIFIED' && (
                                 <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                                   <XCircle className="w-3.5 h-3.5" /> Not Verified
                                 </span>
                               )}
                               {pState === 'NOT_ASSESSED' && (
                                 <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 italic">
                                   —
                                 </span>
                               )}
                             </td>
                             <td className="px-6 py-4 text-xs text-muted-foreground leading-relaxed">
                               {req.explanation}
                             </td>
                           </tr>
                         )
                       })}
                     </tbody>
                   </table>
                 </div>
              </CardContent>
            </Card>

            {/* Candidate Invitation Management */}
            <div className="pt-8 border-t border-border/50">
               <InviteInterviewer 
                 targetRole={targetRole || null} 
                 invitations={invitationsList || []} 
               />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
