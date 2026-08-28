"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { revokeOrganizationInvitation } from "@/app/actions/organization-invitation"
import { Button } from "@/components/ui/button"
import { Mail, Clock, XCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export type PendingInvitation = {
  id: string
  invited_email: string
  role: string
  created_at: string
  expires_at: string
}

export function PendingInvitations({ invitations }: { invitations: PendingInvitation[] }) {
  const router = useRouter()
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const handleRevoke = async (id: string) => {
    setRevokingId(id)
    try {
      const result = await revokeOrganizationInvitation(id)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || "Failed to revoke invitation.")
      }
    } catch (e) {
      alert("An unexpected error occurred.")
    } finally {
      setRevokingId(null)
    }
  }

  if (!invitations || invitations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
        <Mail className="w-6 h-6 mx-auto mb-2 opacity-20" />
        <p className="text-sm">No pending invitations.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto border border-border/50 rounded-xl">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/30">
          <tr>
            <th className="px-6 py-4 font-semibold">Invited Email</th>
            <th className="px-6 py-4 font-semibold">Role</th>
            <th className="px-6 py-4 font-semibold">Expires</th>
            <th className="px-6 py-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {invitations.map((inv) => (
            <tr key={inv.id} className="hover:bg-muted/10 transition-colors">
              <td className="px-6 py-4 font-medium text-foreground">
                {inv.invited_email}
              </td>
              <td className="px-6 py-4 text-muted-foreground capitalize">
                {inv.role}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDistanceToNow(new Date(inv.expires_at), { addSuffix: true })}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRevoke(inv.id)}
                  disabled={revokingId === inv.id}
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  {revokingId === inv.id ? "Revoking..." : "Revoke"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
