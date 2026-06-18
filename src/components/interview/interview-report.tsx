"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Loader2, Mic, AudioWaveform, ScanFace,
  MessagesSquare, TrendingUp, Lightbulb, ArrowRight,
} from "lucide-react";
import { Container } from "@/components/ui/section";
import { interviewApi, type InterviewReport } from "@/lib/api/endpoints/interview";
import { cn } from "@/lib/utils";

function ScoreRing({
  score,
  label,
  color,
}: {
  score?: number;
  label: string;
  color: string;
}) {
  const v = score ?? 0;
  const pct = v / 100;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-20 w-20">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgb(var(--line))" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${pct * 100} 100`} strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="readout text-lg font-bold text-ink">
            {score !== undefined ? score : "—"}
          </span>
        </div>
      </div>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function QCard({
  q,
  index,
}: {
  q: NonNullable<InterviewReport["questions"]>[number];
  index: number;
}) {
  return (
    <details className="group rounded-2xl border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span className="readout shrink-0 text-xs text-faint">
          Q{index + 1}
        </span>
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{q.question}</p>
        <div className="flex shrink-0 items-center gap-2">
          {q.score !== undefined && (
            <span
              className={cn(
                "readout rounded-full px-2 py-0.5 text-xs font-bold",
                q.score >= 75
                  ? "bg-green/12 text-green"
                  : q.score >= 50
                  ? "bg-amber/12 text-amber"
                  : "bg-coral/12 text-coral",
              )}
            >
              {q.score}
            </span>
          )}
          <svg className="h-4 w-4 text-faint transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m9 18 6-6-6-6" /></svg>
        </div>
      </summary>
      <div className="space-y-3 px-5 pb-5">
        {q.audio_url && (
          <div>
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-wider text-faint">Recording</p>
            <audio controls preload="none" src={q.audio_url} className="h-9 w-full">
              Your browser does not support audio playback.
            </audio>
          </div>
        )}
        {q.transcript && (
          <div>
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-wider text-faint">Your answer</p>
            <p className="text-sm italic text-muted">&ldquo;{q.transcript}&rdquo;</p>
          </div>
        )}
        {q.feedback && (
          <div className="flex items-start gap-2">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
            <p className="text-sm text-muted">{q.feedback}</p>
          </div>
        )}
        {q.ideal_answer && (
          <div>
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-wider text-faint">Ideal answer</p>
            <p className="text-sm leading-relaxed text-muted">{q.ideal_answer}</p>
          </div>
        )}
      </div>
    </details>
  );
}

export function InterviewReport({ interviewId }: { interviewId: number }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["interview-report", interviewId],
    queryFn: () => interviewApi.report(interviewId),
    retry: 3,
    retryDelay: 2000,
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
        <p className="mt-3 text-sm text-muted">
          Generating your report… this may take a moment.
        </p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Container className="py-20 text-center">
        <p className="text-sm text-muted">
          Report couldn&apos;t be loaded. It may still be generating — try refreshing in a
          moment.
        </p>
        <Link href="/interviews" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
          Back to interviews
        </Link>
      </Container>
    );
  }

  const overall = data.overall_score ?? data.technical_score;

  return (
    <Container className="max-w-3xl py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Interview report</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight">
            {data.target_role ?? "Interview"}
          </h1>
          {data.level && <p className="mt-0.5 text-sm capitalize text-muted">{data.level}</p>}
          {data.total_questions ? (
            <p className="mt-0.5 text-xs text-faint">
              {data.questions_answered ?? data.questions?.length ?? 0} of {data.total_questions} questions answered
            </p>
          ) : null}
        </div>
        <Link href="/interviews" className="text-sm text-brand hover:underline">
          All interviews
        </Link>
      </div>

      {/* Score overview */}
      <div className="mt-6 grid place-items-center rounded-2xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-center justify-center gap-8">
          <ScoreRing score={overall} label="Overall" color="rgb(var(--accent))" />
          <ScoreRing score={data.technical_score} label="Answers" color="rgb(var(--accent))" />
          <ScoreRing score={data.tone_score} label="Tone" color="rgb(var(--amber))" />
          <ScoreRing score={data.face_score} label="Expression" color="rgb(var(--green))" />
        </div>
        {data.overall_feedback && (
          <p className="mt-5 max-w-xl text-center text-sm leading-relaxed text-muted">
            {data.overall_feedback}
          </p>
        )}
      </div>

      {/* Q&A breakdown */}
      {data.questions?.length ? (
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold tracking-tight">
            <MessagesSquare className="h-5 w-5 text-brand" />
            Question breakdown
          </h2>
          <div className="space-y-3">
            {data.questions.map((q, i) => (
              <QCard key={i} q={q} index={i} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Recommendations */}
      {data.recommendations?.length ? (
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold tracking-tight">
            <TrendingUp className="h-5 w-5 text-brand" />
            Recommendations
          </h2>
          <div className="space-y-3">
            {data.recommendations.map((r, i) => (
              <div key={i} className="rounded-2xl border border-line bg-surface p-5">
                <p className="text-sm font-semibold">{r.topic}</p>
                <p className="mt-1 text-sm text-muted">{r.reason}</p>
                {r.resources?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.resources.map((res, j) => (
                      <a key={j} href={res.startsWith("http") ? res : undefined}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-brand hover:underline">
                        {res} <ArrowRight className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-8 flex justify-center">
        <Link href="/interviews/new"
          className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface px-6 py-3 text-sm font-medium hover:border-brand hover:text-brand">
          <Mic className="h-4 w-4" />
          Start another practice session
        </Link>
      </div>
    </Container>
  );
}
