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
  // Lightweight: fetch saved job IDs only — used to check saved state on job detail page
  // Much faster than savedJobs() because we only need the ID from each SavedJob record
  savedJobIds: () =>
    api.get<unknown>("/candidate/saved-jobs?per_page=100").then((r) => {
      const obj = (r ?? {}) as Record<string, unknown>;
      const savedObj = obj.saved_jobs ?? r;
      const rows: unknown[] = Array.isArray(savedObj)
        ? savedObj
        : ((savedObj as { data?: unknown[] })?.data ?? []);
      return rows.map((item) => {
        const it = item as Record<string, unknown>;
        // Extract job_id from SavedJob record or id from Job record
        return Number((it.job as Record<string, unknown>)?.id ?? it.job_id ?? it.id ?? 0);
      }).filter(Boolean) as number[];
    }),

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