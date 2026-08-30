"use client"

import * as React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar } from "@/components/avatar/Avatar3D"
import { WebcamPreview } from "./webcam"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  ChevronRight, MessageSquare, Volume2, VolumeX,
  Clock, Loader2, UserCheck, CheckCircle2, ArrowRight
} from "lucide-react"
import { useTTS, useSTT } from "@/hooks/interview/use-speech"
import { useInterviewEngine } from "@/engine/conversation/InterviewEngine"
import { useAvatarExpressions } from "@/hooks/avatar/use-avatar-expressions"

interface Question {
  id: string
  question: string
  category: string
  difficulty: number
}

interface InterviewClientProps {
  interviewId: string
  questions: Question[]
}

type Phase = "avatar_speaking" | "user_answering" | "saving" | "finished"

export function InterviewClient({ interviewId, questions }: InterviewClientProps) {
  const [interviewer] = useState<'aarav' | 'reshma'>(() => Math.random() > 0.5 ? "aarav" : "reshma")
  
  const [phase, setPhase] = useState<Phase>("avatar_speaking")
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isTTSOn, setIsTTSOn] = useState(true)
  const [timer, setTimer] = useState(0)
  const [transcripts, setTranscripts] = useState<Record<string, string>>({})
  const [currentSpeechText, setCurrentSpeechText] = useState("")

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  const { phase: enginePhase, currentQuestionIndex, getAcknowledgment, advancePhase } = useInterviewEngine(questions)
  const { currentEmotion, triggerEmotion } = useAvatarExpressions()

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  const { speak, stop: stopTTS, isSpeaking: isAvatarSpeaking } = useTTS()
  const {
    startListening, stopListening, isListening,
    transcript: liveTranscript, setTranscript, resetTranscript, isSupported: sttSupported, lastSpeechTime
  } = useSTT()
  
  // --- Core Actions ---
  const saveAndAdvance = useCallback(async () => {
    if (phase !== "user_answering") return
    setPhase("saving")
    triggerEmotion("professional")

    stopListening()
    if (timerRef.current) clearInterval(timerRef.current)

    const finalTranscript = liveTranscript.trim()
    const updatedTranscripts = { ...transcripts, [currentQuestion?.id]: finalTranscript }
    setTranscripts(updatedTranscripts)

    try {
      await fetch(`/api/interview/${interviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId,
          transcripts: updatedTranscripts,
          status: currentQuestionIndex < questions.length - 1 ? "in_progress" : "completed"
        })
      })
    } catch (e) {
      console.error("Failed to save transcript:", e)
      // We proceed even if network fails for this prototype, but ideally we'd queue retries.
    }

    if (currentQuestionIndex < questions.length - 1) {
      const ack = getAcknowledgment()
      const nextQ = questions[currentQuestionIndex + 1]
      setCurrentSpeechText(`${ack} Let's continue. ${nextQ.question}`)
      advancePhase()
      triggerEmotion("smile", 2000)
      setPhase("avatar_speaking")
    } else {
      setPhase("finished")
      setTimeout(() => {
        window.location.href = `/report/${interviewId}`
      }, 2000)
    }
  }, [phase, liveTranscript, transcripts, currentQuestion, currentQuestionIndex, questions, interviewId, stopListening, getAcknowledgment, advancePhase, triggerEmotion])

  // --- Speech Sequences ---
  useEffect(() => {
    if (phase !== "avatar_speaking") return

    resetTranscript()
    setTimer(0)
    triggerEmotion("explaining")

    let speechText = currentSpeechText || currentQuestion?.question
    if (currentQuestionIndex === 0 && !currentSpeechText) {
      speechText = `Welcome to your practice session. Let's begin. ${currentQuestion?.question}`
    }

    if (isTTSOn && speechText) {
      speak(speechText)
    } else {
      const t = setTimeout(() => {
        setPhase("user_answering")
        triggerEmotion("listening")
      }, 1500)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentQuestionIndex])

  // --- Auto Advance Logic ---
  useEffect(() => {
    if (phase === "user_answering" && liveTranscript.length > 5) {
      const silenceDuration = Date.now() - lastSpeechTime
      if (silenceDuration > 4000) { // 4 seconds of silence = auto advance
        saveAndAdvance()
      }
    }
  }, [phase, liveTranscript, lastSpeechTime, saveAndAdvance])

  const handleEndInterview = useCallback(() => {
    stopTTS()
    stopListening()
    if (timerRef.current) clearInterval(timerRef.current)
    window.location.href = '/history'
  }, [stopTTS, stopListening])

  // --- Render Active Session ---
  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col font-sans overflow-hidden">
      
      {/* HEADER */}
      <header className="h-14 border-b border-white/10 px-6 flex items-center justify-between shrink-0 bg-zinc-950/50 backdrop-blur-md z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center font-bold text-primary">
            IN
          </div>
          <div className="hidden sm:block">
            <h1 className="font-semibold tracking-tight text-sm">Practice Interview</h1>
          </div>
        </div>

        <div className="flex items-center gap-6 md:w-1/4">
          <div className="flex-1">
            <div className="flex justify-between text-[10px] uppercase tracking-wider mb-1 font-medium text-white/50">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5 bg-white/10" />
          </div>
          <Button variant="ghost" size="sm" onClick={handleEndInterview} className="text-white/50 hover:text-destructive shrink-0 h-8 text-xs">
            End
          </Button>
        </div>
      </header>

      {/* MAIN STAGE: 40 / 40 / 20 Split */}
      <main className="flex-1 flex flex-row w-full relative">
        
        {/* Left 40%: Interviewer Avatar */}
        <div className="w-[40%] relative border-r border-white/10 bg-zinc-900">
           <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
             <span className="text-xs font-medium text-white/80 tracking-wide uppercase">Interviewer</span>
           </div>
           
           <Canvas shadows camera={{ position: [0, 1.5, 3.5], fov: 45 }}>
             <ambientLight intensity={0.5} />
             <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
             <Environment preset="city" />
             <Avatar isSpeaking={isAvatarSpeaking} emotion={currentEmotion} interviewerType={interviewer} />
             <ContactShadows position={[0, -0.6, 0]} opacity={0.6} scale={10} blur={2.5} far={4} color="#000000" />
             <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 3} />
           </Canvas>
        </div>

        {/* Center 40%: User Camera */}
        <div className="w-[40%] relative border-r border-white/10 bg-black flex flex-col items-center justify-center">
           <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
             <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
             <span className="text-xs font-medium text-white/80 tracking-wide uppercase">You</span>
           </div>

           {isCameraOn ? (
             <WebcamPreview isCameraOn={true} />
           ) : (
             <div className="flex flex-col items-center text-white/30">
               <VideoOff className="w-12 h-12 mb-2" />
               <p className="text-sm">Camera Disabled</p>
             </div>
           )}

           {/* Controls overlay */}
           <div className="absolute top-4 right-4 z-10 flex gap-2">
             <Button variant="outline" size="icon" onClick={() => setIsMicOn(!isMicOn)} className={`h-8 w-8 rounded-full bg-black/40 border-white/10 ${!isMicOn ? "text-destructive" : "text-white"}`}>
               {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
             </Button>
             <Button variant="outline" size="icon" onClick={() => setIsCameraOn(!isCameraOn)} className={`h-8 w-8 rounded-full bg-black/40 border-white/10 ${!isCameraOn ? "text-destructive" : "text-white"}`}>
               {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
             </Button>
           </div>
        </div>

        {/* Subtitles Overlay (Spanning left 80%) */}
        <div className="absolute bottom-0 left-0 w-[80%] p-8 z-20 pointer-events-none flex flex-col justify-end bg-gradient-to-t from-black via-black/60 to-transparent pt-32 h-64">
           {phase === "avatar_speaking" && currentSpeechText && (
             <div className="max-w-4xl mx-auto w-full">
               <p className="text-2xl md:text-3xl font-medium text-white/90 drop-shadow-lg text-center leading-relaxed">
                 {currentSpeechText}
               </p>
             </div>
           )}
           {phase === "user_answering" && (
             <div className="max-w-4xl mx-auto w-full">
               {liveTranscript ? (
                 <p className="text-2xl md:text-3xl font-medium text-white/90 drop-shadow-lg text-center leading-relaxed">
                   {liveTranscript}
                 </p>
               ) : (
                 <p className="text-xl md:text-2xl font-medium text-white/40 drop-shadow-lg text-center italic">
                   Listening...
                 </p>
               )}
             </div>
           )}
           {phase === "saving" && (
             <div className="max-w-4xl mx-auto w-full flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                <p className="text-xl font-medium text-white/70">Processing your answer...</p>
             </div>
           )}
        </div>

        {/* Right 20%: Conversation History */}
        <div className="w-[20%] bg-zinc-950 flex flex-col overflow-hidden relative">
          <div className="p-4 border-b border-white/10 bg-zinc-900/50 shrink-0">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">Conversation</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6 flex flex-col">
            {questions.map((q, idx) => {
              if (idx > currentQuestionIndex) return null
              
              const isCurrent = idx === currentQuestionIndex
              const answer = transcripts[q.id]

              return (
                <div key={q.id} className={`space-y-3 ${isCurrent ? 'opacity-100' : 'opacity-50'}`}>
                  {/* Question */}
                  <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg rounded-tl-none">
                    <p className="text-[10px] font-bold text-primary mb-1 uppercase tracking-wider">Interviewer</p>
                    <p className="text-sm text-white/90 leading-snug">{q.question}</p>
                  </div>

                  {/* Answer */}
                  {(answer || isCurrent) && (
                    <div className="bg-zinc-800 border border-white/10 p-3 rounded-lg rounded-tr-none ml-4">
                      <p className="text-[10px] font-bold text-white/50 mb-1 uppercase tracking-wider flex justify-between">
                        You
                        {isCurrent && phase === "user_answering" && <span className="text-red-400 animate-pulse">Recording...</span>}
                      </p>
                      <p className="text-sm text-white/80 leading-snug break-words">
                        {answer || (isCurrent && liveTranscript) || <span className="italic opacity-50">...</span>}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </main>
    </div>
  )
}
