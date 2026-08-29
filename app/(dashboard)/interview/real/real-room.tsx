"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Editor from "@monaco-editor/react"
import Webcam from "react-webcam"
import { Brain, Monitor, MonitorOff, StopCircle, Code2, AlertTriangle, Mic, MicOff, Video, VideoOff, Loader2 } from "lucide-react"

export function RealInterviewRoom({ role }: { role: string }) {
  const router = useRouter()
  
  // Media states
  const [isMicOn, setIsMicOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const webcamRef = useRef<Webcam>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  // Interview states
  const [isStarted, setIsStarted] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [currentSubtitle, setCurrentSubtitle] = useState("Click 'Start Real Interview' when you are ready to begin.")
  const [code, setCode] = useState("// Write your solution here\n")

  const startInterview = () => {
    setIsStarted(true)
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
    <div className="flex-1 flex flex-col bg-black text-white relative overflow-hidden">
      
      {/* Top Split: Video Cameras & Screen Share */}
      <div className="h-1/2 flex border-b border-white/10 shrink-0">
        
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
            <Button size="sm" variant={isScreenSharing ? "destructive" : "secondary"} onClick={toggleScreenShare} className={!isScreenSharing ? 'bg-amber-500 hover:bg-amber-600 text-black' : ''}>
              {isScreenSharing ? <MonitorOff className="w-4 h-4 mr-2" /> : <Monitor className="w-4 h-4 mr-2" />}
              {isScreenSharing ? "Stop Share" : "Share Screen"}
            </Button>
          </div>
        </div>
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
          <div className="bg-black/70 backdrop-blur-sm border border-white/10 px-6 py-3 rounded-2xl max-w-3xl text-center shadow-xl">
            <p className="text-lg text-white/90">{currentSubtitle}</p>
          </div>
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
              <Button size="lg" className="rounded-full px-8 bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-lg shadow-amber-500/20" onClick={startInterview}>
                Start Real Interview
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
