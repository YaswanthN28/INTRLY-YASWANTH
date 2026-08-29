"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Webcam from "react-webcam"
import Editor from "@monaco-editor/react"
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, StopCircle, Loader2 } from "lucide-react"
import { Canvas } from "@react-three/fiber"
import { Environment, ContactShadows, OrbitControls } from "@react-three/drei"
import { InterviewState } from "@/lib/interview/types"
import { MockAIProvider, MockSTTProvider, MockTTSProvider } from "@/lib/interview/mock-providers"

// Using lazy loaded ErrorBoundary to catch missing GLB
import { ErrorBoundary } from "react-error-boundary"
import { AaravAvatar } from "@/components/interview/AaravAvatar"

export function NewVideoRoom({ role, isCoding }: { role: string, isCoding: boolean }) {
  const router = useRouter()
  
  // Media states
  const [isMicOn, setIsMicOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const webcamRef = useRef<Webcam>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  // Interview Engine State
  const [state, setState] = useState<InterviewState>('IDLE')
  const [aiSubtitle, setAiSubtitle] = useState("")
  const [userTranscript, setUserTranscript] = useState("")
  const [code, setCode] = useState("// Write your solution here\n")

  // Providers
  const aiProvider = useRef(new MockAIProvider())
  const sttProvider = useRef(new MockSTTProvider())
  const ttsProvider = useRef(new MockTTSProvider())

  const startInterview = async () => {
    setState('INITIALIZING')
    await aiProvider.current.initialize()
    
    // Begin greeting
    setState('AI_SPEAKING')
    const greeting = `Hello! I'm Aarav, your AI interviewer for the ${role} position.`
    setAiSubtitle(greeting)
    
    await ttsProvider.current.speak(greeting, 
      () => setState('AI_SPEAKING'),
      () => {
        setAiSubtitle("")
        startListening()
      }
    )
  }

  const startListening = async () => {
    setState('LISTENING')
    setUserTranscript("")
    
    await sttProvider.current.startListening(
      (interim) => {
        setState('TRANSCRIBING')
        setUserTranscript(interim)
      },
      async (final) => {
        setUserTranscript(final)
        await sttProvider.current.stopListening()
        
        setState('THINKING')
        setAiSubtitle("...")
        
        const response = await aiProvider.current.processAnswer(final)
        
        setState('AI_SPEAKING')
        setAiSubtitle(response)
        await ttsProvider.current.speak(response, 
          () => setState('AI_SPEAKING'),
          () => {
            setAiSubtitle("")
            startListening() // loop back
          }
        )
      }
    )
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
        mediaStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false)
          setStream(null)
        }
      } catch (err) {
        console.error("Screen share failed", err)
      }
    }
  }

  const handleEndInterview = async () => {
    setState('COMPLETED')
    await sttProvider.current.stopListening()
    await ttsProvider.current.stop()
    if (stream) stream.getTracks().forEach(track => track.stop())
    
    setTimeout(() => {
      router.push(`/interview/results?mode=real&score=85&role=${encodeURIComponent(role)}`)
    }, 2000)
  }

  // Derive mood from state
  const getAvatarMood = () => {
    switch (state) {
      case 'AI_SPEAKING': return 'speaking'
      case 'LISTENING':
      case 'TRANSCRIBING': return 'listening'
      case 'THINKING': return 'thinking'
      default: return 'idle'
    }
  }

  return (
    <div className="flex-1 flex flex-col relative">
      
      {/* Top Section: AI Avatar & Candidate Camera */}
      <div className={`flex border-b border-white/10 ${isCoding ? 'h-1/2' : 'flex-1'}`}>
        
        {/* Left: Aarav 3D Environment */}
        <div className="flex-1 bg-zinc-900 relative">
          <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1 rounded-md text-xs font-semibold text-white/90">
             State: {state}
          </div>
          
          <ErrorBoundary fallback={<div className="flex items-center justify-center h-full text-white/50 text-sm">aarav.glb not found in public/models/</div>}>
            <Canvas camera={{ position: [0, 1.5, 3], fov: 45 }}>
              <Environment preset="city" />
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <AaravAvatar mood={getAvatarMood()} />
              <ContactShadows opacity={0.5} scale={10} blur={2} far={4} color="#000000" />
              <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 2} />
            </Canvas>
          </ErrorBoundary>

          {/* AI Subtitles Overlay */}
          {aiSubtitle && (
             <div className="absolute bottom-6 w-full px-12 z-20 pointer-events-none">
               <div className="bg-black/80 backdrop-blur-md border border-white/10 px-6 py-4 rounded-xl text-center">
                 <p className="text-lg text-white font-medium">{aiSubtitle}</p>
               </div>
             </div>
          )}
        </div>

        {/* Right: Candidate Camera & Screen Share */}
        <div className="w-80 border-l border-white/10 flex flex-col shrink-0">
          <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
             {isVideoOn ? (
               <Webcam audio={false} ref={webcamRef} mirrored={true} className="w-full h-full object-cover" />
             ) : (
               <div className="text-white/30 text-xs flex flex-col items-center"><VideoOff className="w-6 h-6 mb-2"/> Camera off</div>
             )}
             <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white/80">Candidate</div>
          </div>
          
          <div className="flex-1 bg-zinc-950 border-t border-white/10 relative flex items-center justify-center overflow-hidden">
             <video ref={screenVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!isScreenSharing ? 'hidden' : ''}`} />
             {!isScreenSharing && (
               <div className="text-white/30 text-xs flex flex-col items-center"><MonitorOff className="w-6 h-6 mb-2"/> Screen share off</div>
             )}
          </div>
        </div>
      </div>

      {/* Code Editor (if coding interview) */}
      {isCoding && (
        <div className="h-1/2 flex flex-col">
          <div className="h-8 bg-[#252526] border-b border-black flex items-center px-4 text-xs font-mono text-white/70">
            solution.js
          </div>
          <div className="flex-1 relative">
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
      )}

      {/* Bottom Subtitles & Controls */}
      <div className="h-24 bg-zinc-950 border-t border-white/10 shrink-0 flex items-center justify-between px-6 z-30">
        
        {/* Candidate Transcript */}
        <div className="flex-1 text-sm text-white/70 pr-4 italic truncate">
          {userTranscript && `You: "${userTranscript}"`}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 shrink-0">
           <Button variant="outline" size="icon" className="bg-white/5 border-white/10 hover:bg-white/20 text-white rounded-full" onClick={() => setIsMicOn(!isMicOn)}>
             {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-destructive" />}
           </Button>
           <Button variant="outline" size="icon" className="bg-white/5 border-white/10 hover:bg-white/20 text-white rounded-full" onClick={() => setIsVideoOn(!isVideoOn)}>
             {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5 text-destructive" />}
           </Button>
           <Button variant="outline" size="icon" className="bg-white/5 border-white/10 hover:bg-white/20 text-white rounded-full" onClick={toggleScreenShare}>
             {isScreenSharing ? <Monitor className="w-5 h-5 text-amber-500" /> : <MonitorOff className="w-5 h-5" />}
           </Button>
           
           <div className="w-px h-8 bg-white/10 mx-2" />
           
           {state === 'IDLE' ? (
             <Button className="bg-primary hover:bg-primary/90 rounded-full px-8" onClick={startInterview}>
               Start
             </Button>
           ) : (
             <Button variant="destructive" className="rounded-full px-8 gap-2" onClick={handleEndInterview}>
               <StopCircle className="w-4 h-4" /> End
             </Button>
           )}
        </div>
      </div>

    </div>
  )
}
