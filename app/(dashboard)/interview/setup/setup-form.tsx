"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, Code2, MonitorPlay, Sparkles, CheckCircle2, IndianRupee, ArrowRight, Check } from "lucide-react"

export function InterviewSetupForm({ roles }: { roles: string[] }) {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState(roles[0] || "")
  const [selectedMode, setSelectedMode] = useState<'mock' | 'real' | null>(null)
  const [mockTrials, setMockTrials] = useState(3)
  
  // Dummy effect disabled for development so it always shows 3 Free Trials Left visually
  useEffect(() => {
    // Keep it at 3 for aesthetics during development state
    setMockTrials(3)
  }, [])

  const handleStart = () => {
    if (selectedMode === 'mock') {
      // Development State: Allow infinite mock trials regardless of credit count
      if (mockTrials > 0) {
        localStorage.setItem('mockTrialsRemaining', (mockTrials - 1).toString())
      }
      router.push(`/interview/mock?role=${encodeURIComponent(selectedRole)}`)
    } else if (selectedMode === 'real') {
      // Development State: Bypass dummy payment integration
      alert("Development Mode: Bypassing ₹49 payment gateway...")
      setTimeout(() => {
        router.push(`/interview/real?role=${encodeURIComponent(selectedRole)}`)
      }, 500)
    }
  }

  return (
    <div className="space-y-8">
      {/* Target Role Selection */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Target Role</CardTitle>
          <CardDescription>Select the role you are interviewing for. We pre-filled this based on your resume intelligence.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {roles.map(role => (
              <div 
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedRole === role ? 'bg-primary/10 border-primary text-primary font-medium' : 'hover:bg-muted/50 border-border text-muted-foreground'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{role}</span>
                  {selectedRole === role && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                </div>
              </div>
            ))}
          </div>
          <div className="max-w-md">
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Or enter any other job role:</label>
            <input 
              type="text" 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="e.g. Senior Machine Learning Engineer" 
              value={!roles.includes(selectedRole) ? selectedRole : ""}
              onChange={(e) => setSelectedRole(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Mode Selection */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Mock Interview */}
        <Card 
          className={`relative overflow-hidden cursor-pointer transition-all border-2 ${selectedMode === 'mock' ? 'border-primary ring-4 ring-primary/10' : 'border-border/50 hover:border-primary/50'}`}
          onClick={() => setSelectedMode('mock')}
        >
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary/5 to-transparent z-0"></div>
          <CardHeader className="relative z-10">
             <div className="flex items-center justify-between mb-2">
               <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                 <Brain className="w-6 h-6" />
               </div>
               <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-full border border-border/50">
                 {mockTrials} Free Trials Left
               </span>
             </div>
             <CardTitle className="text-2xl">Mock Interview</CardTitle>
             <CardDescription>Practice with our standard conversational AI.</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-3">
             <ul className="space-y-2 text-sm text-muted-foreground">
               <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Conversational behavioral & technical questions</li>
               <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Detailed feedback and improvement suggestions</li>
               <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Takes 15-20 minutes</li>
             </ul>
          </CardContent>
        </Card>

        {/* Real-time Interview */}
        <Card 
          className={`relative overflow-hidden cursor-pointer transition-all border-2 ${selectedMode === 'real' ? 'border-primary ring-4 ring-primary/10' : 'border-border/50 hover:border-primary/50'}`}
          onClick={() => setSelectedMode('real')}
        >
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-amber-500/5 to-transparent z-0"></div>
          <CardHeader className="relative z-10">
             <div className="flex items-center justify-between mb-2">
               <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                 <MonitorPlay className="w-6 h-6" />
               </div>
               <span className="px-3 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full shadow-sm flex items-center gap-1">
                 <IndianRupee className="w-3 h-3" /> 49 / interview
               </span>
             </div>
             <CardTitle className="text-2xl flex items-center gap-2">
               Real-time Interview <Sparkles className="w-5 h-5 text-amber-500" />
             </CardTitle>
             <CardDescription>The ultimate simulation to prove your readiness.</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-3">
             <ul className="space-y-2 text-sm text-muted-foreground">
               <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Requires Screen Sharing</li>
               <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Live coding editor & case study presentation</li>
               <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Strict grading out of 100</li>
               <li className="flex items-center gap-2 font-medium text-foreground"><Check className="w-4 h-4 text-amber-500" /> Score 80+ to unlock Job Application Links</li>
             </ul>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
         <Button 
           size="lg" 
           disabled={!selectedMode || !selectedRole} 
           onClick={handleStart}
           className="w-full md:w-auto px-12 gap-2"
         >
           {selectedMode === 'real' ? 'Pay ₹49 & Start Real Interview' : 'Start Mock Interview'}
           <ArrowRight className="w-4 h-4" />
         </Button>
      </div>
    </div>
  )
}
