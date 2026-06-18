/**
 * Text-to-Speech for interview questions.
 *
 * Thin wrapper around the browser Web Speech API (`window.speechSynthesis`).
 * It is intentionally framework-agnostic (no React) so it can be unit-tested
 * and reused. A single shared instance is exported as `interviewTts`.
 *
 * Notes:
 *  • Voices load asynchronously in most browsers — we listen for
 *    `voiceschanged` and re-resolve the best voice for the requested language.
 *  • Speech requires a prior user gesture in some browsers; that is satisfied
 *    because the interview only starts after the candidate clicks "Start".
 *  • All methods are no-ops (and `supported` is false) during SSR or where the
 *    API is unavailable, so callers never need to guard.
 */

export type TtsLang = "en" | "ar" | string;

interface SpeakOptions {
  text: string;
  lang?: TtsLang;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

const LANG_TAG: Record<string, string> = {
  en: "en-US",
  ar: "ar-SA",
};

function toBcp47(lang?: TtsLang): string {
  if (!lang) return "en-US";
  return LANG_TAG[lang] ?? lang;
}

class InterviewTts {
  private synth: SpeechSynthesis | null =
    typeof window !== "undefined" && "speechSynthesis" in window
      ? window.speechSynthesis
      : null;

  private current: SpeechSynthesisUtterance | null = null;

  get supported(): boolean {
    return this.synth !== null;
  }

  /** Resolve the best available voice for a BCP-47 language tag. */
  private pickVoice(bcp47: string): SpeechSynthesisVoice | undefined {
    if (!this.synth) return undefined;
    const voices = this.synth.getVoices();
    if (!voices.length) return undefined;
    const base = bcp47.split("-")[0].toLowerCase();
    // Prefer an exact tag match, then a same-language match, else default.
    return (
      voices.find((v) => v.lang?.toLowerCase() === bcp47.toLowerCase()) ??
      voices.find((v) => v.lang?.toLowerCase().startsWith(base)) ??
      undefined
    );
  }

  /**
   * Speak `text`. Cancels any in-flight utterance first. Resolves immediately;
   * use the callbacks to react to playback lifecycle.
   */
  speak({ text, lang, onStart, onEnd, onError }: SpeakOptions): void {
    if (!this.synth || !text.trim()) {
      onEnd?.();
      return;
    }

    this.cancel();

    const bcp47 = toBcp47(lang);
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = bcp47;
    utter.rate = 1;
    utter.pitch = 1;

    const voice = this.pickVoice(bcp47);
    if (voice) utter.voice = voice;

    utter.onstart = () => onStart?.();
    utter.onend = () => {
      if (this.current === utter) this.current = null;
      onEnd?.();
    };
    utter.onerror = () => {
      if (this.current === utter) this.current = null;
      onError?.();
    };

    this.current = utter;

    const doSpeak = () => this.synth?.speak(utter);

    // If voices aren't loaded yet, wait once for them so we get the right voice.
    if (!voice && this.synth.getVoices().length === 0) {
      const onVoices = () => {
        this.synth?.removeEventListener("voiceschanged", onVoices);
        const v = this.pickVoice(bcp47);
        if (v) utter.voice = v;
        doSpeak();
      };
      this.synth.addEventListener("voiceschanged", onVoices);
      // Fallback in case the event never fires.
      setTimeout(() => {
        this.synth?.removeEventListener("voiceschanged", onVoices);
        if (this.current === utter && this.synth?.speaking !== true) doSpeak();
      }, 250);
      return;
    }

    doSpeak();
  }

  /** Stop any current speech immediately. */
  cancel(): void {
    if (!this.synth) return;
    this.current = null;
    this.synth.cancel();
  }

  get speaking(): boolean {
    return this.synth?.speaking ?? false;
  }
}

export const interviewTts = new InterviewTts();
