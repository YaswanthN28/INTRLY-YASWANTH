"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { submitApplication } from "@/app/actions/application"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Building2, Send, Loader2 } from "lucide-react"

interface OrgOption {
  id: string;
  name: string;
}

export function ApplyToOrganization({ organizations }: { organizations: OrgOption[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrgId) return

    setIsLoading(true)
    setError("")

    try {
      const result = await submitApplication(selectedOrgId)
      if (result.success) {
        setIsOpen(false)
        router.refresh()
      } else {
        setError(result.error || "Failed to submit application.")
      }
    } catch (err) {
      setError("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) { setError(""); setSelectedOrgId("") }
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Send className="w-4 h-4" />
          Apply to Employer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Evidence Dossier</DialogTitle>
          <DialogDescription>
            Share your unified evidence portfolio directly with an INTRLY-registered employer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleApply} className="space-y-4 pt-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Employer</label>
            <select 
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              required
            >
              <option value="" disabled>-- Select an Organization --</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-muted/30 p-4 rounded-lg border border-border/50 text-xs text-muted-foreground space-y-2 leading-relaxed">
            <p><strong>What is shared:</strong> Your current Target Role, Practice Coverage, and Verified Evidence matrix.</p>
            <p><strong>What remains private:</strong> Raw resumes, internal transcripts, AI prompts, and private interviewer comments.</p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !selectedOrgId}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit Application
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
