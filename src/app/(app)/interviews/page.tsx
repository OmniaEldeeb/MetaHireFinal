"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Mic, ArrowRight, Clock } from "lucide-react";
import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { interviewApi, type PastInterview } from "@/lib/api/endpoints/interview";

function timeAgo(iso?: string) {
  if (!iso) return "";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d <= 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`;
}

export default function InterviewsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["interviews"],
    queryFn: interviewApi.history,
  });
  const items: PastInterview[] = Array.isArray(data) ? data : [];

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Interviews</h1>
          <p className="mt-1 text-sm text-muted">Practice and real interview sessions.</p>
        </div>
        <Button href="/interviews/new" size="sm">
          <Mic className="h-4 w-4" /> New session
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
        ) : items.length === 0 ? (
          <div className="grid place-items-center gap-4 rounded-2xl border border-line bg-surface py-20 text-center">
            <Mic className="h-10 w-10 text-faint" />
            <div>
              <p className="font-semibold">No interviews yet</p>
              <p className="mt-1 text-sm text-muted">Start a practice session to see your results here.</p>
            </div>
            <Button href="/interviews/new">Start your first interview</Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {items.map((iv, i) => (
              <Link key={iv.id} href={`/interviews/${iv.id}/report`}
                className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-elevated ${i > 0 ? "border-t border-line" : ""}`}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Mic className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{iv.target_role ?? "Practice interview"}</p>
                  <p className="text-xs capitalize text-muted">{iv.level ?? ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  {typeof iv.final_score === "number" && (
                    <span className="readout rounded-full bg-green/12 px-2.5 py-0.5 text-xs font-bold text-green">
                      Overall {iv.final_score}
                    </span>
                  )}
                  {typeof iv.technical_score === "number" && (
                    <span className="readout rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-brand">
                      Answers {iv.technical_score}
                    </span>
                  )}
                  {typeof iv.final_score !== "number" &&
                    typeof iv.technical_score !== "number" && (
                      <span className="rounded-full bg-elevated px-2.5 py-0.5 text-xs font-medium capitalize text-faint">
                        {iv.status ? iv.status.replace(/_/g, " ") : "no score"}
                      </span>
                    )}
                  <span className="hidden items-center gap-1 text-xs text-faint sm:flex">
                    <Clock className="h-3.5 w-3.5" />{timeAgo(iv.started_at ?? iv.finished_at ?? "")}
                  </span>
                  <ArrowRight className="h-4 w-4 text-faint" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}