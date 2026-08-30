"use client"

import * as React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import Webcam from "react-webcam"
import {
  Brain,
  Lock,
  Volume2,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Mic,
  XOctagon
} from "lucide-react"

// Import question pool
import interviewPool from "@/data/questions/interview_pool.json"

// Type extensions for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function StandaloneMockInterviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get("role") || "General"

  // Load and shuffle questions based on role (Client side only to prevent hydration errors)
  const [questions, setQuestions] = useState<string[]>([])
  
  useEffect(() => {
    type PoolKey = keyof typeof interviewPool;
    const pool = interviewPool[role as PoolKey] || interviewPool["General"];
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    setQuestions(shuffled.slice(0, 15));
  }, [role])

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState(0)

  // Interview state
  // "success" = finished all questions normally
  // "failed" = user struggled too much, cut off
  // "cheated" = user switched tabs multiple times
  const [finishStatus, setFinishStatus] = useState<"success" | "failed" | "cheated" | null>(null)
  
  // Strikes
  const [performanceStrikes, setPerformanceStrikes] = useState(0)
  const [antiCheatStrikes, setAntiCheatStrikes] = useState(0)
  const [showWarningPopup, setShowWarningPopup] = useState(false)

  // Speech & AI States
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState("")

  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isEvaluatingRef = useRef(false) // Prevents double evaluation
  const aiUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // --- Timer ---
  useEffect(() => {
    if (finishStatus) return
    const interval = setInterval(() => {
      setTimerSeconds(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [finishStatus])

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`
  }

  // --- Speech Synthesis (AI Speaking) ---
  const speakText = useCallback((text: string, onEndCallback?: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsAiSpeaking(true)
      setTimeout(() => {
        setIsAiSpeaking(false)
        if (onEndCallback) onEndCallback()
      }, 3000)
      return
    }

    try {
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      aiUtteranceRef.current = utterance
      utterance.rate = 1.0
      utterance.pitch = 1.0

      const voices = window.speechSynthesis.getVoices()
      const naturalVoice = voices.find(v =>
        v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha"))
      )
      if (naturalVoice) utterance.voice = naturalVoice

      utterance.onstart = () => {
        setIsAiSpeaking(true)
        setIsListening(false)
        if (recognitionRef.current) {
          try { recognitionRef.current.stop() } catch {}
        }
      }
      
      utterance.onend = () => {
        setIsAiSpeaking(false)
        if (onEndCallback) onEndCallback()
      }
      
      utterance.onerror = () => {
        setIsAiSpeaking(false)
        if (onEndCallback) onEndCallback()
      }

      window.speechSynthesis.speak(utterance)
    } catch {
      setIsAiSpeaking(true)
      setTimeout(() => {
        setIsAiSpeaking(false)
        if (onEndCallback) onEndCallback()
      }, 3000)
    }
  }, [])

  // --- Speech Recognition (Candidate Listening) ---
  const startListening = useCallback(() => {
    if (finishStatus || isAiSpeaking || showWarningPopup) return
    isEvaluatingRef.current = false
    setCurrentTranscript("")

    if (!recognitionRef.current) {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRec) {
        const recognition = new SpeechRec()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onstart = () => setIsListening(true)
        
        recognition.onresult = (event: any) => {
          let interim = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              interim += event.results[i][0].transcript + ' '
            } else {
              interim += event.results[i][0].transcript
            }
          }
          
          setCurrentTranscript(prev => {
            const updated = prev + ' ' + interim
            
            // Reset silence timer whenever user speaks
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
            
            // If they pause for 10 seconds after starting to speak, assume answer is done
            silenceTimerRef.current = setTimeout(() => {
               handleAnswerEvaluation(updated)
            }, 10000)

            return updated
          })
        }

        recognition.onerror = (event: any) => {
          console.warn("Speech Rec Error", event.error)
          if (event.error === 'not-allowed') {
             alert("Microphone permission is required for the interview.")
          }
          // If no speech is detected after a long time, evaluate as empty
          if (event.error === 'no-speech') {
            if (!isEvaluatingRef.current) {
              handleAnswerEvaluation("")
            }
          }
        }
        
        recognition.onend = () => {
           setIsListening(false)
        }

        recognitionRef.current = recognition
      } else {
        console.warn("SpeechRecognition API not supported in this browser.")
        // Fallback for non-supported browsers
        setTimeout(() => handleAnswerEvaluation("fallback text"), 10000)
      }
    }

    try {
      recognitionRef.current?.start()
      
      // Start an initial 10-second timer in case they never speak a single word
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = setTimeout(() => {
         handleAnswerEvaluation("")
      }, 10000)
      
    } catch (e) {
      // already started
    }
  }, [finishStatus, isAiSpeaking, showWarningPopup])


  // --- Answer Evaluation Engine ---
  const handleAnswerEvaluation = (transcript: string) => {
    if (isEvaluatingRef.current || finishStatus) return
    isEvaluatingRef.current = true
    
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)

    setIsListening(false)
    const wordCount = transcript.trim().split(/\s+/).filter(w => w.length > 0).length

    // 1. Evaluate Performance (Poor if < 10 words or basically silent)
    if (wordCount < 10) {
      const newStrikes = performanceStrikes + 1
      setPerformanceStrikes(newStrikes)

      if (newStrikes === 1) {
        speakText(
          "Okay, we'll go to the next question.",
          () => advanceToNextQuestion()
        )
        return
      } 
      
      if (newStrikes === 2) {
        speakText(
          "We'll go to the next question.",
          () => advanceToNextQuestion()
        )
        return
      }
      
      if (newStrikes >= 3) {
        speakText(
          "Be prepared well. You are taking a lot of time.",
          () => {
             setFinishStatus("failed")
             redirectWithStatus("failed")
          }
        )
        return
      }
    }

    // 2. Good Answer (Advance normally)
    // We don't always say "good job", just naturally move to the next question
    advanceToNextQuestion()
  }

  const advanceToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIdx = currentQuestionIndex + 1
      setCurrentQuestionIndex(nextIdx)
      speakText(questions[nextIdx], () => {
         startListening()
      })
    } else {
      speakText("That concludes our interview. Thank you for your time. Your report is being generated.", () => {
         setFinishStatus("success")
         redirectWithStatus("success")
      })
    }
  }

  const hasStartedRef = useRef(false)

  // --- Initial Mount & First Question ---
  useEffect(() => {
    if (questions.length === 0 || hasStartedRef.current) return
    hasStartedRef.current = true

    // Wait a brief moment before starting
    const t = setTimeout(() => {
       speakText(questions[0], () => {
         startListening()
       })
    }, 1000)
    return () => clearTimeout(t)
  }, [questions, speakText, startListening])


  // --- Anti-Cheat Engine (Tab Switching) ---
  useEffect(() => {
    if (finishStatus) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleCheatingViolation()
      }
    }

    const handleBlur = () => {
      handleCheatingViolation()
    }

    window.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("blur", handleBlur)

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("blur", handleBlur)
    }
  }, [finishStatus, antiCheatStrikes])

  const handleCheatingViolation = () => {
    if (finishStatus || showWarningPopup) return
    
    // Pause any ongoing speech or recording
    window.speechSynthesis.cancel()
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    setIsListening(false)
    isEvaluatingRef.current = true // Pause evaluation

    const newStrikes = antiCheatStrikes + 1
    setAntiCheatStrikes(newStrikes)

    if (newStrikes === 1) {
      setShowWarningPopup(true)
      speakText("Warning. Tab switching detected. Please remain focused on the interview screen. Third party tools are not allowed.")
    } else if (newStrikes >= 2) {
      speakText(
        "Multiple violations detected. This is considered cheating. The interview is now terminated.",
        () => {
          setFinishStatus("cheated")
          redirectWithStatus("cheated")
        }
      )
    }
  }

  const resumeFromWarning = () => {
    setShowWarningPopup(false)
    // Repeat current question and resume
    speakText("Let's continue. " + questions[currentQuestionIndex], () => {
       startListening()
    })
  }

  // --- Lock Screen Prevent Back ---
  useEffect(() => {
    if (finishStatus) return
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = "Interview is currently locked and in progress."
      return e.returnValue
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [finishStatus])

  // Fullscreen helper
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        if (document.exitFullscreen) await document.exitFullscreen()
      }
    } catch {}
  }

  const redirectWithStatus = (status: "success" | "failed" | "cheated") => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
    setTimeout(() => {
      router.push(`/interview/results?mode=mock&status=${status}&role=${encodeURIComponent(role)}`)
    }, 2500)
  }

  // --- RENDER COMPLETION STATES ---
  if (finishStatus) {
    return (
      <div className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-300">
        
        {finishStatus === "success" && (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-6 shadow-2xl">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Interview Completed!</h1>
            <p className="text-white/70 max-w-md mb-6 text-sm">
              Screen unlocked. Compiling your responses, analyzing communication clarity, and preparing your evaluation report...
            </p>
          </>
        )}

        {finishStatus === "failed" && (
          <>
            <div className="w-20 h-20 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mb-6 shadow-2xl">
              <AlertTriangle className="w-10 h-10 animate-bounce" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Prepare well and come again</h1>
            <p className="text-white/70 max-w-md mb-6 text-sm">
              You were taking a lot of time. Prepare well and come soon.
            </p>
          </>
        )}

        {finishStatus === "cheated" && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-6 shadow-2xl">
              <XOctagon className="w-10 h-10 animate-bounce" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-red-500 mb-2">Interview Terminated</h1>
            <p className="text-white/70 max-w-md mb-6 text-sm">
              We detected multiple tab switches or loss of focus during the interview. This is considered an integrity violation.
            </p>
          </>
        )}

        <div className="flex items-center gap-2 text-primary font-medium text-sm">
          <Loader2 className="w-5 h-5 animate-spin" /> Finalizing session
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-zinc-950 text-white flex flex-col font-sans select-none overflow-hidden fixed inset-0 z-[99999]">
      
      {/* Top Proctored Header */}
      <header className="h-14 px-6 bg-zinc-900 border-b border-white/10 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
            IN
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white truncate">
              {role} Interview
            </h1>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Lock className="w-3.5 h-3.5" /> Screen Locked
          </span>
        </div>

        {/* Center: Question Progress */}
        <div className="flex items-center gap-3 text-xs text-white/80">
          <span className="font-semibold text-white px-2.5 py-1 bg-white/10 rounded-full">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full font-mono text-white/90">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {formatTime(timerSeconds)}
          </div>
        </div>

        {/* Right Controls: Fullscreen only */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-white/70 hover:text-white hover:bg-white/10 h-8 text-xs gap-1.5"
          >
            <Maximize2 className="w-4 h-4" /> Fullscreen
          </Button>
        </div>
      </header>

      {/* Main Split Screen Area */}
      <main className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        
        {/* LEFT STAGE: AI Interviewer */}
        <div className="w-full md:w-1/2 h-full border-r border-white/10 bg-zinc-900/60 flex flex-col p-6 relative overflow-y-auto">
          
          {/* AI Avatar */}
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[220px]">
            <div className={`absolute inset-0 bg-primary/5 rounded-3xl blur-3xl transition-opacity duration-700 ${isAiSpeaking ? 'opacity-100' : 'opacity-20'}`} />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <div className={`absolute inset-0 bg-primary/20 rounded-full blur-xl transition-all duration-300 ${isAiSpeaking ? 'scale-150 opacity-100 animate-pulse' : 'scale-100 opacity-40'}`} />
                <div className={`absolute inset-3 bg-primary/40 rounded-full blur-md transition-all duration-150 ${isAiSpeaking ? 'scale-110' : 'scale-90'}`} />
                <div className="relative w-24 h-24 bg-gradient-to-br from-primary to-teal-700 rounded-full flex items-center justify-center shadow-2xl border-2 border-white/20">
                  <Brain className="w-12 h-12 text-white" />
                </div>
              </div>

              <h2 className="mt-5 font-bold text-lg text-white flex items-center gap-2">
                INTRLY AI Interviewer
                {isAiSpeaking && <Volume2 className="w-4 h-4 text-primary animate-pulse" />}
              </h2>
              <span className="text-xs text-white/50 mt-0.5">
                {isAiSpeaking ? "Speaking..." : (isListening ? "Listening to you..." : "Processing...")}
              </span>
            </div>
          </div>

          {/* Active Question Highlight Box */}
          <div className="bg-zinc-950/90 border border-white/15 rounded-2xl p-5 shadow-2xl relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Current Question ({currentQuestionIndex + 1} of {questions.length})
              </span>
            </div>
            <p className="text-base md:text-lg font-medium text-white/90 leading-relaxed">
              {questions[currentQuestionIndex]}
            </p>
          </div>
        </div>

        {/* RIGHT STAGE: Candidate Video Camera (Forced On) */}
        <div className="w-full md:w-1/2 h-full bg-zinc-950 flex flex-col p-6 min-h-0 justify-between">
          
          <div className="flex-1 bg-zinc-900 rounded-2xl border border-white/10 relative overflow-hidden flex items-center justify-center shadow-xl">
            <Webcam
              audio={false}
              mirrored={true}
              className="w-full h-full object-cover"
            />
            
            {/* Listening Indicator */}
            <div className="absolute bottom-6 left-6 bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-3 border border-white/10 shadow-2xl">
              {isListening ? (
                <>
                  <div className="flex gap-1.5 items-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-75" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-150" />
                  </div>
                  <span className="text-emerald-400">Microphone Active</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-white/40" />
                  <span className="text-white/60">Mic Standby</span>
                </>
              )}
            </div>
          </div>

          {/* Candidate Current Transcript Preview (Optional, for feedback) */}
          <div className="mt-4 p-4 bg-zinc-900 border border-white/10 rounded-xl h-24 overflow-y-auto">
            <p className="text-xs text-white/40 mb-1 font-bold uppercase tracking-wider">Live Transcript</p>
            <p className="text-sm text-white/80 italic">
              {currentTranscript || (isListening ? "Waiting for you to speak..." : "")}
            </p>
          </div>

        </div>

      </main>

      {/* Anti-Cheat Warning Popup Overlay */}
      {showWarningPopup && (
        <div className="fixed inset-0 z-[100000] bg-red-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
          <AlertTriangle className="w-20 h-20 text-red-500 mb-6 animate-pulse" />
          <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Warning: Focus Lost</h2>
          <p className="text-lg text-white/80 max-w-2xl mb-8">
            We detected that you switched tabs or opened another application. 
            Third-party apps, notes, or AI tools are <strong>strictly prohibited</strong>. 
            <br/><br/>
            If you leave the interview screen one more time, the interview will be automatically terminated for cheating.
          </p>
          <Button 
            size="lg" 
            variant="destructive"
            onClick={resumeFromWarning}
            className="text-lg px-10 h-14 font-bold rounded-xl shadow-2xl shadow-red-500/20"
          >
            I Understand, Resume Interview
          </Button>
        </div>
      )}

    </div>
  )
}
