import { VoiceProvider } from './VoiceProvider';

export class BrowserSpeechProvider implements VoiceProvider {
  private synth: SpeechSynthesis | null = null;
  private maleVoice: SpeechSynthesisVoice | null = null;
  private femaleVoice: SpeechSynthesisVoice | null = null;
  private _isSpeaking = false;
  private activeUtterance: SpeechSynthesisUtterance | null = null;

  async initialize(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    this.synth = window.speechSynthesis;
    
    if (!this.synth) return false;

    // Wait for voices to load (some browsers load them asynchronously)
    let voices = this.synth.getVoices();
    if (voices.length === 0) {
      await new Promise<void>((resolve) => {
        const onVoicesChanged = () => {
          voices = this.synth!.getVoices();
          this.synth!.removeEventListener('voiceschanged', onVoicesChanged);
          resolve();
        };
        this.synth!.addEventListener('voiceschanged', onVoicesChanged);
        
        // Timeout just in case
        setTimeout(resolve, 2000);
      });
    }

    this.selectOptimalVoices(voices);
    return true;
  }

  private selectOptimalVoices(voices: SpeechSynthesisVoice[]) {
    // English voices priority list to find premium natural voices
    const premiumMaleKeywords = ["Edge", "Natural", "Google UK English Male", "David"];
    const premiumFemaleKeywords = ["Edge", "Natural", "Google UK English Female", "Zira", "Samantha"];
    
    const engVoices = voices.filter(v => v.lang.startsWith('en'));

    // Find Male Voice
    this.maleVoice = this.findBestVoice(engVoices, premiumMaleKeywords) || engVoices[0] || voices[0];
    
    // Find Female Voice
    this.femaleVoice = this.findBestVoice(engVoices, premiumFemaleKeywords) || engVoices.find(v => v !== this.maleVoice) || voices[0];
  }

  private findBestVoice(voices: SpeechSynthesisVoice[], keywords: string[]): SpeechSynthesisVoice | null {
    for (const keyword of keywords) {
      const match = voices.find(v => v.name.toLowerCase().includes(keyword.toLowerCase()));
      if (match) return match;
    }
    return null;
  }

  async speak(text: string, interviewerType: 'aarav' | 'reshma', onStart?: () => void, onEnd?: () => void): Promise<void> {
    if (!this.synth) return;

    this.stop();

    return new Promise((resolve) => {
      this.activeUtterance = new SpeechSynthesisUtterance(text);
      this.activeUtterance.voice = interviewerType === 'aarav' ? this.maleVoice : this.femaleVoice;
      
      // Conversational settings
      this.activeUtterance.rate = 0.95; // Slightly slower for pacing
      this.activeUtterance.pitch = interviewerType === 'aarav' ? 0.95 : 1.05; // Depth for male, warmth for female
      this.activeUtterance.volume = 1.0;

      this.activeUtterance.onstart = () => {
        this._isSpeaking = true;
        onStart && onStart();
      };

      this.activeUtterance.onend = () => {
        this._isSpeaking = false;
        this.activeUtterance = null;
        onEnd && onEnd();
        resolve();
      };

      this.activeUtterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        this._isSpeaking = false;
        this.activeUtterance = null;
        onEnd && onEnd();
        resolve(); // resolve anyway to not block the engine
      };

      this.synth?.speak(this.activeUtterance);
    });
  }

  stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this._isSpeaking = false;
      this.activeUtterance = null;
    }
  }

  isSpeaking(): boolean {
    return this._isSpeaking || (this.synth ? this.synth.speaking : false);
  }
}
