"use client"

import { useState } from "react"
import { createInvitation, revokeInvitation } from "@/app/actions/invitation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Loader2, Copy, Check, ShieldAlert, Clock, Info, CheckCircle2, XCircle } from "lucide-react"

export type InvitationStatus = 'pending' | 'accepted' | 'in_progress' | 'submitted' | 'revoked' | 'expired';

export interface InvitationRecord {
  id: string;
  interviewer_email: string;
  target_role: string;
  status: InvitationStatus;
  created_at: string;
  expires_at: string;
  token: string;
}

interface InviteInterviewerProps {
  targetRole: string | null;
  invitations: InvitationRecord[];
}

export function InviteInterviewer({ targetRole, invitations }: InviteInterviewerProps) {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setError("Please enter a valid email address.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    const res = await createInvitation(email)
    setIsSubmitting(false)

    if (!res.success) {
      setError(res.error || "Failed to create invitation.")
    } else {
      setEmail("")
    }
  }

  const handleRevoke = async (id: string) => {
    if (!window.confirm("Are you sure you want to revoke this invitation? The interviewer will no longer be able to access it.")) return
    
    setRevokingId(id)
    const res = await revokeInvitation(id)
    setRevokingId(null)

    if (!res.success) {
      alert(res.error || "Failed to revoke invitation.")
    }
  }

  const handleCopy = async (token: string) => {
    const url = `${window.location.origin}/assessment/${token}`
    await navigator.clipboard.writeText(url)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const getStatusDisplay = (status: InvitationStatus) => {
    switch (status) {
      case 'pending': return { label: 'Awaiting Acceptance', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Clock }
      case 'accepted': return { label: 'Interviewer Accepted', color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20', icon: CheckCircle2 }
      case 'in_progress': return { label: 'Assessment In Progress', color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20', icon: Loader2 }
      case 'submitted': return { label: 'Assessment Completed', color: 'text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20', icon: ShieldAlert }
      case 'revoked': return { label: 'Invitation Revoked', color: 'text-muted-foreground bg-muted/30 border-border/50', icon: XCircle }
      case 'expired': return { label: 'Invitation Expired', color: 'text-muted-foreground bg-muted/30 border-border/50', icon: Clock }
    }
  }

  return (
    <div className="space-y-8">
      {/* Creation Form */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Invite an Interviewer
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Invite an authorized interviewer to assess your preparation.
              </p>
              
              {!targetRole ? (
                <div className="bg-muted/30 border border-border/50 rounded-xl p-4">
                  <p className="text-sm font-medium">Please select a Target Role above to invite an interviewer.</p>
                </div>
              ) : (
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="interviewerEmail">Interviewer Email</Label>
                    <Input 
                      id="interviewerEmail"
                      type="email" 
                      placeholder="interviewer@company.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                  <Button type="submit" disabled={isSubmitting || !email}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Invitation
                  </Button>
                </form>
              )}
            </div>

            <div className="flex-1 space-y-4 md:border-l md:pl-8 border-border/50">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400">Assessment Role</h4>
                  <p className="text-sm font-medium text-foreground bg-background border border-border/50 rounded-md px-3 py-1.5 inline-block">
                    {targetRole || "None Selected"}
                  </p>
                  <p className="text-xs text-blue-700/80 dark:text-blue-400/80 leading-relaxed pt-1">
                    This role and its requirements will be captured when the invitation is created and will not change if you later switch your Target Role. Email delivery is not configured yet. Copy the invitation link and send it to your interviewer manually.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invitations List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">Interviewer Invitations</h3>
        
        {invitations.length === 0 ? (
          <div className="bg-card rounded-2xl border border-dashed border-border/60 p-12 text-center flex flex-col items-center">
            <ShieldAlert className="w-10 h-10 text-muted-foreground/50 mb-3" />
            <h4 className="text-lg font-medium">No interviewer assessments yet</h4>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Invite an interviewer to create independently verified evidence for your target role.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {invitations.map((inv) => {
              const display = getStatusDisplay(inv.status)
              const Icon = display.icon
              const isPending = inv.status === 'pending'
              
              return (
                <Card key={inv.id} className="shadow-sm border-border/50 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                           <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border ${display.color}`}>
                             <Icon className={`w-3 h-3 ${inv.status === 'in_progress' ? 'animate-spin' : ''}`} />
                             {display.label}
                           </span>
                           {isPending && (
                             <span className="text-xs text-muted-foreground">Expires in 7 days</span>
                           )}
                        </div>
                        <p className="font-semibold text-foreground">{inv.interviewer_email}</p>
                        <p className="text-xs text-muted-foreground">Assessing for: <strong className="font-medium text-foreground">{inv.target_role}</strong></p>
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3">
                        {isPending && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 text-xs font-medium bg-background"
                              onClick={() => handleCopy(inv.token)}
                            >
                              {copiedToken === inv.token ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                              {copiedToken === inv.token ? "Copied" : "Copy Link"}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRevoke(inv.id)}
                              disabled={revokingId === inv.id}
                            >
                              {revokingId === inv.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                              Revoke
                            </Button>
                          </>
                        )}
                        {inv.status === 'submitted' && (
                           <p className="text-xs font-medium text-green-600 dark:text-green-400">Verified Evidence Available</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
