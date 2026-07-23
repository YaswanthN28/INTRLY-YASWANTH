export interface VoiceProvider {
  /**
   * Initializes the provider and prepares resources.
   * @returns A promise resolving to true if successful, false otherwise.
   */
  initialize(): Promise<boolean>;

  /**
   * Speaks the given text using the selected character's voice.
   * @param text The text to synthesize.
   * @param interviewerType 'aarav' (male) or 'reshma' (female)
   * @param onStart Callback when speech begins.
   * @param onEnd Callback when speech finishes.
   */
  speak(
    text: string, 
    interviewerType: 'aarav' | 'reshma',
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void>;

  /**
   * Stops any ongoing speech immediately.
   */
  stop(): void;

  /**
   * Returns whether the provider is currently speaking.
   */
  isSpeaking(): boolean;
}
