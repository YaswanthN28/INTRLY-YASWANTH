export type InterviewState = 
  | 'IDLE'
  | 'INITIALIZING'
  | 'AI_SPEAKING'
  | 'LISTENING'
  | 'TRANSCRIBING'
  | 'THINKING'
  | 'INTERRUPTED'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ERROR';

export interface AIProvider {
  initialize(): Promise<void>;
  processAnswer(transcript: string, codeContext?: string): Promise<string>;
}

export interface STTProvider {
  startListening(onInterim: (text: string) => void, onFinal: (text: string) => void): Promise<void>;
  stopListening(): Promise<void>;
}

export interface TTSProvider {
  speak(text: string, onStart: () => void, onEnd: () => void): Promise<void>;
  stop(): Promise<void>;
}

export interface AvatarProvider {
  setMood(mood: 'idle' | 'listening' | 'thinking' | 'speaking' | 'happy' | 'serious'): void;
  playLipSync(audioUrl: string): void;
  stopLipSync(): void;
}
