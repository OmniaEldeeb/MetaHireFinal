"use client";

import { imgUrl } from "@/lib/utils";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Building2, MapPin, Clock, Loader2,
  CheckCircle2, CalendarClock, Bookmark, BookmarkCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { jobsApi, normalizeJob } from "@/lib/api/endpoints/jobs";
import { candidateApplicationsApi } from "@/lib/api/endpoints/applications";
import { ApplyModal } from "@/components/applications/apply-modal";
import { useAuthStore } from "@/stores/auth.store";
import { useToastStore } from "@/stores/toast.store";
import { WORK_TYPE_LABELS, WORK_MODEL_LABELS, EXPERIENCE_LEVEL_LABELS } from "@/lib/constants/labels";
import type { WorkType, WorkModel, ExperienceLevel } from "@/lib/constants/enums";

export function JobDetail({ id }: { id: number }) {
  const qc = useQueryClient();
  const status = useAuthStore((s) => s.status);
  const role = useAuthStore((s) => s.role);
  const toast = useToastStore((s) => s.push);
  const [applyOpen, setApplyOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState<boolean | null>(null);

  // Always fetch saved-jobs so we know if this job is saved after a page refresh.
  // Uses the same queryKey ["saved-jobs"] so it's shared with the saved-jobs page cache.
  const savedJobsQ = useQuery({
    queryKey: ["saved-jobs"],
    queryFn: candidateApplicationsApi.savedJobs,
    enabled: status === "authenticated" && role === "candidate",
    staleTime: 60_000,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["job", id],
    queryFn: () => jobsApi.get(id),
  });

  if (isLoading) return (
    <div className="grid place-items-center py-24">
      <Loader2 className="h-6 w-6 animate-spin text-brand" />
    </div>
  );

  const job = normalizeJob(data);
  if (isError || !job) return (
    <Container className="py-20 text-center text-sm text-muted">
      Job not found.{" "}
      <Link href="/jobs" className="text-brand hover:underline">Back to jobs</Link>
    </Container>
  );

  const badges = [
    job.work_type ? WORK_TYPE_LABELS[job.work_type as WorkType] : null,
    job.work_model ? WORK_MODEL_LABELS[job.work_model as WorkModel] : null,
    job.experience_level ? EXPERIENCE_LEVEL_LABELS[job.experience_level as ExperienceLevel] : null,
  ].filter(Boolean) as string[];

  // Resolve saved state: explicit toggle overrides > fetched list > false
  const fetchedSavedJobs = savedJobsQ.data ?? [];
  const savedState = isSaved !== null
    ? isSaved
    : fetchedSavedJobs.some((j) => j.id === id);

  const save = async () => {
    if (status !== "authenticated") return;
    setSaving(true);
    // Optimistic update
    setIsSaved(!savedState);
    try {
      const res = await candidateApplicationsApi.saveJob(id);
      setIsSaved(res.saved);
      qc.invalidateQueries({ queryKey: ["saved-jobs"] });
      toast({ kind: "success", title: res.saved ? "Job saved" : "Job removed from saved" });
    } catch {
      setIsSaved(savedState); // revert on error
      toast({ kind: "error", title: "Couldn't save job" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container className="max-w-3xl py-8">
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All jobs
      </Link>

      <div className="mt-5 rounded-2xl border border-line bg-surface p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line bg-elevated">
            {job.company?.logo_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={imgUrl(job.company.logo_url) ?? ""} alt="" className="h-full w-full object-cover" />
              : <Building2 className="h-6 w-6 text-faint" />}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-extrabold tracking-tight">{job.title}</h1>
            <p className="mt-1 text-muted">{job.company?.name ?? "Company"}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
              {job.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-faint" />{job.location}</span>}
              {job.created_at && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-faint" />{new Date(job.created_at).toLocaleDateString()}</span>}
              {job.expires_at && <span className="flex items-center gap-1.5"><CalendarClock className="h-4 w-4 text-faint" />Closes {new Date(job.expires_at).toLocaleDateString()}</span>}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {badges.map((b) => (
            <span key={b} className="rounded-lg bg-elevated px-2.5 py-1 text-xs font-medium text-muted">{b}</span>
          ))}
          {job.salary_range && (
            <span className="rounded-lg bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">{job.salary_range}</span>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-6">
          {status !== "authenticated"
            ? <Button href={`/login?next=/jobs/${id}`} size="lg">Sign in to apply</Button>
            : role === "candidate"
            ? <Button size="lg" onClick={() => setApplyOpen(true)}>Apply now</Button>
            : <p className="text-sm text-muted">Viewing as company.</p>}
          {status === "authenticated" && role === "candidate" && (
            <button
              onClick={save}
              disabled={saving}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50",
                savedState
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-line2 bg-surface text-muted hover:border-brand hover:text-brand"
              )}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : savedState ? (
                <BookmarkCheck className="h-4 w-4 fill-current" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
              {saving ? "Saving…" : savedState ? "Saved" : "Save job"}
            </button>
          )}
        </div>
      </div>

      {job.description && (
        <section className="mt-6 rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-bold tracking-tight">About the role</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">{job.description}</p>
        </section>
      )}

      {job.requirements?.length ? (
        <section className="mt-6 rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-bold tracking-tight">Requirements</h2>
          <ul className="mt-3 space-y-2">
            {job.requirements.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-muted">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />{r}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {job.skills?.length ? (
        <section className="mt-6 rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-bold tracking-tight">Skills</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.skills.map((s) => (
              <span key={s} className="rounded-lg bg-brand-soft px-2.5 py-1 text-sm text-brand">{s}</span>
            ))}
          </div>
        </section>
      ) : null}

      {applyOpen && (
        <ApplyModal
          jobId={id}
          jobTitle={job.title}
          onClose={() => setApplyOpen(false)}
        />
      )}
    </Container>
  );
}