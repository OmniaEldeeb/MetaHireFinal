"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  Loader2, Users, UserCheck, Trophy, Zap, X,
  ChevronRight, MapPin, Building2, CalendarRange, Send,
} from "lucide-react";
import { cn, imgUrl } from "@/lib/utils";
import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { companyJobsApi, type CompanyApplication } from "@/lib/api/endpoints/company-jobs";
import { APPLICATION_STATUS_COLORS, APPLICATION_STATUS_LABELS } from "@/lib/constants/labels";
import { APPLICATION_STATUS } from "@/lib/constants/enums";
import { useToastStore } from "@/stores/toast.store";
import type { ApplicationStatus } from "@/lib/constants/enums";

function ScorePill({ label, value, color }: { label: string; value?: number; color: string }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="text-center">
      <div className={`readout text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[0.65rem] text-faint">{label}</div>
    </div>
  );
}

interface ScheduleValues {
  window_start: string;
  window_end: string;
  format: "in_person" | "online" | "phone";
  location: string;
  meeting_link: string;
  contact_person: string;
  contact_email: string;
  duration_minutes: string;
  notes: string;
}

function ScheduleModal({ appId, onClose }: { appId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<ScheduleValues>({
    defaultValues: { format: "in_person", duration_minutes: "60" },
  });
  const fmt = watch("format");

  const onSubmit = async (v: ScheduleValues) => {
    try {
      await companyJobsApi.scheduleFinal(appId, {
        window_start: v.window_start,
        window_end: v.window_end,
        format: v.format,
        location: v.location || undefined,
        meeting_link: v.meeting_link || undefined,
        contact_person: v.contact_person || undefined,
        contact_email: v.contact_email || undefined,
        duration_minutes: Number(v.duration_minutes),
        notes: v.notes || undefined,
      });
      qc.invalidateQueries({ queryKey: ["company-applications"] });
      toast({ kind: "success", title: "Final interview scheduled" });
      onClose();
    } catch {
      toast({ kind: "error", title: "Schedule failed" });
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" onClick={onClose}>
      <div className="modal-in w-full max-w-lg overflow-hidden rounded-3xl border border-line2 bg-bg-2 shadow-lift" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-display text-lg font-bold tracking-tight">Schedule final interview</h2>
          <button onClick={onClose} className="text-faint hover:text-ink"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Window start" htmlFor="ws">
              <Input id="ws" type="datetime-local" {...register("window_start", { required: true })} />
            </Field>
            <Field label="Window end" htmlFor="we">
              <Input id="we" type="datetime-local" {...register("window_end", { required: true })} />
            </Field>
          </div>
          <Field label="Format" htmlFor="fmt">
            <select id="fmt" className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-brand" {...register("format")}>
              <option value="in_person">In person</option>
              <option value="online">Online</option>
              <option value="phone">Phone</option>
            </select>
          </Field>
          {fmt === "in_person" && (
            <Field label="Location" htmlFor="loc" optional>
              <Input id="loc" placeholder="90 Tahrir Square, Cairo" {...register("location")} />
            </Field>
          )}
          {fmt === "online" && (
            <Field label="Meeting link" htmlFor="ml" optional>
              <Input id="ml" type="url" placeholder="https://meet.google.com/…" {...register("meeting_link")} />
            </Field>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact person" htmlFor="cp" optional>
              <Input id="cp" {...register("contact_person")} />
            </Field>
            <Field label="Contact email" htmlFor="ce" optional>
              <Input id="ce" type="email" {...register("contact_email")} />
            </Field>
            <Field label="Duration (min)" htmlFor="dur">
              <Input id="dur" type="number" {...register("duration_minutes")} />
            </Field>
          </div>
          <Field label="Notes" htmlFor="notes" optional>
            <Textarea id="notes" rows={3} placeholder="Bring your portfolio…" {...register("notes")} />
          </Field>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Scheduling…</> : <><CalendarRange className="h-4 w-4" />Schedule interview</>}
          </Button>
        </form>
      </div>
    </div>
  );
}

function ApplicantDrawer({ app, onClose }: { app: CompanyApplication; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);
  const [status, setStatus] = useState<ApplicationStatus>(app.status ?? "pending");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState(false);

  const updateStatus = async (s: ApplicationStatus) => {
    setStatus(s);
    setSaving(true);
    try {
      await companyJobsApi.updateStatus(app.id, { status: s, notes: notes || undefined });
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
      toast({ kind: "success", title: `Invitation sent` });
    } catch {
      toast({ kind: "error", title: "Invite failed" });
    } finally {
      setInviting(null);
    }
  };

  const c = app.candidate;
  const p = c?.candidate_profile;

  return (
    <div className="fixed inset-0 z-[400] flex justify-end" onClick={onClose}>
      <div
        className="modal-in flex h-full w-full max-w-sm flex-col overflow-y-auto border-l border-line bg-bg-2 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="font-display text-base font-bold">Applicant detail</h3>
          <button onClick={onClose} className="text-faint hover:text-ink"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Candidate */}
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-elevated">
              {p?.profile_image_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img loading="lazy" src={imgUrl(p.profile_image_url) ?? ""} alt="" className="h-full w-full object-cover" />
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
          <div className="flex items-center justify-around rounded-2xl border border-line bg-surface px-4 py-4">
            <ScorePill label="CV score" value={app.cv_score} color="text-brand" />
            <div className="h-10 w-px bg-line" />
            <ScorePill label="AI score" value={app.final_score} color="text-amber" />
          </div>

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
                    status === s
                      ? APPLICATION_STATUS_COLORS[s] + " border-transparent"
                      : "border-line hover:border-brand/40",
                  )}
                >
                  {APPLICATION_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-faint">Notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes…"
              className="w-full resize-none rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => invite("ai")}
              disabled={inviting !== null}
            >
              {inviting === "ai" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Invite to AI interview
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => invite("final")}
              disabled={inviting !== null}
            >
              {inviting === "final" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
              Invite to final round
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setScheduling(true)}
            >
              <CalendarRange className="h-4 w-4" />
              Schedule final interview
            </Button>
          </div>

          {app.cover_letter && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-faint">Cover letter</p>
              <p className="whitespace-pre-line text-sm text-muted">{app.cover_letter}</p>
            </div>
          )}
        </div>
      </div>
      {scheduling && <ScheduleModal appId={app.id} onClose={() => setScheduling(false)} />}
    </div>
  );
}

export function ApplicantsList({ jobId }: { jobId: number }) {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<CompanyApplication | null>(null);
  const [autoInviting, setAutoInviting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["company-applications", jobId, page],
    queryFn: () => companyJobsApi.applications(jobId, { page }),
  });

  const { data: statsRaw } = useQuery({
    queryKey: ["company-app-stats", jobId],
    queryFn: () => companyJobsApi.applicationStats(jobId),
  });
  const stats = statsRaw
    ? ((statsRaw as { data?: Record<string, number> }).data ?? (statsRaw as Record<string, number>))
    : {};

  const items = data?.items ?? [];
  const lastPage = data?.lastPage ?? 1;
  const total = data?.total ?? 0;

  const autoInvite = async () => {
    setAutoInviting(true);
    try {
      await companyJobsApi.autoInvite(jobId);
      qc.invalidateQueries({ queryKey: ["company-applications", jobId] });
      toast({ kind: "success", title: "Top candidates invited!" });
    } catch {
      toast({ kind: "error", title: "Auto-invite failed" });
    } finally {
      setAutoInviting(false);
    }
  };

  return (
    <Container className="py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Applicants</h1>
          <p className="mt-1 text-sm text-muted">{total} application{total !== 1 ? "s" : ""} for this role.</p>
        </div>
        <Button onClick={autoInvite} disabled={autoInviting} variant="outline" size="sm">
          {autoInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          Auto-invite top candidates
        </Button>
      </div>

      {/* Stats strip */}
      {Object.keys(stats).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {(Object.entries(stats) as [string, number][])
            .filter(([, v]) => typeof v === "number" && v > 0)
            .map(([k, v]) => (
              <span key={k} className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                APPLICATION_STATUS_COLORS[k as ApplicationStatus] ?? "bg-elevated text-muted"
              )}>
                {APPLICATION_STATUS_LABELS[k as ApplicationStatus] ?? k}: {v}
              </span>
            ))}
        </div>
      )}

      <div className="mt-6">
        {isLoading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : items.length === 0 ? (
          <div className="grid place-items-center gap-3 py-20 text-center">
            <Users className="h-8 w-8 text-faint" />
            <p className="text-sm text-muted">No applicants yet.</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              {items.map((app, i) => {
                const c = app.candidate;
                const p = c?.candidate_profile;
                return (
                  <button key={app.id} onClick={() => setSelected(app)}
                    className={cn("flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-elevated", i > 0 && "border-t border-line")}>
                    <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-elevated">
                      {p?.profile_image_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img loading="lazy" src={imgUrl(p.profile_image_url) ?? ""} alt="" className="h-full w-full object-cover rounded-full" />
                        : <Building2 className="h-5 w-5 text-faint" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{c?.name ?? `Applicant #${app.id}`}</p>
                      <p className="truncate text-xs text-muted">{p?.headline ?? c?.email}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {app.cv_score !== undefined && (
                        <span className="readout rounded-lg bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand">
                          CV {app.cv_score}
                        </span>
                      )}
                      {app.final_score !== undefined && (
                        <span className="readout rounded-lg bg-amber/12 px-2.5 py-1 text-xs font-bold text-amber">
                          AI {app.final_score}
                        </span>
                      )}
                      {app.status && (
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium hidden sm:inline-flex", APPLICATION_STATUS_COLORS[app.status])}>
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
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                  className="rounded-xl border border-line2 bg-surface px-4 py-2 text-sm disabled:opacity-40">
                  Prev
                </button>
                <span className="readout text-sm text-muted">{page} / {lastPage}</span>
                <button disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl border border-line2 bg-surface px-4 py-2 text-sm disabled:opacity-40">
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