"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase, Users, CheckCircle2, TrendingUp,
  ArrowRight, FilePlus, Loader2, ToggleLeft,
} from "lucide-react";
import { Container } from "@/components/ui/section";
import { StatCardSkeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth.store";
import { companyJobsApi } from "@/lib/api/endpoints/company-jobs";
import type { DashboardStats } from "@/lib/api/endpoints/company-jobs";

function norm(res: { data?: DashboardStats } | DashboardStats | undefined): DashboardStats {
  if (!res) return {};
  if ("data" in (res as object) && (res as { data?: DashboardStats }).data) {
    return (res as { data?: DashboardStats }).data!;
  }
  return res as DashboardStats;
}

function StatCard({ icon: Icon, label, value, color, href }: {
  icon: typeof Briefcase; label: string; value?: number | string; color: string; href?: string;
}) {
  const body = (
    <div className={`flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 ${href ? "transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-soft" : ""}`}>
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="readout text-2xl font-bold text-ink">
          {value ?? <span className="text-faint">—</span>}
        </p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : <div>{body}</div>;
}

export function CompanyDashboard() {
  const user = useAuthStore((s) => s.user);
  const dashQ = useQuery({ queryKey: ["company-dashboard"], queryFn: companyJobsApi.dashboard, staleTime: 30_000 });
  const jobsQ = useQuery({ queryKey: ["company-jobs"], queryFn: companyJobsApi.listJobs, staleTime: 30_000 });
  const stats = norm(dashQ.data);
  const jobs = jobsQ.data ?? [];
  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <Container className="py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            Hey, {firstName} 👋
          </h1>
          <p className="mt-1 text-muted">Here's what's happening across your roles.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/company/jobs/new" className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-strong">
            <FilePlus className="h-4 w-4" /> Post a job
          </Link>
        </div>
      </div>

      {/* Stats */}
      {dashQ.isLoading ? (
        <div className="mt-8 grid place-items-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-brand" />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Briefcase} label="Active jobs" value={stats.active_jobs ?? jobs.filter(j => j.is_active).length} color="bg-brand-soft text-brand" href="/company/jobs" />
          <StatCard icon={Users} label="Total applicants" value={stats.total_applications} color="bg-amber/12 text-amber" href="/company/applications" />
          <StatCard icon={TrendingUp} label="Pending review" value={stats.pending_review ?? stats.pending_applications} color="bg-coral/12 text-coral" />
          <StatCard icon={CheckCircle2} label="Hired" value={stats.hired} color="bg-green/12 text-green" />
        </div>
      )}

      {/* Active jobs list */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold tracking-tight">Your jobs</h2>
          <Link href="/company/jobs" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {jobsQ.isLoading ? (
          <div className="mt-4 grid place-items-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-brand" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="mt-4 grid place-items-center gap-3 rounded-2xl border border-line bg-surface py-14 text-center">
            <Briefcase className="h-8 w-8 text-faint" />
            <p className="text-sm text-muted">No jobs yet.</p>
            <Link href="/company/jobs/new" className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-elevated px-4 py-2 text-sm font-medium hover:border-brand">
              <FilePlus className="h-4 w-4" /> Post your first role
            </Link>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
            {jobs.slice(0, 6).map((job, i) => (
              <Link key={job.id} href={`/company/jobs/${job.id}`}
                className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-elevated ${i > 0 ? "border-t border-line" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{job.title}</p>
                  <p className="text-xs text-muted">{job.location ?? "No location"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`readout rounded-full px-2.5 py-0.5 text-[0.65rem] uppercase tracking-wider ${job.is_active ? "bg-green/12 text-green" : "bg-elevated text-faint"}`}>
                    {job.is_active ? "Active" : "Paused"}
                  </span>
                  <ToggleLeft className="h-4 w-4 text-faint" />
                  <ChevronRight className="h-4 w-4 text-faint" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
