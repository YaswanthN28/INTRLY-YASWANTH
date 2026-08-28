"use client"

import { useState } from "react"
import { createShareLink, revokeShareLink } from "@/app/actions/sharing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Share2, Link as LinkIcon, Check, XCircle, AlertCircle, Copy, Clock, Globe } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

interface ShareDossierProps {
  activeShare: { id: string; expires_at: string | null; created_at: string } | null;
}

export function ShareDossier({ activeShare }: ShareDossierProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [rawToken, setRawToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    setIsLoading(true)
    setError(null)
    const result = await createShareLink(30) // Default 30 days for MVP
    
    if (result.success && result.token) {
      setRawToken(result.token)
    } else {
      setError(result.error || "Failed to create share link")
    }
    setIsLoading(false)
  }

  const handleRevoke = async () => {
    if (!activeShare) return
    setIsLoading(true)
    setError(null)
    const result = await revokeShareLink(activeShare.id)
    if (!result.success) {
      setError(result.error || "Failed to revoke share link")
    } else {
      setRawToken(null)
    }
    setIsLoading(false)
  }

  const copyToClipboard = (tokenToCopy: string) => {
    const url = `${window.location.origin}/shared/${tokenToCopy}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-primary/20 bg-primary/5 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Share Evidence Dossier</CardTitle>
            <CardDescription className="mt-1">
              Create a secure, expiring link to share your preparation evidence with employers.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {!activeShare && !rawToken ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-border/50 bg-background">
            <div className="flex-1 text-sm text-muted-foreground">
              Your evidence dossier is not currently shared. Anyone with the link will be able to view your claimed, practiced, and verified evidence.
            </div>
            <Button onClick={handleCreate} disabled={isLoading} className="shrink-0 w-full sm:w-auto">
              <LinkIcon className="w-4 h-4 ml-2 mr-2" /> Create 30-Day Link
            </Button>
          </div>
        ) : (
          <div className="space-y-4 p-5 rounded-xl border border-primary/30 bg-background/50 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
             
             <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Your evidence dossier is publicly accessible through this link.
             </div>

             {rawToken ? (
                <div className="space-y-3">
                  <p className="text-sm text-amber-700 dark:text-amber-500 font-medium bg-amber-500/10 px-3 py-2 rounded-md border border-amber-500/20">
                    Important: Copy this link now. For security, we do not store the raw link, and you will not be able to see it again after refreshing the page.
                  </p>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 bg-muted p-3 rounded-lg border border-border/50 font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                      {typeof window !== 'undefined' ? `${window.location.origin}/shared/${rawToken}` : '...'}
                    </div>
                    <Button onClick={() => copyToClipboard(rawToken)} variant="secondary" className="shrink-0 gap-2">
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied" : "Copy Link"}
                    </Button>
                  </div>
                </div>
             ) : (
                <div className="flex gap-2 items-center opacity-50">
                    <div className="flex-1 bg-muted p-3 rounded-lg border border-border/50 font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                      [Link hidden for security. Revoke and recreate if lost.]
                    </div>
                </div>
             )}

             <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 mt-4 border-t border-border/50 gap-4">
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> 
                    Created {formatDistanceToNow(new Date(activeShare?.created_at || new Date()), { addSuffix: true })}
                  </div>
                  {activeShare?.expires_at && (
                    <div className="flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5" />
                      Expires {format(new Date(activeShare.expires_at), "MMM d, yyyy")}
                    </div>
                  )}
                </div>
                
                <Button onClick={handleRevoke} disabled={isLoading} variant="destructive" size="sm" className="w-full sm:w-auto gap-2">
                  <XCircle className="w-4 h-4" /> Revoke Link
                </Button>
             </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
