"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { withdrawApplication } from "@/app/actions/application"
import { Button } from "@/components/ui/button"
import { Loader2, XCircle } from "lucide-react"

export function WithdrawApplication({ applicationId, status }: { applicationId: string, status: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleWithdraw = async () => {
    if (!confirm("Are you sure you want to withdraw this application? This cannot be undone.")) return;

    setIsLoading(true)
    try {
      const res = await withdrawApplication(applicationId)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.error || "Failed to withdraw application.")
      }
    } catch (e) {
      alert("Unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'withdrawn' || status === 'rejected') return null;

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleWithdraw} 
      disabled={isLoading}
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <XCircle className="w-4 h-4 mr-1.5" />}
      Withdraw
    </Button>
  )
}
