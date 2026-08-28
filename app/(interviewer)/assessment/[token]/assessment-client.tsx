"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { acceptInvitation, submitAssessment, AssessmentPayload } from "@/app/actions/invitation"
import { AlertCircle, ShieldCheck, XCircle, Loader2, CheckCircle2 } from "lucide-react"

interface AssessmentClientProps {
  invitation: any;
  memberships: any[];
  token: string;
  existingEvidence: any[];
}

export function AssessmentClient({ invitation, memberships, token, existingEvidence }: AssessmentClientProps) {
  const router = useRouter()
  const isReadOnly = invitation.status === 'submitted'
  const [isPending, setIsPending] = useState(invitation.status === 'pending')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Map state
  const [assessments, setAssessments] = useState<Record<string, AssessmentPayload>>(
    isReadOnly 
      ? existingEvidence.reduce((acc, curr) => ({ ...acc, [curr.requirement]: curr }), {})
      : (invitation.role_requirements as string[]).reduce((acc, req) => ({
          ...acc,
          [req]: { requirement: req, status: 'NOT_ASSESSED', comments: '' }
        }), {})
  )

  const [selectedOrgId, setSelectedOrgId] = useState(memberships[0]?.organization_id)

  const handleAccept = async () => {
    setIsSubmitting(true)
    setError(null)
    const res = await acceptInvitation(token, selectedOrgId)
    setIsSubmitting(false)
    if (res.success) {
      setIsPending(false)
      router.refresh()
    } else {
      setError(res.error || "Failed to accept invitation.")
    }
  }

  const handleSubmit = async () => {
    if (!window.confirm("Once submitted, this assessment becomes immutable and can no longer be edited. Continue?")) return

    setIsSubmitting(true)
    setError(null)
    
    const payload = Object.values(assessments)
    const res = await submitAssessment(invitation.id, payload)
    
    setIsSubmitting(false)
    if (res.success) {
      router.refresh()
    } else {
      setError(res.error || "Failed to submit assessment.")
    }
  }

  if (isPending) {
    return (
      <Card className="max-w-xl shadow-sm border-border/50">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Accept Assessment Invitation
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            You have been invited to verify this candidate's competency. Please confirm the organization you are representing for this assessment.
          </p>
          
          <div className="space-y-3">
            <Label>Representing Organization</Label>
            <select 
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
            >
              {memberships.map((m, idx) => (
                <option key={idx} value={m.organization_id}>
                  Organization ID: {m.organization_id.substring(0,8)}... (Role: {m.role})
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={handleAccept} disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Accept & Begin Assessment
          </Button>
        </CardContent>
      </Card>
    )
  }

  const requirements = invitation.role_requirements as string[]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {isReadOnly && (
        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-green-800 dark:text-green-300 text-sm">Assessment Finalized</p>
            <p className="text-xs text-green-700/80 dark:text-green-400/80 mt-1">
              This verified assessment was submitted successfully and is now immutable.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">Requirement Verification</h2>
          <p className="text-sm text-muted-foreground">
             Evaluate the candidate against the specific requirements captured when this invitation was created.
          </p>
        </div>

        {requirements.map((req, idx) => {
          const current = assessments[req]
          return (
            <Card key={idx} className={`shadow-sm border-border/50 overflow-hidden transition-colors ${current.status === 'VERIFIED' ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <h3 className="text-base font-semibold capitalize text-foreground">{req}</h3>
                    
                    <div className="space-y-3">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Interviewer Observation</Label>
                      <RadioGroup 
                        disabled={isReadOnly}
                        value={current.status} 
                        onValueChange={(val: any) => setAssessments(prev => ({ ...prev, [req]: { ...prev[req], status: val } }))}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-3 bg-background border border-border/50 p-3 rounded-lg hover:bg-muted/20 transition-colors">
                          <RadioGroupItem value="VERIFIED" id={`r1-${idx}`} className="text-amber-600 border-border" />
                          <Label htmlFor={`r1-${idx}`} className="font-medium cursor-pointer flex-1">Verified Evidence</Label>
                        </div>
                        <div className="flex items-center space-x-3 bg-background border border-border/50 p-3 rounded-lg hover:bg-muted/20 transition-colors">
                          <RadioGroupItem value="NOT_VERIFIED" id={`r2-${idx}`} />
                          <Label htmlFor={`r2-${idx}`} className="font-medium cursor-pointer flex-1">Not Verified</Label>
                        </div>
                        <div className="flex items-center space-x-3 bg-background border border-border/50 p-3 rounded-lg hover:bg-muted/20 transition-colors">
                          <RadioGroupItem value="NOT_ASSESSED" id={`r3-${idx}`} />
                          <Label htmlFor={`r3-${idx}`} className="text-muted-foreground font-medium cursor-pointer flex-1">Not Assessed</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 md:border-l md:pl-6 border-border/50">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Assessment Notes (Optional)</Label>
                    <Textarea 
                      placeholder="Add human observation context..."
                      className="min-h-[140px] resize-none bg-background shadow-sm"
                      value={current.comments}
                      disabled={isReadOnly}
                      onChange={(e) => setAssessments(prev => ({ ...prev, [req]: { ...prev[req], comments: e.target.value } }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!isReadOnly && (
        <Card className="shadow-sm border-border/50 bg-muted/10 mt-8">
           <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
             <div className="space-y-1 text-center sm:text-left">
               <h3 className="font-semibold text-foreground">Finalize Assessment</h3>
               <p className="text-sm text-muted-foreground">Once submitted, this human assessment becomes immutable.</p>
             </div>
             <Button onClick={handleSubmit} disabled={isSubmitting} size="lg" className="w-full sm:w-auto">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Verified Assessment
             </Button>
           </CardContent>
        </Card>
      )}
    </div>
  )
}
