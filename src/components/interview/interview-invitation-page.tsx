"use client";

/**
 * /interviews/invitation/[token]
 *
 * Candidate lands here from the invitation email.
 * Calls GET /api/interview/invitation/{token} which:
 *   - Validates the token
 *   - Marks the invitation as started
 *   - Returns { interview_id, job_title, company_name, target_role, level, tech_stack, ... }
 *
 * Then shows job details and a "Start Interview" button that navigates to
 * /interviews/new?interview_id={id} to run the actual AI interview.
 */

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Loader2, Building2, Briefcase, BarChart2,
  Code2, Globe, Clock, AlertTriangle,
} from "lucide-react";
import { Container } from "@/components/ui/section";
import { interviewApi } from "@/lib/api/endpoints/interview";

function InfoRow({ icon: Icon, label, value }: {
  icon: typeof Building2; label: string; value: string | number;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-line last:border-0">
      <Icon className="h-4 w-4 mt-0.5 shrink-0 text-brand" />
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export function InterviewInvitationPage({ token }: { token: string }) {
  const router = useRouter();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["interview-invitation", token],
    queryFn: () => interviewApi.resolveInvitation(token),
    retry: false, // don't retry on 400/403/404 — invitation errors are terminal
  });

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand mx-auto" />
          <p className="mt-4 text-sm text-muted">Validating your invitation…</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    const msg = (error as { message?: string })?.message
      ?? "This invitation link is invalid or has already been used.";
    return (
      <Container className="max-w-md py-24">
        <div className="rounded-3xl border border-coral/30 bg-surface p-10 text-center">
          <AlertTriangle className="h-10 w-10 text-coral mx-auto mb-4" />
          <h1 className="font-display text-xl font-bold">Invitation unavailable</h1>
          <p className="mt-3 text-sm text-muted">{msg}</p>
          <button
            onClick={() => router.replace("/dashboard")}
            className="mt-6 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-strong"
          >
            Go to dashboard
          </button>
        </div>
      </Container>
    );
  }

  const expiresAt = new Date(data.expires_at);
  const isExpired = expiresAt < new Date();

  return (
    <Container className="max-w-lg py-16">
      <div className="rounded-3xl border border-line bg-surface p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-soft mx-auto mb-4">
            <Briefcase className="h-8 w-8 text-brand" />
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            AI Interview Invitation
          </h1>
          <p className="mt-2 text-sm text-muted">
            <span className="font-medium text-ink">{data.company_name}</span> has invited you to
            complete an AI interview for the{" "}
            <span className="font-medium text-ink">{data.job_title}</span> position.
          </p>
        </div>

        {/* Interview details */}
        <div className="rounded-2xl border border-line bg-elevated p-4 mb-6">
          <InfoRow icon={Building2} label="Company" value={data.company_name} />
          <InfoRow icon={Briefcase} label="Position" value={data.job_title} />
          <InfoRow icon={Briefcase} label="Target role" value={data.target_role} />
          <InfoRow icon={BarChart2} label="Level" value={data.level} />
          {data.tech_stack?.length > 0 && (
            <InfoRow icon={Code2} label="Tech stack" value={data.tech_stack.join(", ")} />
          )}
          <InfoRow icon={Globe} label="Language" value={data.language} />
          <InfoRow icon={Clock} label="Questions" value={`${data.total_questions} questions`} />
        </div>

        {/* Expiry */}
        {isExpired ? (
          <div className="mb-4 rounded-xl border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral text-center">
            This invitation expired on {expiresAt.toLocaleDateString()}.
          </div>
        ) : (
          <p className="mb-4 text-center text-xs text-muted">
            Valid until{" "}
            <span className="text-ink font-medium">
              {expiresAt.toLocaleDateString(undefined, {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </span>
          </p>
        )}

        {/* Instructions */}
        <div className="mb-6 rounded-xl bg-elevated p-4 text-xs text-muted space-y-1.5">
          <p className="font-semibold text-ink text-sm mb-2">Before you begin:</p>
          <p>• Find a quiet place with good lighting</p>
          <p>• Allow microphone and camera access when prompted</p>
          <p>• The interview takes approximately {data.total_questions * 3}–{data.total_questions * 5} minutes</p>
          <p>• You cannot pause once started — make sure you&apos;re ready</p>
        </div>

        {/* CTA */}
        <button
          onClick={() => {
            const params = new URLSearchParams({
              interview_id: String(data.interview_id),
              type: "job_interview",
              job_title: data.job_title,
              target_role: data.target_role,
              level: data.level,
              language: data.language,
              total_questions: String(data.total_questions),
              tech_stack: data.tech_stack.join(","),
            });
            router.push(`/interviews/new?${params.toString()}`);
          }}
          disabled={isExpired}
          className="w-full rounded-2xl bg-brand py-3.5 text-sm font-bold text-white hover:bg-brand-strong disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isExpired ? "Invitation expired" : "Start Interview →"}
        </button>
      </div>
    </Container>
  );
}