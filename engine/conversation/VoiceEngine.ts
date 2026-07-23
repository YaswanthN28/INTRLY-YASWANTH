import { VoiceProvider } from '@/services/speech/VoiceProvider';
import { BrowserSpeechProvider } from '@/services/speech/BrowserSpeechProvider';

export class VoiceEngine {
  private static instance: VoiceEngine;
  private provider: VoiceProvider;
  private isInitialized = false;

  private constructor() {
    // Default to the free, native Browser Provider
    this.provider = new BrowserSpeechProvider();
  }

  public static getInstance(): VoiceEngine {
    if (!VoiceEngine.instance) {
      VoiceEngine.instance = new VoiceEngine();
    }
    return VoiceEngine.instance;
  }

  /**
   * Allows hot-swapping providers in the future (e.g., AzureProvider, ElevenLabsProvider)
   */
  public setProvider(newProvider: VoiceProvider) {
    this.provider.stop();
    this.provider = newProvider;
    this.isInitialized = false;
  }

  public async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    this.isInitialized = await this.provider.initialize();
    return this.isInitialized;
  }

  public async speak(text: string, interviewerType: 'aarav' | 'reshma', onStart?: () => void, onEnd?: () => void): Promise<void> {
    await this.initialize();
    return this.provider.speak(text, interviewerType, onStart, onEnd);
  }

  public stop(): void {
    if (this.isInitialized) {
      this.provider.stop();
    }
  }

  public isSpeaking(): boolean {
    return this.provider.isSpeaking();
  }
}
