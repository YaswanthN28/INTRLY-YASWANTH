"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { VoiceEngine } from "@/engine/conversation/VoiceEngine"

// Extend Window type for cross-browser SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// ──────────────────────────────────────────────────
// TEXT-TO-SPEECH (Avatar speaks questions aloud)
// ──────────────────────────────────────────────────
interface UseTTSReturn {
  speak: (text: string, voiceId?: string) => Promise<void>
  stop: () => void
  isSpeaking: boolean
}

export function useTTS(): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const engine = useRef<VoiceEngine | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      engine.current = VoiceEngine.getInstance()
      engine.current.initialize()
    }
    return () => {
      engine.current?.stop()
    }
  }, [])

  const speak = useCallback(async (text: string, voiceId?: string) => {
    if (!engine.current) return
    
    // voiceId is mapped to interviewerType in the new architecture context, 
    // but the caller might pass 'aarav' or 'reshma'. If it passes the old ElevenLabs UUID, 
    // we default to 'aarav'.
    const type = (voiceId === 'aarav' || voiceId === 'reshma') ? voiceId : 'aarav'

    setIsSpeaking(true)
    
    // VoiceEngine handles the async promise
    await engine.current.speak(
      text, 
      type,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    )
  }, [])

  const stop = useCallback(() => {
    engine.current?.stop()
    setIsSpeaking(false)
  }, [])

  return { speak, stop, isSpeaking }
}

// ──────────────────────────────────────────────────
// SPEECH-TO-TEXT (Record candidate's answer)
// ──────────────────────────────────────────────────
interface UseSTTReturn {
  startListening: () => void
  stopListening: () => void
  isListening: boolean
  transcript: string
  resetTranscript: () => void
  isSupported: boolean
  lastSpeechTime: number
}

export function useSTT(): UseSTTReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isSupported, setIsSupported] = useState(false)
  const [lastSpeechTime, setLastSpeechTime] = useState(0)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognitionClass) {
      setIsSupported(false)
      return
    }

    setIsSupported(true)
    const recognition = new SpeechRecognitionClass()
    recognition.continuous = true       
    recognition.interimResults = true   
    recognition.lang = "en-US"

    recognition.onresult = (event: any) => {
      let finalTranscript = ""
      let interimTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " "
        } else {
          interimTranscript += result[0].transcript
        }
      }

      if (finalTranscript) {
        setTranscript(prev => (prev + finalTranscript).trim())
      }
      
      setLastSpeechTime(Date.now())
    }

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech") {
        console.warn("SpeechRecognition error:", event.error)
        setIsListening(false)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
  }, [])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return
    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch (err) {
      console.warn("STT start error:", err)
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return
    recognitionRef.current.stop()
    setIsListening(false)
  }, [isListening])

  const resetTranscript = useCallback(() => {
    setTranscript("")
    setLastSpeechTime(0)
  }, [])

  return { startListening, stopListening, isListening, transcript, resetTranscript, isSupported, lastSpeechTime }
}
