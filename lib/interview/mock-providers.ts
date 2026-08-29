import { AIProvider, STTProvider, TTSProvider, AvatarProvider } from './types';

export class MockAIProvider implements AIProvider {
  async initialize() {
    return new Promise<void>(resolve => setTimeout(resolve, 500));
  }
  async processAnswer(transcript: string) {
    return new Promise<string>(resolve => {
      setTimeout(() => {
        resolve("That's a very insightful answer. Let's move on to the next topic. Can you explain your experience with React?");
      }, 1500);
    });
  }
}

export class MockSTTProvider implements STTProvider {
  private interval: NodeJS.Timeout | null = null;

  async startListening(onInterim: (text: string) => void, onFinal: (text: string) => void) {
    let dots = "";
    this.interval = setInterval(() => {
      dots += ".";
      onInterim("User is speaking" + dots);
      if (dots.length > 5) {
        onFinal("This is a simulated final transcript from the user.");
        dots = "";
      }
    }, 1000);
  }

  async stopListening() {
    if (this.interval) clearInterval(this.interval);
  }
}

export class MockTTSProvider implements TTSProvider {
  private timeout: NodeJS.Timeout | null = null;
  
  async speak(text: string, onStart: () => void, onEnd: () => void) {
    onStart();
    // Simulate speaking time based on text length
    const speakingTime = Math.max(2000, text.length * 50);
    this.timeout = setTimeout(() => {
      onEnd();
    }, speakingTime);
  }

  async stop() {
    if (this.timeout) clearTimeout(this.timeout);
  }
}

export class MockAvatarProvider implements AvatarProvider {
  setMood(mood: string) {
    console.log(`[Avatar] Mood set to: ${mood}`);
  }
  playLipSync() {
    console.log(`[Avatar] Playing lip sync`);
  }
  stopLipSync() {
    console.log(`[Avatar] Stopping lip sync`);
  }
}
