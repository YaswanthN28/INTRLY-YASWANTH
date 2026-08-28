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

  const { speak, stop: stopTTS, isSpeaking } = useTTS()
  const {
    startListening, stopListening, isListening,
    transcript: liveTranscript, setTranscript, resetTranscript, isSupported: sttSupported
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

  useEffect(() => {
    if (phase === "avatar_speaking" && isTTSOn && !isSpeaking) {
      const t = setTimeout(() => {
        setPhase("user_answering")
        triggerEmotion("listening")
      }, 600)
      return () => clearTimeout(t)
    }
  }, [isSpeaking, phase, isTTSOn, triggerEmotion])

  useEffect(() => {
    if (phase !== "user_answering") return

    if (isMicOn && sttSupported) {
      startListening()
    }

    timerRef.current = setInterval(() => {
      setTimer(t => t + 1)
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase, isMicOn, sttSupported, startListening])

  const handleEndInterview = () => {
    if (confirm("Are you sure you want to end the practice session? Your progress will be saved.")) {
      stopTTS()
      stopListening()
      window.location.href = "/history"
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0")
    const s = (secs % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  const isAvatarSpeaking = phase === "avatar_speaking" && isSpeaking

  // --- Render Finished ---
  if (phase === "finished") {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 gap-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary"
        >
          <CheckCircle2 className="w-12 h-12" />
        </motion.div>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Practice Complete</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your interview session has been recorded successfully. Generating your evaluation report...
          </p>
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // --- Render Active Session ---
  return (
    <div className="min-h-screen w-full bg-background flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="h-16 border-b border-border/50 px-4 md:px-8 flex items-center justify-between bg-card shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center font-bold text-primary">
            IN
          </div>
          <div className="hidden sm:block">
            <h1 className="font-semibold tracking-tight text-sm">Practice Interview</h1>
            <p className="text-xs text-muted-foreground">Rehearse your answers before the real interview.</p>
          </div>
        </div>

        <div className="flex items-center gap-6 md:w-1/3 md:max-w-md">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1.5 font-medium">
              <span className="text-muted-foreground">Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span className="text-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <Button variant="ghost" size="sm" onClick={handleEndInterview} className="text-muted-foreground hover:text-destructive shrink-0">
            End Practice
          </Button>
        </div>
      </header>

      {/* MAIN STAGE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Question & Answer (High Priority) */}
        <div className="flex-1 flex flex-col">
          <div className="mb-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border/50 text-xs font-medium text-muted-foreground">
              {currentQuestion?.category} • {currentQuestion?.difficulty === 1 ? 'Beginner' : currentQuestion?.difficulty === 2 ? 'Intermediate' : 'Advanced'}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold leading-tight text-foreground">
              {currentQuestion?.question}
            </h2>
          </div>

          <Card className="flex-1 border-border/50 shadow-sm flex flex-col overflow-hidden">
             <CardHeader className="bg-muted/20 border-b border-border/50 py-3 px-4 flex flex-row items-center justify-between shrink-0">
               <div className="flex items-center gap-2">
                 <MessageSquare className="w-4 h-4 text-primary" />
                 <CardTitle className="text-sm font-medium">Your Answer</CardTitle>
               </div>
               <div className="flex items-center gap-3">
                  {phase === "user_answering" && isListening && (
                    <span className="flex items-center gap-1.5 text-xs text-red-500 font-medium animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-red-500" /> Recording
                    </span>
                  )}
                  {phase === "user_answering" && (
                    <span className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(timer)}
                    </span>
                  )}
               </div>
             </CardHeader>
             <CardContent className="flex-1 p-0 flex flex-col relative bg-background">
                {/* Overlay if avatar is speaking */}
                {phase === "avatar_speaking" && (
                  <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Volume2 className="w-6 h-6 text-primary animate-pulse" />
                    </div>
                    <p className="font-semibold text-lg">Listen to the question</p>
                    <p className="text-sm text-muted-foreground mt-1">You can answer once the interviewer finishes speaking.</p>
                  </div>
                )}
                
                {/* Overlay if saving */}
                {phase === "saving" && (
                  <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                    <p className="font-semibold text-lg">Submitting Answer...</p>
                  </div>
                )}

                <Textarea 
                  className="flex-1 border-0 rounded-none shadow-none resize-none focus-visible:ring-0 p-6 text-base leading-relaxed md:text-lg"
                  placeholder="Start speaking, or type your answer here..."
                  value={liveTranscript}
                  onChange={(e) => setTranscript(e.target.value)}
                  disabled={phase !== "user_answering"}
                />
             </CardContent>
             <div className="p-4 border-t border-border/50 bg-muted/20 flex items-center justify-between shrink-0">
               <div className="flex gap-2">
                 <Button variant="outline" size="sm" onClick={() => setIsMicOn(!isMicOn)} className={!isMicOn ? "text-destructive" : ""}>
                   {isMicOn ? <Mic className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />}
                   {isMicOn ? "Mic On" : "Mic Off"}
                 </Button>
                 <Button variant="outline" size="sm" onClick={() => setIsCameraOn(!isCameraOn)} className={!isCameraOn ? "text-destructive" : ""}>
                   {isCameraOn ? <Video className="w-4 h-4 mr-2" /> : <VideoOff className="w-4 h-4 mr-2" />}
                   {isCameraOn ? "Cam On" : "Cam Off"}
                 </Button>
               </div>
               <Button 
                 onClick={saveAndAdvance} 
                 disabled={phase !== "user_answering" || !liveTranscript.trim()}
                 className="shadow-sm pl-6"
               >
                 Submit Answer <ArrowRight className="w-4 h-4 ml-2" />
               </Button>
             </div>
          </Card>
        </div>

        {/* Right Column: Context (Lower Priority) */}
        <div className="w-full lg:w-[320px] xl:w-[380px] shrink-0 flex flex-col gap-6">
           
           <Card className="border-border/50 shadow-sm overflow-hidden">
             <CardHeader className="bg-muted/20 border-b border-border/50 py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  Interviewer
                  {phase === "avatar_speaking" && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full animate-pulse uppercase tracking-wider">Speaking</span>}
                </CardTitle>
             </CardHeader>
             <div className="aspect-square relative bg-muted/50 cursor-grab active:cursor-grabbing">
                <Canvas shadows camera={{ position: [0, 1.5, 3.5], fov: 45 }}>
                  <color attach="background" args={["transparent"]} />
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
                  <Environment preset="city" />
                  <Avatar isSpeaking={isAvatarSpeaking} emotion={currentEmotion} interviewerType={interviewer} />
                  <ContactShadows position={[0, -0.6, 0]} opacity={0.6} scale={10} blur={2.5} far={4} />
                  <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 3} />
                </Canvas>
             </div>
           </Card>

           <Card className="border-border/50 shadow-sm overflow-hidden">
             <CardHeader className="bg-muted/20 border-b border-border/50 py-3 px-4">
                <CardTitle className="text-sm font-medium">Your Camera</CardTitle>
             </CardHeader>
             <div className="aspect-video relative bg-black shrink-0">
                <WebcamPreview isCameraOn={isCameraOn} />
                {!isCameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white/50 backdrop-blur-sm">
                    <VideoOff className="w-6 h-6 mb-2 opacity-50" />
                    <span className="text-xs font-medium tracking-wide">Camera Disabled</span>
                  </div>
                )}
             </div>
           </Card>
        </div>

      </main>
    </div>
  )
}
