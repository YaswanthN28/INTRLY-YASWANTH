import { useState, useCallback } from 'react';

export type EmotionState = 'neutral' | 'happy' | 'smile' | 'laugh' | 'listening' | 'thinking' | 'explaining' | 'curious' | 'encouraging' | 'professional';

export function useAvatarExpressions() {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionState>('neutral');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  // Expose this method to allow the Interview Engine to trigger expressions
  const triggerEmotion = useCallback((emotion: EmotionState, durationMs?: number) => {
    setCurrentEmotion(emotion);
    
    if (durationMs) {
      setTimeout(() => {
        setCurrentEmotion('neutral');
      }, durationMs);
    }
  }, []);

  // In a real implementation with a rigged .glb model, we would use the THREE.js 
  // morphTargetInfluences array here to blend between ARKit blendshapes like:
  // mouthSmileLeft, mouthSmileRight, jawOpen, eyeBlinkLeft, etc.
  
  // Example dummy function for processing TTS audio data into visemes
  const processAudioStreamForLipSync = useCallback((audioBuffer: any) => {
    // This would ideally integrate with something like Rhubarb Lip Sync 
    // or parse timestamps from Azure/ElevenLabs TTS to set viseme states 
    // (A, E, I, O, U, etc.) synchronized with audio playback.
    setIsSpeaking(true);
  }, []);

  return {
    currentEmotion,
    isSpeaking,
    isBlinking,
    triggerEmotion,
    processAudioStreamForLipSync
  };
}
