"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Webcam from "react-webcam"
import { Brain, StopCircle, Mic, MicOff, Video, VideoOff, Loader2, FileText } from "lucide-react"

export function MockInterviewRoom({ role }: { role: string }) {
  const router = useRouter()
  
  // Media states
  const [isMicOn, setIsMicOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const webcamRef = useRef<Webcam>(null)
  
  // Interview states
  const [isStarted, setIsStarted] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [currentSubtitle, setCurrentSubtitle] = useState("Click 'Start Interview' when you are ready to begin.")
  
  // Simulated AI Interview flow
  const startInterview = () => {
    setIsStarted(true)
    setAiSpeaking(true)
    setCurrentSubtitle(`Hello! I'm your AI interviewer for the ${role} position. It's great to meet you. To start, could you tell me a little bit about yourself?`)
    
    // Simulate AI finishing speaking after 4 seconds
    setTimeout(() => {
      setAiSpeaking(false)
      setCurrentSubtitle("Listening...")
    }, 4000)
  }

  const handleEndInterview = () => {
    setIsFinished(true)
    setTimeout(() => {
      // Navigate to results page with mock score
      router.push(`/interview/results?mode=mock&score=75&role=${encodeURIComponent(role)}`)
    }, 2000)
  }

  if (isFinished) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <FileText className="w-10 h-10 text-primary animate-bounce" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Generating Report...</h2>
        <p className="text-muted-foreground max-w-md mx-auto">Compiling your video responses, analyzing your speech, and preparing your feedback document.</p>
        <div className="mt-8 flex gap-2 items-center text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Finalizing AI analysis
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-black text-white relative overflow-hidden">
      
      {/* Main Video Area */}
      <div className="flex-1 relative flex items-center justify-center p-4 gap-4">
        
        {/* AI Interviewer Avatar (Left) */}
        <div className="w-1/2 h-full bg-zinc-900 rounded-2xl border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent transition-opacity duration-700 ${aiSpeaking ? 'opacity-100' : 'opacity-0'}`} />
          
          <div className="relative z-10 flex flex-col items-center">
            {/* Pulsing Orb Avatar */}
            <div className="relative w-40 h-40 flex items-center justify-center">
               <div className={`absolute inset-0 bg-primary/20 rounded-full blur-xl transition-all duration-300 ${aiSpeaking ? 'scale-150 opacity-100 animate-pulse' : 'scale-100 opacity-50'}`} />
               <div className={`absolute inset-4 bg-primary/40 rounded-full blur-md transition-all duration-150 ${aiSpeaking ? 'scale-110' : 'scale-100'}`} />
               <div className="relative w-24 h-24 bg-primary rounded-full flex items-center justify-center shadow-2xl">
                 <Brain className="w-10 h-10 text-primary-foreground" />
               </div>
            </div>
            <h3 className="mt-8 font-semibold text-lg tracking-wide">INTRLY AI</h3>
            <p className={`text-sm mt-2 transition-opacity duration-300 ${aiSpeaking ? 'text-primary animate-pulse' : 'text-white/40'}`}>
              {aiSpeaking ? 'Speaking...' : 'Listening...'}
            </p>
          </div>
        </div>

        {/* User Camera (Right) */}
        <div className="w-1/2 h-full bg-zinc-900 rounded-2xl border border-white/10 relative overflow-hidden flex items-center justify-center group">
          {isVideoOn ? (
            <Webcam
              audio={false}
              ref={webcamRef}
              mirrored={true}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center text-white/30">
              <VideoOff className="w-16 h-16 mb-4" />
              <p>Camera is disabled</p>
            </div>
          )}
          
          {/* User Status Overlay */}
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
            {!isMicOn ? <MicOff className="w-4 h-4 text-destructive" /> : (
              <div className="flex gap-1 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse delay-75" />
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse delay-150" />
              </div>
            )}
            You
          </div>
        </div>
      </div>

      {/* Subtitles Overlay */}
      <div className="h-32 shrink-0 bg-gradient-to-t from-black via-black/80 to-transparent flex items-end justify-center p-8 pb-12 z-20 pointer-events-none">
        <p className="text-xl md:text-2xl font-medium text-center max-w-4xl text-white/90 drop-shadow-md">
          {currentSubtitle}
        </p>
      </div>

      {/* Control Bar */}
      <div className="h-20 bg-zinc-950 border-t border-white/10 flex items-center justify-between px-8 shrink-0 relative z-30">
        <div className="flex items-center gap-3 w-1/3">
           <Button variant="outline" size="icon" className="bg-white/5 border-white/10 hover:bg-white/20 text-white rounded-full h-12 w-12" onClick={() => setIsMicOn(!isMicOn)}>
             {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-destructive" />}
           </Button>
           <Button variant="outline" size="icon" className="bg-white/5 border-white/10 hover:bg-white/20 text-white rounded-full h-12 w-12" onClick={() => setIsVideoOn(!isVideoOn)}>
             {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5 text-destructive" />}
           </Button>
        </div>

        <div className="flex items-center justify-center w-1/3">
          {!isStarted ? (
            <Button size="lg" className="rounded-full px-12 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20" onClick={startInterview}>
              Start Interview
            </Button>
          ) : (
            <Button size="lg" variant="destructive" className="rounded-full px-8 font-semibold shadow-lg shadow-destructive/20" onClick={handleEndInterview}>
              <StopCircle className="w-5 h-5 mr-2" /> End Interview
            </Button>
          )}
        </div>

        <div className="w-1/3 flex justify-end">
          <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
             <span className="text-sm font-medium text-white/80 font-mono">REC</span>
          </div>
        </div>
      </div>

    </div>
  )
}
