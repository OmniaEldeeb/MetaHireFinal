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

  /** Resolve the best available voice for a BCP-47 language tag.
   *  Always biases toward a MALE voice (the interviewer is male). Browser
   *  voices don't expose gender, so we match on well-known male/female name
   *  hints and, failing that, avoid obviously-female voices. */
  private pickVoice(bcp47: string): SpeechSynthesisVoice | undefined {
    if (!this.synth) return undefined;
    const voices = this.synth.getVoices();
    if (!voices.length) return undefined;
    const base = bcp47.split("-")[0].toLowerCase();

    const exact = voices.filter((v) => v.lang?.toLowerCase() === bcp47.toLowerCase());
    const sameLang = voices.filter((v) => v.lang?.toLowerCase().startsWith(base));
    const pool = exact.length ? exact : sameLang;
    if (!pool.length) return undefined;

    const MALE_HINTS = [
      "male", "david", "mark", "daniel", "fred", "alex", "george", "james",
      "guy", "william", "thomas", "diego", "jorge", "ravi", "rishi", "aaron",
      "maged", "majed", "tarik", "naayf", "hamza", "google uk english male",
    ];
    const FEMALE_HINTS = [
      "female", "samantha", "victoria", "zira", "susan", "karen", "tessa",
      "fiona", "hazel", "moira", "veena", "amira", "laila", "salma", "hoda",
      "google us english", "google uk english female",
    ];
    const isMale = (n: string) => MALE_HINTS.some((h) => n.includes(h));
    const isFemale = (n: string) => FEMALE_HINTS.some((h) => n.includes(h));

    // 1) explicitly male  2) anything not obviously female  3) first available
    return (
      pool.find((v) => { const n = v.name.toLowerCase(); return isMale(n) && !n.includes("female"); }) ??
      pool.find((v) => !isFemale(v.name.toLowerCase())) ??
      pool[0]
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