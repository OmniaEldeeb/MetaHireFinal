"use client";

/**
 * InterviewClosing
 * ================
 * Shown once the interview is complete (phase "finishing"/"done"). The avatar
 * reads the closing message — the backend's `overall_feedback`, whose prompt
 * begins with a warm thank-you to the candidate — then the parent navigates to
 * the report. Navigation is gated on `onSpeechEnd` so the goodbye isn't cut off.
 */

import { useEffect, useRef, useState } from "react";
import { Loader2, Volume2 } from "lucide-react";
import { InterviewAvatar } from "./interview-avatar";
import { interviewTts } from "@/lib/interview/tts";

export function InterviewClosing({
  message,
  language,
  onSpeechEnd,
}: {
  message?: string;
  language?: string;
  onSpeechEnd: () => void;
}) {
  const [speaking, setSpeaking] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (interviewTts.supported && message && message.trim()) {
      interviewTts.speak({
        text: message,
        lang: language,
        onStart: () => setSpeaking(true),
        onEnd: () => {
          setSpeaking(false);
          onSpeechEnd();
        },
        onError: () => {
          setSpeaking(false);
          onSpeechEnd();
        },
      });
    } else {
      // Nothing to say (no message or TTS unsupported) — ready immediately.
      onSpeechEnd();
    }

    return () => interviewTts.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skip = () => {
    interviewTts.cancel();
    setSpeaking(false);
    onSpeechEnd();
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="h-[clamp(260px,42vh,420px)] w-full">
          <InterviewAvatar speaking={speaking} />
        </div>
        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/35 px-3 py-1.5 backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-brand" />
          <span className="text-xs font-medium text-white">AI Interviewer</span>
        </div>
        {speaking && (
          <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-brand/90 px-3 py-1.5 backdrop-blur-sm">
            <Volume2 className="h-3.5 w-3.5 text-white" />
            <span className="text-xs font-medium text-white">Speaking…</span>
          </div>
        )}
      </div>

      {message?.trim() && (
        <p className="mt-5 text-center text-base leading-relaxed text-muted">
          {message}
        </p>
      )}

      <div className="mt-6 flex items-center justify-center gap-4">
        <span className="flex items-center gap-2 text-sm text-faint">
          <Loader2 className="h-4 w-4 animate-spin text-brand" /> Preparing your report…
        </span>
        {speaking && (
          <button
            type="button"
            onClick={skip}
            className="text-sm font-medium text-brand hover:underline"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}