"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { useResume } from "@/hooks/use-resume-upload"
import { Loader2, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

export function RemediationPracticeButton({ 
  userId, 
  requirement
}: { 
  userId: string
  requirement: string
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
        body: JSON.stringify({ 
          resumeId: currentResume.id,
          focusRequirement: requirement
        })
      });
      const data = await res.json();
      if (data.success) {
         router.push(`/interview/${data.interviewId}`);
      } else {
         alert(data.error);
         setIsLoading(false)
      }
    } catch(err) {
      alert("Failed to generate focused practice session");
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant="secondary" 
      size="sm" 
      onClick={handleStart} 
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
      Practice {requirement} <ArrowRight className="w-4 h-4" />
    </Button>
  )
}
