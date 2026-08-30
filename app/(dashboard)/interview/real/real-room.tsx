"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Editor from "@monaco-editor/react"
import Webcam from "react-webcam"
import { Brain, Monitor, MonitorOff, StopCircle, Code2, AlertTriangle, Mic, MicOff, Video, VideoOff, Loader2, Maximize2, Minimize2, Lock, Sparkles, ArrowRight } from "lucide-react"

export function RealInterviewRoom({ role }: { role: string }) {
  const router = useRouter()
  
  // Media states
  const [isMicOn, setIsMicOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const webcamRef = useRef<Webcam>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  // Fullscreen & Lock states
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showExitWarning, setShowExitWarning] = useState(false)

  // Interview states
  const [isStarted, setIsStarted] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [currentSubtitle, setCurrentSubtitle] = useState("Position your camera and prepare to share your screen. Click 'Start Real Interview' to begin with full screen lock.")
  const [code, setCode] = useState("// Write your solution here\nfunction reverseString(str) {\n  return str.split('').reverse().join('');\n}\n")

  // Lock Screen: prevent user from closing tab or navigating away
  useEffect(() => {
    if (!isStarted || isFinished) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = "Your Real-Time Evaluation is actively in progress. Leaving will cancel your session."
      return e.returnValue
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isStarted, isFinished])

  // Fullscreen listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocFullscreen = Boolean(document.fullscreenElement)
      setIsFullscreen(isDocFullscreen)
      if (!isDocFullscreen && isStarted && !isFinished) {
        setShowExitWarning(true)
      } else {
        setShowExitWarning(false)
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [isStarted, isFinished])

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
        setShowExitWarning(false)
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
          setIsFullscreen(false)
        }
      }
    } catch {
      setIsFullscreen(!isFullscreen)
    }
  }

  const startInterview = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen().catch(() => {})
      }
    } catch {}

    setIsFullscreen(true)
    setIsStarted(true)
    setShowExitWarning(false)
    setAiSpeaking(true)
    setCurrentSubtitle(`Welcome to your Real-Time Interview for ${role}. Please share your screen so I can review your live coding and case study presentation.`)
    
    setTimeout(() => {
      setAiSpeaking(false)
      setCurrentSubtitle("Listening...")
    }, 6000)
  }

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (stream) stream.getTracks().forEach(track => track.stop())
      setIsScreenSharing(false)
      setStream(null)
      if (screenVideoRef.current) screenVideoRef.current.srcObject = null
    } else {
      try {
        const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        setStream(mediaStream)
        setIsScreenSharing(true)
        if (screenVideoRef.current) screenVideoRef.current.srcObject = mediaStream
        
        // AI reacts to screen share
        setAiSpeaking(true)
        setCurrentSubtitle("Great, I can see your screen now. Let's start with a coding challenge. Write a function in the editor to reverse a string.")
        
        setTimeout(() => {
          setAiSpeaking(false)
          setCurrentSubtitle("Listening...")
        }, 5000)

        mediaStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false)
          setStream(null)
        }
      } catch (err) {
        console.error("Screen share failed", err)
      }
    }
  }

  const handleEndInterview = () => {
    if (stream) stream.getTracks().forEach(track => track.stop())
    setIsFinished(true)
    setTimeout(() => {
      // Hardcoded to 85 to demonstrate success path
      router.push(`/interview/results?mode=real&score=85&role=${encodeURIComponent(role)}`)
    }, 3000)
  }

  if (isFinished) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-card">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
          <Monitor className="w-10 h-10 text-amber-500 animate-pulse" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Compiling Results...</h2>
        <p className="text-muted-foreground max-w-md mx-auto">Scoring your live coding, screen presentation, and analyzing your speech.</p>
        <div className="mt-8 flex gap-2 items-center text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Finalizing AI analysis
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`flex flex-col bg-zinc-950 text-white relative select-none ${
        isFullscreen 
          ? "fixed inset-0 z-[9999] w-screen h-screen m-0 p-0 rounded-none" 
          : "flex-1 w-full h-full min-h-[550px]"
      }`}
    >
      {/* Locked Screen Security Warning Overlay */}
      {showExitWarning && isStarted && !isFinished && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Screen Lock Alert</h3>
          <p className="text-white/70 max-w-md mb-6 text-sm">
            Your Real-Time Evaluation is actively in progress. To protect interview integrity, please stay in full-screen mode.
          </p>
          <div className="flex gap-3">
            <Button 
              size="lg" 
              onClick={toggleFullscreen} 
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold gap-2"
            >
              <Maximize2 className="w-4 h-4" /> Re-enter Fullscreen & Lock
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleEndInterview} 
              className="border-white/20 text-white hover:bg-white/10"
            >
              End Interview Early
            </Button>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="h-14 px-6 bg-zinc-900/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
            IN
          </div>
          <h2 className="text-sm font-semibold text-white/90 truncate max-w-[200px] md:max-w-md">
            Real-Time Simulation: {role}
          </h2>
          {isStarted && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Lock className="w-3 h-3" /> Screen Locked
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleFullscreen} 
            className="text-white/70 hover:text-white hover:bg-white/10 text-xs gap-1.5 h-8"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden md:inline">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </Button>
        </div>
      </div>
      
      {/* Top Split: Video Cameras & Screen Share */}
      <div className="h-1/2 flex border-b border-white/10 shrink-0 relative">
        
        {/* User Webcam & AI Avatar */}
        <div className="w-1/3 flex flex-col border-r border-white/10">
           {/* AI Avatar */}
           <div className="h-1/2 bg-zinc-950 flex items-center justify-center relative overflow-hidden border-b border-white/10">
             <div className={`absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent transition-opacity duration-700 ${aiSpeaking ? 'opacity-100' : 'opacity-0'}`} />
             <div className="relative w-24 h-24 flex items-center justify-center">
               <div className={`absolute inset-0 bg-amber-500/20 rounded-full blur-xl transition-all duration-300 ${aiSpeaking ? 'scale-150 opacity-100 animate-pulse' : 'scale-100 opacity-50'}`} />
               <div className={`absolute inset-4 bg-amber-500/40 rounded-full blur-md transition-all duration-150 ${aiSpeaking ? 'scale-110' : 'scale-100'}`} />
               <div className="relative w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center shadow-2xl">
                 <Brain className="w-8 h-8 text-black" />
               </div>
             </div>
             <div className="absolute bottom-2 left-3 flex items-center gap-2">
                <span className="text-xs font-semibold tracking-wide text-white/80">INTRLY AI</span>
                {aiSpeaking && <div className="flex gap-0.5 items-end h-3">
                  <div className="w-0.5 bg-amber-500 h-full animate-pulse" />
                  <div className="w-0.5 bg-amber-500 h-1/2 animate-pulse delay-75" />
                  <div className="w-0.5 bg-amber-500 h-3/4 animate-pulse delay-150" />
                </div>}
             </div>
           </div>

           {/* User Webcam */}
           <div className="h-1/2 bg-zinc-900 relative flex items-center justify-center">
              {isVideoOn ? (
                <Webcam audio={false} ref={webcamRef} mirrored={true} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-white/30">
                  <VideoOff className="w-8 h-8 mb-2" />
                  <p className="text-xs">Camera disabled</p>
                </div>
              )}
              <div className="absolute bottom-2 left-3 bg-black/60 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-2">
                {!isMicOn && <MicOff className="w-3 h-3 text-destructive" />} You
              </div>
           </div>
        </div>

        {/* Screen Share / Case Study Display */}
        <div className="w-2/3 bg-zinc-900 relative group flex items-center justify-center overflow-hidden">
          <video ref={screenVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!isScreenSharing ? 'hidden' : ''}`} />
          {!isScreenSharing && (
            <div className="flex flex-col items-center text-white/50 text-center px-8">
              <MonitorOff className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium text-white/80">Screen Sharing is Paused</p>
              <p className="text-sm mt-2 max-w-sm">When the AI asks to review your case study or live project, click the button below to share your screen.</p>
            </div>
          )}
          
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button size="sm" variant={isScreenSharing ? "destructive" : "secondary"} onClick={toggleScreenShare} className={!isScreenSharing ? 'bg-amber-500 hover:bg-amber-600 text-black font-semibold' : ''}>
              {isScreenSharing ? <MonitorOff className="w-4 h-4 mr-2" /> : <Monitor className="w-4 h-4 mr-2" />}
              {isScreenSharing ? "Stop Share" : "Share Screen"}
            </Button>
          </div>
        </div>

        {/* Central Overlay before start */}
        {!isStarted && (
          <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 shadow-lg border border-amber-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold mb-1.5 text-white">Ready for Real-Time Simulation?</h4>
            <p className="text-xs text-white/70 max-w-xs mb-5">
              Locks your screen in full-screen mode for a live proctored coding and presentation interview.
            </p>
            <Button 
              size="lg" 
              onClick={startInterview} 
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-6 rounded-full shadow-xl shadow-amber-500/30 text-base gap-2 hover:scale-105 transition-all duration-300"
            >
              <Lock className="w-4 h-4" /> Start Real Interview (Lock Screen)
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Split: Code Editor & Subtitles */}
      <div className="h-1/2 flex flex-col relative">
        <div className="flex-1 bg-[#1e1e1e] flex flex-col relative">
          <div className="h-8 shrink-0 bg-[#252526] flex items-center px-4 border-b border-black/50 text-xs text-white/70 font-mono gap-2">
            <Code2 className="w-4 h-4" /> Live Code Editor (solution.js)
          </div>
          <div className="flex-1 min-h-0 relative">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v || "")}
              options={{ minimap: { enabled: false }, fontSize: 14 }}
            />
          </div>
        </div>

        {/* Subtitles Overlay */}
        <div className="absolute bottom-20 left-0 w-full pointer-events-none z-20 flex justify-center p-4">
          <div className="bg-black/80 backdrop-blur-sm border border-white/10 px-6 py-3 rounded-2xl max-w-3xl text-center shadow-xl">
            <p className="text-base md:text-lg text-white/90">{currentSubtitle}</p>
          </div>
        </div>

        {/* Control Bar */}
        <div className="h-20 bg-zinc-950/95 border-t border-white/10 flex items-center justify-between px-8 shrink-0 relative z-30">
          <div className="flex items-center gap-3 w-1/3">
             <Button variant="outline" size="icon" className={`rounded-full h-11 w-11 border-white/10 transition-all ${isMicOn ? "bg-white/10 text-white" : "bg-destructive text-white"}`} onClick={() => setIsMicOn(!isMicOn)}>
               {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-destructive" />}
             </Button>
             <Button variant="outline" size="icon" className={`rounded-full h-11 w-11 border-white/10 transition-all ${isVideoOn ? "bg-white/10 text-white" : "bg-destructive text-white"}`} onClick={() => setIsVideoOn(!isVideoOn)}>
               {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5 text-destructive" />}
             </Button>
             <Button variant="outline" size="icon" className="hidden sm:flex rounded-full h-11 w-11 border-white/10 bg-white/10 text-white" onClick={toggleFullscreen}>
               {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
             </Button>
          </div>

          <div className="flex items-center justify-center w-1/3">
            {!isStarted ? (
              <Button size="lg" className="rounded-full px-8 md:px-12 bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-lg shadow-amber-500/25 gap-2" onClick={startInterview}>
                <Lock className="w-4 h-4" /> Start Real Interview (Lock Screen)
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
               <span className="text-sm font-medium text-white/80 font-mono">LIVE EVALUATION</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  )
}
