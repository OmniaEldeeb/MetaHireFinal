"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Loader2,
  Briefcase,
  Building2,
  MapPin,
  ChevronRight,
  ChevronLeft,
  X,
  FileText,
  Clock,
  Bookmark,
} from "lucide-react";
import { Container } from "@/components/ui/section";
import { ApplicationRowSkeleton } from "@/components/ui/skeleton";
import {
  candidateApplicationsApi,
  normalizeApplications,
  type Application,
} from "@/lib/api/endpoints/applications";
import {
  APPLICATION_STATUS_COLORS,
  APPLICATION_STATUS_LABELS,
  WORK_TYPE_LABELS,
  WORK_MODEL_LABELS,
} from "@/lib/constants/labels";
import type { ApplicationStatus, WorkType, WorkModel } from "@/lib/constants/enums";
import { cn, imgUrl } from "@/lib/utils";

function StatusBadge({ status }: { status?: ApplicationStatus }) {
  if (!status) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        APPLICATION_STATUS_COLORS[status] ?? "bg-elevated text-muted",
      )}
    >
      {APPLICATION_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function timeAgo(iso?: string) {
  if (!iso) return "";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function DrawerRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-faint">
        {label}
      </p>
      <p className="mt-1 text-sm text-ink">{value}</p>
    </div>
  );
}

function ApplicationDrawer({
  app,
  onClose,
}: {
  app: Application;
  onClose: () => void;
}) {
  const job = app.job;
  return (
    <div className="fixed inset-0 z-[400] flex justify-end" onClick={onClose}>
      <div className="w-full max-w-sm" />
      <div
        className="modal-in flex h-full w-full max-w-sm flex-col overflow-y-auto border-l border-line bg-bg-2 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="font-display text-base font-bold">Application detail</h3>
          <button onClick={onClose} className="text-faint hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-5 p-5">
          <StatusBadge status={app.status} />

          {job ? (
            <div className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-elevated">
                  {job.company?.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgUrl(job.company.logo_url) ?? ""} alt="" className="h-full w-full object-cover rounded-xl" />
                  ) : (
                    <Building2 className="h-5 w-5 text-faint" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold">{job.title}</p>
                  <p className="text-xs text-muted">{job.company?.name}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {job.location}
                  </span>
                )}
                {job.work_type && (
                  <span>{WORK_TYPE_LABELS[job.work_type as WorkType]}</span>
                )}
                {job.work_model && (
                  <span>{WORK_MODEL_LABELS[job.work_model as WorkModel]}</span>
                )}
              </div>
              <Link
                href={`/jobs/${job.id}`}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
              >
                View full job <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : null}

          <div className="space-y-4 text-sm">
            <DrawerRow
              label="Applied"
              value={app.created_at ? new Date(app.created_at).toLocaleDateString() : null}
            />
            <DrawerRow
              label="Last updated"
              value={app.updated_at ?? app.created_at ? timeAgo(app.updated_at ?? app.created_at) : null}
            />
            {app.final_schedule ? (() => {
              const fs = app.final_schedule;
              return (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-faint">Final interview</p>
                  <div className="mt-2 rounded-xl border border-line bg-surface p-3 space-y-1.5 text-sm">
                    {fs.format && (
                      <p className="capitalize text-ink font-medium">
                        {fs.format.replace("_", " ")}
                      </p>
                    )}
                    {fs.scheduled_at && (
                      <p className="text-muted">
                        {new Date(fs.scheduled_at).toLocaleString()}
                      </p>
                    )}
                    {!fs.scheduled_at && fs.window_start && (
                      <p className="text-muted">
                        Window: {new Date(fs.window_start).toLocaleDateString()} –{" "}
                        {fs.window_end ? new Date(fs.window_end).toLocaleDateString() : ""}
                      </p>
                    )}
                    {fs.location && <p className="text-muted">{fs.location}</p>}
                    {fs.meeting_link && (
                      <a href={fs.meeting_link} target="_blank" rel="noopener noreferrer"
                        className="text-brand hover:underline text-xs">
                        Join meeting →
                      </a>
                    )}
                    {fs.contact_person && (
                      <p className="text-muted text-xs">Contact: {fs.contact_person}</p>
                    )}
                    {fs.confirmed_by_candidate ? (
                      <span className="inline-block rounded-full bg-green/12 px-2 py-0.5 text-xs text-green font-medium">Confirmed</span>
                    ) : (
                      <span className="inline-block rounded-full bg-amber/12 px-2 py-0.5 text-xs text-amber font-medium">Awaiting confirmation</span>
                    )}
                  </div>
                </div>
              );
            })() : null}
            {app.cover_letter ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-faint">
                  Cover letter
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-muted">
                  {app.cover_letter}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ApplicationsManager() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Application | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["applications", page],
    queryFn: () => candidateApplicationsApi.list(page),
  });

  const { items, lastPage, total } = normalizeApplications(data);

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            Applications
          </h1>
          <p className="mt-1 text-sm text-muted">
            Track every role you&apos;ve applied to.
          </p>
        </div>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
        >
          <Briefcase className="h-4 w-4" />
          Browse jobs
        </Link>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {Array.from({length:4}).map((_,i)=><ApplicationRowSkeleton key={i}/>)}
          </div>
        ) : isError ? (
          <p className="py-16 text-center text-sm text-muted">
            Couldn&apos;t load applications. Please refresh.
          </p>
        ) : items.length === 0 ? (
          <div className="grid place-items-center gap-3 py-20 text-center">
            <FileText className="h-8 w-8 text-faint" />
            <p className="text-sm text-muted">
              No applications yet. Find a role and apply!
            </p>
            <Link href="/jobs" className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium hover:border-brand">
              <Briefcase className="h-4 w-4" />
              Browse jobs
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-faint">
              {total} application{total !== 1 ? "s" : ""}
            </p>

            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              {items.map((app, idx) => {
                const job = app.job;
                return (
                  <button
                    key={app.id}
                    onClick={() => setSelected(app)}
                    className={cn(
                      "flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-elevated",
                      idx > 0 && "border-t border-line",
                    )}
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-elevated">
                      {job?.company?.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imgUrl(job.company.logo_url) ?? ""} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Briefcase className="h-5 w-5 text-faint" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {job?.title ?? `Application #${app.id}`}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {job?.company?.name ?? "Company"}
                        {job?.location ? ` · ${job.location}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge status={app.status} />
                      <span className="hidden items-center gap-1 text-xs text-faint sm:flex">
                        <Clock className="h-3.5 w-3.5" />
                        {timeAgo(app.created_at)}
                      </span>
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
                  className="inline-flex h-10 items-center gap-1 rounded-xl border border-line2 bg-surface px-4 text-sm disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>
                <span className="readout text-sm text-muted">
                  {page} / {lastPage}
                </span>
                <button
                  disabled={page >= lastPage}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex h-10 items-center gap-1 rounded-xl border border-line2 bg-surface px-4 text-sm disabled:opacity-40"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selected && (
        <ApplicationDrawer app={selected} onClose={() => setSelected(null)} />
      )}
    </Container>
  );
}

export function SavedJobsManager() {
  const { data, isLoading } = useQuery({
    queryKey: ["saved-jobs"],
    queryFn: candidateApplicationsApi.savedJobs,
  });
  const items = Array.isArray(data)
    ? data
    : ((data as { data?: unknown[] } | undefined)?.data ?? []);

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            Saved jobs
          </h1>
          <p className="mt-1 text-sm text-muted">Roles you&apos;ve bookmarked.</p>
        </div>
      </div>
      <div className="mt-6">
        {isLoading ? (
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {Array.from({length:4}).map((_,i)=><ApplicationRowSkeleton key={i}/>)}
          </div>
        ) : (items as unknown[]).length === 0 ? (
          <div className="grid place-items-center gap-3 py-20 text-center">
            <Bookmark className="h-8 w-8 text-faint" />
            <p className="text-sm text-muted">
              No saved jobs yet — bookmark roles from the job board.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(items as { id: number; title?: string; company?: { name?: string; logo_url?: string }; location?: string }[]).map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-brand/40"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-elevated">
                  {job.company?.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgUrl(job.company.logo_url) ?? ""} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Briefcase className="h-5 w-5 text-faint" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{job.title}</p>
                  <p className="truncate text-xs text-muted">
                    {job.company?.name}{job.location ? ` · ${job.location}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
