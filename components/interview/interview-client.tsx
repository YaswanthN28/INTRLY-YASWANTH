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
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  ChevronRight, MessageSquare, Volume2, VolumeX,
  Clock, Loader2, UserCheck, CheckCircle2
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
  // Randomly select interviewer on initial load
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
    transcript: liveTranscript, resetTranscript, isSupported: sttSupported, lastSpeechTime
  } = useSTT()
  
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState<number | null>(null)

  // ── Save transcript & Auto-advance ───────────────────────────
  const saveAndAdvance = useCallback(async () => {
    if (phase !== "user_answering") return
    setPhase("saving")
    triggerEmotion("professional")

    stopListening()
    if (timerRef.current) clearInterval(timerRef.current)

    const finalTranscript = liveTranscript.trim() ||
      "(No response recorded — microphone may be off or browser STT not supported)"

    const updatedTranscripts = { ...transcripts, [currentQuestion.id]: finalTranscript }
    setTranscripts(updatedTranscripts)

    // Save to Supabase
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
    }

    if (currentQuestionIndex < questions.length - 1) {
      // Pick random acknowledgment and advance question
      const ack = getAcknowledgment()
      const nextQ = questions[currentQuestionIndex + 1]
      
      // Combine for the voice synthesis, but only show question text in subtitles
      setCurrentSpeechText(`${ack} Let's continue. ${nextQ.question}`)
      
      advancePhase()
      triggerEmotion("smile", 2000)
      setPhase("avatar_speaking")
    } else {
      setPhase("finished")
      setTimeout(() => {
        window.location.href = `/report/${interviewId}`
      }, 2500)
    }
    
    setAutoSubmitCountdown(null)
  }, [phase, liveTranscript, transcripts, currentQuestion, currentQuestionIndex, questions, interviewId, stopListening, getAcknowledgment, advancePhase, triggerEmotion])

  // ── Phase: AVATAR_SPEAKING ──────────────────────────────────────
  useEffect(() => {
    if (phase !== "avatar_speaking") return

    resetTranscript()
    setTimer(0)
    triggerEmotion("explaining")

    // On the very first question, prepend the greeting
    let speechText = currentSpeechText || currentQuestion.question
    if (currentQuestionIndex === 0 && !currentSpeechText) {
      const greetingText = `Hello! Welcome to INTRLY. I'm ${interviewer === 'aarav' ? 'Aarav' : 'Reshma'}, your AI Interview Partner. I'll be conducting today's interview. Relax and answer naturally. Let's begin. `
      speechText = greetingText + currentQuestion.question
    }

    if (isTTSOn) {
      const voiceId = interviewer === 'aarav' ? "pNInz6obbfDQGcgMyIGD" : "EXAVITQu4vr4xnSDxMaL"
      speak(speechText, voiceId)
    } else {
      const t = setTimeout(() => setPhase("user_answering"), 2000)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentQuestionIndex])

  // Transition to user_answering once avatar finishes speaking
  useEffect(() => {
    if (phase === "avatar_speaking" && isTTSOn && !isSpeaking) {
      const t = setTimeout(() => {
        setPhase("user_answering")
        triggerEmotion("listening")
      }, 600)
      return () => clearTimeout(t)
    }
  }, [isSpeaking, phase, isTTSOn, triggerEmotion])

  // ── Phase: USER_ANSWERING ───────────────────────────────────────
  useEffect(() => {
    if (phase !== "user_answering") return

    if (isMicOn && sttSupported) {
      startListening()
    }

    // VAD Auto-submit & Timer
    timerRef.current = setInterval(() => {
      setTimer(t => t + 1)
      
      if (lastSpeechTime > 0) {
        const timeSinceLastSpeech = Date.now() - lastSpeechTime
        const silenceThreshold = 5000 // 5 seconds silence threshold
        
        if (timeSinceLastSpeech >= silenceThreshold && liveTranscript.length > 0) {
          saveAndAdvance()
        } else if (timeSinceLastSpeech >= silenceThreshold - 3000 && liveTranscript.length > 0) {
          setAutoSubmitCountdown(Math.ceil((silenceThreshold - timeSinceLastSpeech) / 1000))
        } else {
          setAutoSubmitCountdown(null)
        }
      }
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      setAutoSubmitCountdown(null)
    }
  }, [phase, lastSpeechTime, liveTranscript, saveAndAdvance, isMicOn, sttSupported, startListening])

  const handleEndInterview = () => {
    if (confirm("Are you sure you want to end the interview early?")) {
      stopTTS()
      stopListening()
      window.location.href = "/dashboard"
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0")
    const s = (secs % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  const isAvatarSpeaking = phase === "avatar_speaking" && isSpeaking


  // ── FINISHED SCREEN ─────────────────────────────────────────────
  if (phase === "finished") {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white gap-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center"
        >
          <span className="text-4xl">🎉</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center">
          <h1 className="text-3xl font-bold mb-2">Interview Complete!</h1>
          <p className="text-muted-foreground">Generating your report...</p>
        </motion.div>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-black flex flex-col text-white overflow-hidden font-sans">
      {/* HEADER */}
      <header className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-black/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center font-bold text-primary-foreground text-sm">I</div>
          <div>
            <h1 className="font-semibold tracking-tight text-sm">Technical Interview</h1>
            <p className="text-xs text-muted-foreground">{currentQuestion.category} · Difficulty {currentQuestion.difficulty}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 w-1/3 max-w-sm">
          <AnimatePresence>
            {phase === "user_answering" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-sm font-mono text-amber-400"
              >
                <Clock className="w-4 h-4" />
                {formatTime(timer)}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1.5 text-muted-foreground">
              <span>Progress</span>
              <span>{currentQuestionIndex + 1} / {questions.length}</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </div>
      </header>

      {/* MAIN STAGE */}
      <main className="flex-1 p-4 md:p-6 flex flex-col md:flex-row gap-6 overflow-hidden relative z-0">
        {/* Subtle Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Left Column: Avatar */}
        <div className="flex-[1.5] bg-black/40 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10 relative flex flex-col shadow-2xl">
          <div className="absolute top-6 left-6 z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-full backdrop-blur-md border text-xs font-semibold tracking-wide
                  ${phase === "avatar_speaking"
                    ? "bg-primary/20 border-primary/30 text-primary"
                    : phase === "user_answering"
                    ? "bg-green-500/20 border-green-500/30 text-green-400"
                    : "bg-white/10 border-white/10 text-white/60"}`}
              >
                <span className={`w-2 h-2 rounded-full ${phase === "avatar_speaking" ? "bg-primary animate-pulse" : phase === "user_answering" ? "bg-green-500 animate-[pulse_1s_infinite]" : "bg-white/40"}`} />
                {phase === "avatar_speaking" 
                  ? `${interviewer === 'aarav' ? 'Aarav' : 'Reshma'} Speaking` 
                  : phase === "user_answering" 
                  ? "Your Turn — Speak Now" 
                  : "Processing..."}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex-1 cursor-grab active:cursor-grabbing">
            <Canvas shadows camera={{ position: [0, 1.5, 4], fov: 50 }}>
              <color attach="background" args={["transparent"]} />
              <ambientLight intensity={0.4} color="#ffffff" />
              <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow color="#ffffff" shadow-mapSize={[1024, 1024]} />
              <directionalLight position={[-5, 5, -5]} intensity={1.5} color="#8b5cf6" />
              <pointLight position={[0, 2, 2]} intensity={1} color="#4fd1c5" />
              <Environment preset="city" />
              <Avatar isSpeaking={isAvatarSpeaking} emotion={currentEmotion} interviewerType={interviewer} />
              <ContactShadows position={[0, -0.6, 0]} opacity={0.6} scale={10} blur={2.5} far={4} />
              <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 3} />
            </Canvas>
          </div>

          {/* Subtitles Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentQuestionIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-base md:text-lg leading-relaxed text-gray-100 text-center max-w-2xl mx-auto font-medium"
              >
                {currentQuestion.question}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full md:w-80 lg:w-[400px] flex flex-col gap-6 relative z-10">
          <div className="aspect-video w-full rounded-3xl overflow-hidden bg-black/40 backdrop-blur-xl border border-white/10 shrink-0 shadow-xl relative group">
            <WebcamPreview isCameraOn={isCameraOn} />
            {!isCameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white/50 backdrop-blur-sm">
                <VideoOff className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs font-medium tracking-wide">Camera Disabled</span>
              </div>
            )}
          </div>

          {/* Transcript Panel */}
          <div className="flex-1 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 flex flex-col overflow-hidden min-h-0 shadow-xl">
            <div className="flex items-center gap-2 mb-5 text-muted-foreground border-b border-white/10 pb-4 shrink-0">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-gray-200">Live Transcript</span>
              {isListening && (
                <span className="ml-auto flex items-center gap-1.5 text-xs text-red-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Recording
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6 text-sm scrollbar-thin scrollbar-thumb-white/10">
              <div className="space-y-2">
                <span className="text-[10px] text-primary font-bold uppercase tracking-widest flex items-center gap-2">
                  <div className="w-4 h-px bg-primary/50"></div> Interviewer
                </span>
                <p className="leading-relaxed text-gray-200 pl-6">{currentQuestion.question}</p>
              </div>

              {(phase === "user_answering" || phase === "saving") && (
                <div className="space-y-2">
                  <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest flex items-center gap-2">
                     <div className="w-4 h-px bg-green-500/50"></div> You
                  </span>
                  {liveTranscript ? (
                    <div className="space-y-3 pl-6">
                      <p className="leading-relaxed text-gray-100">{liveTranscript}</p>
                      <AnimatePresence>
                        {autoSubmitCountdown !== null && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-xs text-primary/80 animate-pulse font-medium bg-primary/10 inline-block px-2 py-1 rounded-md"
                          >
                            Auto-submitting in {autoSubmitCountdown}...
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <p className="italic text-gray-500 animate-pulse pl-6 text-xs">
                      {sttSupported ? "Listening for your voice..." : "Microphone transcription not supported in this browser."}
                    </p>
                  )}
                </div>
              )}

              {Object.keys(transcripts).length > 0 && (
                <div className="pt-4 border-t border-white/5 mt-4">
                  <p className="text-[11px] font-medium text-white/30 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-green-500/50" />
                    {Object.keys(transcripts).length} previous answer(s) saved
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* CONTROLS */}
      <footer className="h-24 flex items-center justify-center gap-4 bg-transparent backdrop-blur-none px-6 shrink-0 relative z-20 pb-4">
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-2xl p-2.5 rounded-full border border-white/10 shadow-2xl">
          <Button
            variant="outline" size="icon"
            className={`rounded-full w-12 h-12 border-transparent transition-all duration-300 ${!isMicOn ? "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "bg-white/10 text-white hover:bg-white/20"}`}
            onClick={() => {
              if (isMicOn) { stopListening() } else if (phase === "user_answering") { startListening() }
              setIsMicOn(!isMicOn)
            }}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>

          <Button
            variant="outline" size="icon"
            className={`rounded-full w-12 h-12 border-transparent transition-all duration-300 ${!isCameraOn ? "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "bg-white/10 text-white hover:bg-white/20"}`}
            onClick={() => setIsCameraOn(!isCameraOn)}
          >
            {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>

          <Button
            variant="outline" size="icon"
            className={`rounded-full w-12 h-12 border-transparent transition-all duration-300 ${!isTTSOn ? "bg-amber-500 text-white hover:bg-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "bg-white/10 text-white hover:bg-white/20"}`}
            onClick={() => { setIsTTSOn(!isTTSOn); if (isTTSOn) stopTTS() }}
            title="Toggle avatar voice"
          >
            {isTTSOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>

          <div className="w-px h-8 bg-white/20 mx-1" />

          <Button variant="destructive" className="rounded-full w-12 h-12 p-0 flex items-center justify-center hover:scale-105 transition-transform" onClick={handleEndInterview} title="End Interview">
            <PhoneOff className="w-5 h-5" />
          </Button>

          <div className="w-px h-8 bg-white/20 mx-1" />

          <Button
            onClick={saveAndAdvance}
            disabled={phase === "avatar_speaking" || phase === "saving"}
            className="rounded-full px-6 h-12 gap-2 bg-white text-black hover:bg-gray-200 font-semibold transition-all disabled:opacity-50"
          >
            {phase === "saving" ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving</>
            ) : (
              <>Submit & Next <ChevronRight className="w-4 h-4" /></>
            )}
          </Button>
        </div>
      </footer>
    </div>
  )
}
