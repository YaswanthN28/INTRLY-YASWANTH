"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { useResume } from "@/hooks/use-resume-upload"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function StartInterviewButton({ 
  userId, 
  className,
  variant = "default" 
}: { 
  userId: string
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}) {
  const { currentResume } = useResume(userId)
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()

  const handleStart = async () => {
    if (!currentResume) {
      alert("Please upload a resume first to personalize your interview!")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/interview/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: currentResume.id })
      });
      const data = await res.json();
      if (data.success) {
         router.push(`/interview/${data.interviewId}`);
      } else {
         alert(data.error);
         setIsLoading(false)
      }
    } catch(err) {
      alert("Failed to generate interview");
      setIsLoading(false)
    }
  }

  return (
    <Button variant={variant} className={className || "w-full"} onClick={handleStart} disabled={isLoading}>
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Start New Interview
    </Button>
  )
}
