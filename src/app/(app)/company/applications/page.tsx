"use client";
import { imgUrl } from "@/lib/utils";

/**
 * All applicants — company cross-job view.
 *
 * The backend has no single "list all applications" endpoint.
 * Per the API docs the only company-side list is:
 *   GET /company/jobs/{job}/applications  (per-job)
 *
 * Strategy:
 *  1. Fetch all the company's jobs (GET /company/jobs).
 *  2. Let the user pick a job from a dropdown.
 *  3. Load that job's applications (GET /company/jobs/{job}/applications).
 *
 * This gives a proper cross-job view without a missing endpoint.
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Loader2, Users, ChevronRight, Building2, MapPin,
  X, UserCheck, Send, CalendarRange,
} from "lucide-react";
import { cn, imgUrl } from "@/lib/utils";
import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { companyJobsApi, type CompanyApplication } from "@/lib/api/endpoints/company-jobs";
import {
  APPLICATION_STATUS_COLORS,
  APPLICATION_STATUS_LABELS,
} from "@/lib/constants/labels";
import { APPLICATION_STATUS } from "@/lib/constants/enums";
import type { ApplicationStatus } from "@/lib/constants/enums";
import { useToastStore } from "@/stores/toast.store";
import type { Job } from "@/lib/api/endpoints/jobs";

// ── Applicant drawer ─────────────────────────────────────────────────────────
function ApplicantDrawer({
  app,
  onClose,
}: {
  app: CompanyApplication;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus>(
    app.status ?? "pending",
  );

  const updateStatus = async (s: ApplicationStatus) => {
    setCurrentStatus(s);
    setSaving(true);
    try {
      await companyJobsApi.updateStatus(app.id, { status: s });
      qc.invalidateQueries({ queryKey: ["company-applications"] });
      toast({ kind: "success", title: "Status updated" });
    } catch {
      toast({ kind: "error", title: "Update failed" });
    } finally {
      setSaving(false);
    }
  };

  const invite = async (kind: "ai" | "final") => {
    setInviting(kind);
    try {
      if (kind === "ai") await companyJobsApi.invite(app.id);
      else await companyJobsApi.inviteFinal(app.id);
      qc.invalidateQueries({ queryKey: ["company-applications"] });
      toast({ kind: "success", title: "Invitation sent" });
    } catch {
      toast({ kind: "error", title: "Invite failed" });
    } finally {
      setInviting(null);
    }
  };

  const c = app.candidate;
  // UserResource returns profile fields flat on the user object.
  // Fallback to nested candidate_profile for any legacy shape.
  const p = c?.candidate_profile ?? {
    profile_image_url: c?.profile_image_url,
    headline: c?.headline,
    location: c?.location,
    skills: c?.skills,
  };

  return (
    <div className="fixed inset-0 z-[400] flex justify-end" onClick={onClose}>
      <div
        className="modal-in flex h-full w-full max-w-sm flex-col overflow-y-auto border-l border-line bg-bg-2 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="font-display text-base font-bold">Applicant detail</h3>
          <button onClick={onClose} className="text-faint hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Candidate */}
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-elevated">
              {p?.profile_image_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={imgUrl(p.profile_image_url) ?? ""} alt="" className="h-full w-full object-cover" />
                : <span className="font-display text-lg font-bold text-brand">{c?.name?.charAt(0) ?? "?"}</span>}
            </div>
            <div>
              <p className="font-semibold">{c?.name ?? "Candidate"}</p>
              <p className="text-sm text-muted">{c?.email}</p>
              {p?.headline && <p className="mt-0.5 text-sm text-muted">{p.headline}</p>}
              {p?.location && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-faint">
                  <MapPin className="h-3 w-3" />{p.location}
                </p>
              )}
            </div>
          </div>

          {/* Scores */}
          {(app.cv_score !== undefined || app.final_score !== undefined) && (
            <div className="flex items-center justify-around rounded-2xl border border-line bg-surface px-4 py-4">
              {app.cv_score !== undefined && app.cv_score !== null && (
                <div className="text-center">
                  <div className="readout text-lg font-bold text-brand">{app.cv_score}</div>
                  <div className="text-[0.65rem] text-faint">CV score</div>
                </div>
              )}
              {app.cv_score !== undefined && app.final_score !== undefined && (
                <div className="h-10 w-px bg-line" />
              )}
              {app.final_score !== undefined && app.final_score !== null && (
                <div className="text-center">
                  <div className="readout text-lg font-bold text-amber">{app.final_score}</div>
                  <div className="text-[0.65rem] text-faint">AI score</div>
                </div>
              )}
            </div>
          )}

          {/* Skills */}
          {p?.skills?.length ? (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-faint">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {p.skills.map((s) => (
                  <span key={s} className="rounded-lg bg-brand-soft px-2 py-0.5 text-xs text-brand">{s}</span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Status pipeline */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-faint">Status</p>
            <div className="grid grid-cols-2 gap-1.5">
              {APPLICATION_STATUS.map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={saving}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-medium transition-colors text-left",
                    currentStatus === s
                      ? APPLICATION_STATUS_COLORS[s] + " border-transparent"
                      : "border-line hover:border-brand/40",
                  )}
                >
                  {APPLICATION_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button className="w-full" variant="outline" onClick={() => invite("ai")} disabled={inviting !== null}>
              {inviting === "ai" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Invite to AI interview
            </Button>
            <Button className="w-full" variant="outline" onClick={() => invite("final")} disabled={inviting !== null}>
              {inviting === "final" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
              Invite to final round
            </Button>
            {app.job?.id && (
              <Button className="w-full" variant="outline" href={`/company/jobs/${app.job.id}/applicants`}>
                <CalendarRange className="h-4 w-4" />
                Full job pipeline
              </Button>
            )}
          </div>

          {/* Cover letter */}
          {app.cover_letter && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-faint">Cover letter</p>
              <p className="whitespace-pre-line text-sm text-muted">{app.cover_letter}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AllApplicantsPage() {
  const [selectedJobId, setSelectedJobId] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<CompanyApplication | null>(null);

  // 1. Load all company jobs
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["company-jobs"],
    queryFn: companyJobsApi.listJobs,
    staleTime: 60_000,
  });

  const jobList: Job[] = jobs ?? [];

  // 2. Load applications for selected job (only when a specific job is chosen)
  const activeJobId = selectedJobId !== "all" ? selectedJobId : jobList[0]?.id;

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ["company-applications", activeJobId, statusFilter, page],
    queryFn: () =>
      companyJobsApi.applications(activeJobId!, {
        page,
        ...(statusFilter ? { status: statusFilter } : {}),
      }),
    enabled: !!activeJobId,
  });

  const items = appsData?.items ?? [];
  const lastPage = appsData?.lastPage ?? 1;
  const total = appsData?.total ?? 0;

  const selectCls =
    "h-10 rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-brand";

  const isLoading = jobsLoading || (!!activeJobId && appsLoading);

  return (
    <Container className="py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">All applicants</h1>
          <p className="mt-1 text-sm text-muted">
            Review and manage candidates across your job postings.
          </p>
        </div>
        <Button href="/company/jobs/new" size="sm" variant="outline">
          Post a new job
        </Button>
      </div>

      {/* Filters */}
      {jobList.length > 0 && (
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-faint">Job posting</p>
            <select
              className={selectCls}
              value={selectedJobId === "all" ? (jobList[0]?.id ?? "") : selectedJobId}
              onChange={(e) => {
                setSelectedJobId(Number(e.target.value));
                setPage(1);
              }}
            >
              {jobList.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}{j.is_active === false ? " (paused)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-faint">Status</p>
            <select
              className={selectCls}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All statuses</option>
              {APPLICATION_STATUS.map((s) => (
                <option key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          {statusFilter && (
            <button
              onClick={() => { setStatusFilter(""); setPage(1); }}
              className="h-10 rounded-xl border border-line px-3 text-sm text-muted hover:border-brand hover:text-ink"
            >
              Clear
            </button>
          )}

          {activeJobId && (
            <Link
              href={`/company/jobs/${activeJobId}/applicants`}
              className="ml-auto flex h-10 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-medium text-muted hover:border-brand hover:text-brand"
            >
              Full pipeline view <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      {/* Content */}
      <div className="mt-6">
        {jobsLoading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : jobList.length === 0 ? (
          <div className="grid place-items-center gap-4 rounded-2xl border border-line bg-surface py-20 text-center">
            <Users className="h-10 w-10 text-faint" />
            <div>
              <p className="font-semibold">No jobs yet</p>
              <p className="mt-1 text-sm text-muted">Post a job to start receiving applications.</p>
            </div>
            <Button href="/company/jobs/new" size="sm">Post a job</Button>
          </div>
        ) : isLoading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : items.length === 0 ? (
          <div className="grid place-items-center gap-3 rounded-2xl border border-line bg-surface py-16 text-center">
            <Users className="h-8 w-8 text-faint" />
            <p className="text-sm text-muted">
              {statusFilter
                ? `No applicants with status "${APPLICATION_STATUS_LABELS[statusFilter as ApplicationStatus] ?? statusFilter}".`
                : "No applications for this role yet."}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-faint">
              {total} application{total !== 1 ? "s" : ""}
            </p>
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              {items.map((app, i) => {
                const c = app.candidate;
                const p = c?.candidate_profile ?? {
                  profile_image_url: c?.profile_image_url,
                  headline: c?.headline,
                };
                return (
                  <button
                    key={app.id}
                    onClick={() => setSelected(app)}
                    className={cn(
                      "flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-elevated",
                      i > 0 && "border-t border-line",
                    )}
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-elevated">
                      {p?.profile_image_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={imgUrl(p.profile_image_url) ?? ""} alt="" className="h-full w-full object-cover rounded-full" />
                        : <Building2 className="h-5 w-5 text-faint" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{c?.name ?? `Applicant #${app.id}`}</p>
                      <p className="truncate text-xs text-muted">{p?.headline ?? c?.email}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {app.cv_score !== undefined && app.cv_score !== null && (
                        <span className="readout hidden rounded-lg bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand sm:inline-block">
                          CV {app.cv_score}
                        </span>
                      )}
                      {app.status && (
                        <span className={cn(
                          "hidden rounded-full px-2.5 py-0.5 text-xs font-medium md:inline-flex",
                          APPLICATION_STATUS_COLORS[app.status],
                        )}>
                          {APPLICATION_STATUS_LABELS[app.status]}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-faint" />
                    </div>
                  </button>
                );
              })}
            </div>

            {lastPage > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-xl border border-line2 bg-surface px-4 py-2 text-sm disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="readout text-sm text-muted">{page} / {lastPage}</span>
                <button
                  disabled={page >= lastPage}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl border border-line2 bg-surface px-4 py-2 text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selected && <ApplicantDrawer app={selected} onClose={() => setSelected(null)} />}
    </Container>
  );
}
