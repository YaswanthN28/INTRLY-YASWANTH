"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateApplicationStatus } from "@/app/actions/application"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface ApplicationStatusUpdaterProps {
  applicationId: string;
  currentStatus: string;
}

export function ApplicationStatusUpdater({ applicationId, currentStatus }: ApplicationStatusUpdaterProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleUpdate = async (newStatus: 'reviewed' | 'shortlisted' | 'rejected') => {
    setIsLoading(true)
    try {
      const res = await updateApplicationStatus(applicationId, newStatus)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.error || "Failed to update status")
      }
    } catch (e) {
      alert("Unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (currentStatus === 'withdrawn') {
    return <p className="text-sm text-muted-foreground italic">The candidate has withdrawn this application.</p>
  }

  return (
    <div className="flex items-center gap-3">
      {currentStatus === 'submitted' && (
        <Button 
          variant="outline" 
          onClick={() => handleUpdate('reviewed')} 
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mark as Reviewed"}
        </Button>
      )}
      
      {(currentStatus === 'submitted' || currentStatus === 'reviewed') && (
        <>
          <Button 
            className="bg-primary text-primary-foreground"
            onClick={() => handleUpdate('shortlisted')} 
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Shortlist"}
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => handleUpdate('rejected')} 
            disabled={isLoading}
          >
            Reject
          </Button>
        </>
      )}

      {currentStatus === 'shortlisted' && (
        <Button 
          variant="destructive" 
          onClick={() => handleUpdate('rejected')} 
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reject (Undo Shortlist)"}
        </Button>
      )}
    </div>
  )
}
