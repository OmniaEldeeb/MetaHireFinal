"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  Mic, MicOff, CheckCircle2, Loader2,
  MessagesSquare, Lightbulb, BookOpen,
  Volume2, VolumeX, RotateCcw, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveSignals } from "./live-signals";
import { InterviewAvatar } from "./interview-avatar";
import { Countdown } from "./countdown";
import { interviewTts } from "@/lib/interview/tts";
import type { OrchestratorState } from "@/lib/interview/orchestrator";

interface Props {
  state: OrchestratorState;
  videoRef: RefObject<HTMLVideoElement>;
  onStartRecording: () => void;
  onSubmit: () => void;
}

export function InterviewRoom({ state, videoRef, onStartRecording, onSubmit }: Props) {
  const { phase, currentQuestion, lastAnswer, language } = state;
  const isRecording = phase === "recording";
  const isEvaluating = phase === "evaluating";
  const isQuestioning = phase === "questioning";

  // ── Text-to-Speech ──────────────────────────────────────────────────────
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const speakCurrent = (autoRecord = false) => {
    if (!currentQuestion?.question) return;
    const greeting = currentQuestion.greeting;

    const speakQuestion = () => {
      interviewTts.speak({
        text: currentQuestion.question,
        lang: language,
        onStart: () => setSpeaking(true),
        onEnd: () => {
          setSpeaking(false);
          // Auto-start recording after question is spoken (real interview feel)
          if (autoRecord && !mutedRef.current) {
            onStartRecording();
          }
        },
        onError: () => setSpeaking(false),
      });
    };

    if (greeting) {
      // Speak greeting first, then question
      interviewTts.speak({
        text: greeting,
        lang: language,
        onStart: () => setSpeaking(true),
        onEnd: speakQuestion,
        onError: speakQuestion, // if greeting fails, still speak question
      });
    } else {
      speakQuestion();
    }
  };

  // Auto-read greeting then question when entering questioning phase.
  // After speaking, auto-start recording so candidate doesn't need to click.
  useEffect(() => {
    if (!interviewTts.supported) return;
    if (isQuestioning && currentQuestion?.question && !mutedRef.current) {
      // Small delay so React has rendered the new question before TTS fires
      const t = setTimeout(() => speakCurrent(true), 300);
      return () => clearTimeout(t);
    } else if (!isQuestioning) {
      interviewTts.cancel();
      setSpeaking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.question_id, isQuestioning]);

  // Stop speech if the component unmounts mid-utterance.
  useEffect(() => () => interviewTts.cancel(), []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (next) {
      interviewTts.cancel();
      setSpeaking(false);
    } else if (isQuestioning) {
      speakCurrent();
    }
  };

  const handleStartRecording = () => {
    interviewTts.cancel();
    setSpeaking(false);
    onStartRecording();
  };

  const ttsSupported = interviewTts.supported;

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-5 py-6">
      {/* ── AI interviewer stage ───────────────────────────────────────── */}
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

      {/* ── Q&A + live signals ─────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        {/* Left */}
        <div className="space-y-4">
        {currentQuestion && (
          <div className="rounded-2xl border border-line bg-surface p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="readout text-xs text-faint">
                  Q{currentQuestion.question_number} / {currentQuestion.total_questions}
                </span>
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-elevated">
                  <div
                    className="h-full rounded-full bg-brand transition-[width] duration-500"
                    style={{ width: `${(currentQuestion.question_number / currentQuestion.total_questions) * 100}%` }}
                  />
                </div>
              </div>
              <Countdown minutes={currentQuestion.expected_time} running={isRecording} onExpire={isRecording ? onSubmit : undefined} />
            </div>
            {currentQuestion.greeting ? (
              <p className="mt-4 text-sm italic text-muted border-l-2 border-brand/40 pl-3">
                &ldquo;{currentQuestion.greeting}&rdquo;
              </p>
            ) : null}
            <p className="mt-5 text-lg font-medium leading-relaxed">{currentQuestion.question}</p>

            {/* TTS controls */}
            {ttsSupported && (
              <div className="mt-4 flex items-center gap-3 border-t border-line pt-3">
                <span className="flex items-center gap-1.5 text-xs text-faint">
                  <Volume2 className={`h-3.5 w-3.5 ${speaking ? "text-brand" : ""}`} />
                  {speaking ? "Reading question aloud…" : "Question audio"}
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => speakCurrent()}
                    disabled={muted}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-elevated hover:text-ink disabled:opacity-40"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Replay
                  </button>
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-pressed={muted}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-elevated hover:text-ink"
                  >
                    {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                    {muted ? "Unmute" : "Mute"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recoverable submit error (e.g. transcription failed) */}
        {isQuestioning && state.submitError && (
          <div className="flex items-start gap-2 rounded-2xl border border-coral/30 bg-coral/5 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
            <p className="text-sm text-coral">{state.submitError}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center rounded-2xl border border-line bg-surface py-8">
          {isEvaluating ? (
            <div className="flex flex-col items-center gap-3 text-sm text-muted">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
              <p className="font-medium text-ink">Processing your answer…</p>
              <div className="flex flex-col items-center gap-1 text-xs text-faint">
                <p>🎙 Transcribing audio with Whisper AI</p>
                <p>🤖 Evaluating with Groq — generating next question</p>
                <p className="mt-1 italic">This takes 5–15 seconds</p>
              </div>
            </div>
          ) : isRecording ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-coral" />
                <span className="text-sm font-medium text-coral">Recording</span>
              </div>
              <Button onClick={onSubmit} size="lg">
                <CheckCircle2 className="h-4 w-4" /> Done — submit answer
              </Button>
              <p className="text-xs text-faint">Speak clearly, take your time.</p>
            </div>
          ) : isQuestioning ? (
            <div className="flex flex-col items-center gap-3">
              {speaking ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-sm text-brand">
                    <Volume2 className="h-5 w-5 animate-pulse" />
                    <span>Listening to question…</span>
                  </div>
                  <p className="text-xs text-faint">Recording starts automatically when done.</p>
                </div>
              ) : (
                <>
                  <Button onClick={handleStartRecording} size="lg">
                    <Mic className="h-4 w-4" />
                    {state.submitError ? "Re-record answer" : "Start recording answer"}
                  </Button>
                  <p className="text-xs text-faint">Or wait — recording starts after the question is spoken.</p>
                </>
              )}
            </div>
          ) : null}
        </div>

        {/* Per-answer feedback */}
        {lastAnswer && !lastAnswer.interview_complete && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <MessagesSquare className="h-4 w-4 text-brand" /> Previous answer
                </h3>
                {lastAnswer.answer_score !== undefined && (
                  <span className="readout rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-brand">
                    {lastAnswer.answer_score} / 100
                  </span>
                )}
              </div>
              {lastAnswer.transcript && (
                <p className="mt-3 text-sm italic text-muted">
                  &ldquo;{lastAnswer.transcript.slice(0, 200)}{lastAnswer.transcript.length > 200 ? "…" : ""}&rdquo;
                </p>
              )}
              {lastAnswer.answer_feedback && (
                <p className="mt-3 flex items-start gap-2 text-sm text-muted">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
                  {lastAnswer.answer_feedback}
                </p>
              )}
            </div>
            {lastAnswer.ideal_answer && (
              <details className="rounded-2xl border border-line bg-surface">
                <summary className="flex cursor-pointer items-center gap-2 px-5 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
                  <BookOpen className="h-4 w-4 text-faint" /> See ideal answer
                </summary>
                <p className="px-5 pb-4 text-sm leading-relaxed text-muted">{lastAnswer.ideal_answer}</p>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Right — signals */}
      <div className="hidden lg:block">
        <LiveSignals
          toneScore={state.liveToneScore}
          toneEmotion={state.liveToneEmotion}
          faceScore={state.liveFaceScore}
          faceEmotion={state.liveFaceEmotion}
          webcamRef={videoRef}
          webcamGranted={state.webcamGranted}
        />
        <div className="mt-3 space-y-1.5 text-[0.65rem] text-faint">
          <p className="flex items-center gap-1.5">
            <Mic className="h-3 w-3" />
            {isRecording ? "Recording audio…" : "Microphone ready"}
          </p>
          {!state.webcamGranted && (
            <p className="flex items-center gap-1.5">
              <MicOff className="h-3 w-3" /> Camera not detected — scoring still active
            </p>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}