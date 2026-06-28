"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Loader2, Mic, MessagesSquare, Lightbulb,
} from "lucide-react";
import { Container } from "@/components/ui/section";
import { interviewApi, type InterviewReport } from "@/lib/api/endpoints/interview";
import { cn } from "@/lib/utils";

function fmtDate(value?: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ScoreRing({
  score,
  label,
  color,
}: {
  score?: number | null;
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
            {score !== undefined && score !== null ? score : "—"}
          </span>
        </div>
      </div>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

/** A labelled value in the interview meta grid. Hidden if there's no value. */
function Meta({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-faint">
        {label}
      </span>
      <span className="text-sm text-ink">{value}</span>
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
          Q{q.question_number ?? index + 1}
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
              {q.score} / 100
            </span>
          )}
          <svg className="h-4 w-4 text-faint transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m9 18 6-6-6-6" /></svg>
        </div>
      </summary>
      <div className="space-y-3 px-5 pb-5">
        {q.expected_time !== undefined && (
          <p className="text-[0.65rem] font-medium uppercase tracking-wider text-faint">
            Expected time: {q.expected_time} min
          </p>
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

  const started = fmtDate(data.started_at);
  const finished = fmtDate(data.finished_at);

  return (
    <Container className="max-w-3xl py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Interview report</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight">
            {data.target_role ?? "Interview"}
          </h1>
          {data.level && <p className="mt-0.5 text-sm capitalize text-muted">{data.level}</p>}
        </div>
        <Link href="/interviews" className="text-sm text-brand hover:underline">
          All interviews
        </Link>
      </div>

      {/* Interview details */}
      <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-line bg-surface p-6 sm:grid-cols-3">
        <Meta label="Type" value={data.type ? <span className="capitalize">{data.type}</span> : undefined} />
        <Meta label="Status" value={data.status ? <span className="capitalize">{data.status.replace(/_/g, " ")}</span> : undefined} />
        <Meta label="Target company" value={data.target_company} />
        <Meta label="Level" value={data.level ? <span className="capitalize">{data.level}</span> : undefined} />
        <Meta label="Experience" value={data.experience_years !== undefined ? `${data.experience_years} yrs` : undefined} />
        <Meta label="Language" value={data.language ? data.language.toUpperCase() : undefined} />
        <Meta label="Total questions" value={data.total_questions} />
        <Meta label="Started" value={started} />
        <Meta label="Finished" value={finished} />
        {data.tech_stack?.length ? (
          <div className="col-span-2 flex flex-col gap-1 sm:col-span-3">
            <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-faint">
              Tech stack
            </span>
            <div className="flex flex-wrap gap-1.5">
              {data.tech_stack.map((t) => (
                <span key={t} className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand">
                  {t}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Scores */}
      <div className="mt-6 grid place-items-center rounded-2xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-center justify-center gap-8">
          <ScoreRing score={data.communication_score} label="Communication" color="rgb(var(--amber))" />
          <ScoreRing score={data.technical_score} label="Technical" color="rgb(var(--accent))" />
          <ScoreRing score={data.overall_score} label="Final" color="rgb(var(--green))" />
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