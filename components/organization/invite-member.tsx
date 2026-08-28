"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createOrganizationInvitation } from "@/app/actions/organization-invitation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { UserPlus, Copy, Check } from "lucide-react"

export function InviteMember({ organizationId }: { organizationId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [generatedLink, setGeneratedLink] = useState("")
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setGeneratedLink("")
    setCopied(false)

    try {
      const result = await createOrganizationInvitation(organizationId, email)
      
      if (result.success && result.rawToken) {
        // Construct the acceptance URL
        const origin = window.location.origin
        setGeneratedLink(`${origin}/organization/invite/${result.rawToken}`)
        setEmail("")
        router.refresh()
      } else {
        setError(result.error || "Failed to create invitation.")
      }
    } catch (err) {
      setError("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (!generatedLink) return
    navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      setGeneratedLink("")
      setError("")
      setEmail("")
    }
    setIsOpen(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" />
          Invite Interviewer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Interviewer</DialogTitle>
          <DialogDescription>
            Create an invitation link for a new interviewer. The link will expire in 7 days.
          </DialogDescription>
        </DialogHeader>

        {!generatedLink ? (
          <form onSubmit={handleInvite} className="space-y-4 pt-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input 
                type="email" 
                placeholder="colleague@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Input 
                type="text" 
                value="Interviewer" 
                disabled 
                className="bg-muted text-muted-foreground font-medium"
              />
              <p className="text-xs text-muted-foreground">Only the Interviewer role is supported for new invitations.</p>
            </div>
            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={isLoading || !email}>
                {isLoading ? "Generating Link..." : "Create Invitation"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-md space-y-3">
              <p className="text-sm font-medium text-primary">Invitation Created Successfully</p>
              <p className="text-xs text-muted-foreground">
                Copy the link below and send it to the interviewer. For security reasons, this link will only be shown once.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Input value={generatedLink} readOnly className="bg-background text-xs font-mono" />
                <Button size="icon" variant="outline" onClick={copyToClipboard} className="shrink-0">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Button variant="outline" onClick={() => handleClose(false)}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
