import { api } from "../client";
import type { Paginated } from "../types";
import type { ApplicationStatus } from "@/lib/constants/enums";
import type { Job } from "./jobs";

// FinalInterviewSchedule fields from FinalInterviewSchedule model
export interface FinalSchedule {
  id?: number;
  window_start?: string | null;
  window_end?: string | null;
  scheduled_at?: string | null;
  duration_minutes?: number | null;
  format?: string | null;
  location?: string | null;
  meeting_link?: string | null;
  contact_person?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  dress_code?: string | null;
  notes?: string | null;
  interview_format_detail?: string | null;
  rounds?: number | null;
  confirmed_by_candidate?: boolean;
  confirmed_at?: string | null;
}

export interface Application {
  id: number;
  status?: ApplicationStatus;
  cover_letter?: string;
  created_at?: string;
  updated_at?: string;
  cv_id?: number;
  job?: Job;
  interview_status?: string | null;
  final_schedule?: FinalSchedule | null;
}

export const candidateApplicationsApi = {
  list: (page = 1) =>
    api.get<Paginated<Application> | Application[]>(
      `/candidate/applications?page=${page}`,
    ),
  get: (id: number) =>
    api.get<{ application?: Application } | Application>(
      `/candidate/applications/${id}`,
    ),
  apply: (jobId: number, body: { cv_id: number; cover_letter?: string }) =>
    api.post<Application>(`/jobs/${jobId}/apply`, body),
  saveJob: (jobId: number) =>
    api.post<{ saved: boolean }>(`/jobs/${jobId}/save`),
  // Fetch ALL saved job IDs across all pages for accurate saved-state checking.
  // Fetches page by page until last_page is reached, extracts only IDs.
  // Results cached in React Query (staleTime 5min) AND in sessionStorage so
  // page refresh doesn't require re-fetching.
  savedJobIds: async (): Promise<number[]> => {
    // Try sessionStorage first for instant load after refresh
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("saved_job_ids");
      if (cached) {
        try { return JSON.parse(cached) as number[]; } catch { /* ignore */ }
      }
    }

    // Fetch all pages
    const allIds: number[] = [];
    let page = 1;
    let lastPage = 1;

    do {
      const r = await api.get<unknown>(`/candidate/saved-jobs?per_page=100&page=${page}`);
      const obj = (r ?? {}) as Record<string, unknown>;
      const savedObj = (obj.saved_jobs ?? r) as Record<string, unknown>;
      const rows: unknown[] = Array.isArray(savedObj)
        ? savedObj
        : ((savedObj as { data?: unknown[] })?.data ?? []);

      for (const item of rows) {
        const it = item as Record<string, unknown>;
        const jobId = Number(
          (it.job as Record<string, unknown>)?.id ?? it.job_id ?? it.id ?? 0
        );
        if (jobId) allIds.push(jobId);
      }

      lastPage = Number((savedObj as { last_page?: number }).last_page ?? 1);
      page++;
    } while (page <= lastPage);

    // Persist to sessionStorage so page refresh is instant
    if (typeof window !== "undefined") {
      sessionStorage.setItem("saved_job_ids", JSON.stringify(allIds));
    }

    return allIds;
  },

  savedJobs: () =>
    api.get<unknown>("/candidate/saved-jobs").then((r) => {
      // SavedJobController returns { saved_jobs: Paginated<{ id, job_id, job: JobResource, created_at }> }
      // Each item is a SavedJob record; the actual job is in item.job
      const obj = (r ?? {}) as Record<string, unknown>;
      const savedObj = obj.saved_jobs ?? r;
      const rows: unknown[] = Array.isArray(savedObj)
        ? savedObj
        : ((savedObj as { data?: unknown[] })?.data ?? []);
      // Extract the nested .job from each SavedJob record
      return rows
        .map((item) => {
          const it = item as Record<string, unknown>;
          // If item already looks like a Job (has title), return as-is
          if (it.title) return it as unknown as Job;
          // Otherwise extract the nested .job property
          return (it.job ?? it) as unknown as Job;
        })
        .filter((j) => j && (j as Job).id) as Job[];
    }),
  finalSchedule: (appId: number) =>
    api.get<unknown>(`/candidate/applications/${appId}/final-schedule`),
  confirmSchedule: (appId: number, scheduled_at: string) =>
    api.post<unknown>(
      `/candidate/applications/${appId}/final-schedule/confirm`,
      { scheduled_at },
    ),
};

export function normalizeApplications(
  res: Paginated<Application> | Application[] | undefined,
): { items: Application[]; page: number; lastPage: number; total: number } {
  if (!res) return { items: [], page: 1, lastPage: 1, total: 0 };
  if (Array.isArray(res))
    return { items: res, page: 1, lastPage: 1, total: res.length };
  return {
    items: res.data ?? [],
    page: res.current_page ?? 1,
    lastPage: res.last_page ?? 1,
    total: res.total ?? res.data?.length ?? 0,
  };
}