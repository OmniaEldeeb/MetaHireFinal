"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2, Briefcase, FilePlus, Wand2, Pencil,
  Trash2, ToggleLeft, ToggleRight, Users,
} from "lucide-react";
import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { companyJobsApi } from "@/lib/api/endpoints/company-jobs";
import { useToastStore } from "@/stores/toast.store";
import {
  WORK_TYPE_LABELS, WORK_MODEL_LABELS, EXPERIENCE_LEVEL_LABELS,
} from "@/lib/constants/labels";
import type { WorkType, WorkModel, ExperienceLevel } from "@/lib/constants/enums";
import type { Job } from "@/lib/api/endpoints/jobs";

export function CompanyJobsList() {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["company-jobs"],
    queryFn: companyJobsApi.listJobs,
  });
  const [toggling, setToggling] = useState<number | null>(null);

  const toggle = async (job: Job) => {
    setToggling(job.id);
    try {
      await companyJobsApi.toggleJob(job.id);
      qc.invalidateQueries({ queryKey: ["company-jobs"] });
      toast({ kind: "success", title: `Job ${job.is_active ? "paused" : "activated"}` });
    } catch {
      toast({ kind: "error", title: "Toggle failed" });
    } finally {
      setToggling(null);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this job? This cannot be undone.")) return;
    try {
      await companyJobsApi.deleteJob(id);
      qc.invalidateQueries({ queryKey: ["company-jobs"] });
      toast({ kind: "success", title: "Job deleted" });
    } catch {
      toast({ kind: "error", title: "Delete failed" });
    }
  };

  return (
    <Container className="py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Jobs</h1>
          <p className="mt-1 text-sm text-muted">Manage your active and paused postings.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" href="/company/jobs/chatbot">
            <Wand2 className="h-4 w-4" /> AI chatbot
          </Button>
          <Button size="sm" href="/company/jobs/new">
            <FilePlus className="h-4 w-4" /> Post a job
          </Button>
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : !jobs?.length ? (
          <div className="grid place-items-center gap-3 rounded-2xl border border-line bg-surface py-20 text-center">
            <Briefcase className="h-8 w-8 text-faint" />
            <p className="text-sm text-muted">No jobs yet.</p>
            <Button href="/company/jobs/new" size="sm">
              <FilePlus className="h-4 w-4" /> Post your first role
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const badges = [
                job.work_type ? WORK_TYPE_LABELS[job.work_type as WorkType] : null,
                job.work_model ? WORK_MODEL_LABELS[job.work_model as WorkModel] : null,
                job.experience_level ? EXPERIENCE_LEVEL_LABELS[job.experience_level as ExperienceLevel] : null,
              ].filter(Boolean) as string[];

              return (
                <div key={job.id} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 transition-all hover:shadow-soft">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/company/jobs/${job.id}`} className="font-display text-base font-bold tracking-tight hover:text-brand">
                        {job.title}
                      </Link>
                      <span className={cn(
                        "readout rounded-full px-2.5 py-0.5 text-[0.65rem] uppercase tracking-wider",
                        job.is_active ? "bg-green/12 text-green" : "bg-elevated text-faint"
                      )}>
                        {job.is_active ? "Active" : "Paused"}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {badges.map((b) => (
                        <span key={b} className="rounded-lg bg-elevated px-2 py-0.5 text-xs text-muted">{b}</span>
                      ))}
                      {job.location ? <span className="text-xs text-faint">· {job.location}</span> : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link href={`/company/jobs/${job.id}/applicants`}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-line text-faint hover:border-brand hover:text-brand"
                      title="View applicants">
                      <Users className="h-4 w-4" />
                    </Link>
                    <Link href={`/company/jobs/${job.id}/edit`}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-line text-faint hover:border-brand hover:text-brand"
                      title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => toggle(job)}
                      disabled={toggling === job.id}
                      title={job.is_active ? "Pause" : "Activate"}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-line text-faint hover:border-brand hover:text-brand disabled:opacity-40"
                    >
                      {toggling === job.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : job.is_active
                        ? <ToggleRight className="h-4 w-4 text-green" />
                        : <ToggleLeft className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => remove(job.id)}
                      title="Delete"
                      className="grid h-9 w-9 place-items-center rounded-xl border border-line text-faint hover:border-coral hover:text-coral"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Container>
  );
}
