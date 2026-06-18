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
  savedJobs: () =>
    api.get<unknown>("/candidate/saved-jobs").then((r) => {
      // SavedJobController returns { saved_jobs: Paginated<SavedJob> }
      if (r && typeof r === "object" && "saved_jobs" in (r as object)) {
        const v = (r as Record<string, unknown>).saved_jobs;
        if (Array.isArray(v)) return v as Job[];
        return ((v as { data?: Job[] })?.data ?? []) as Job[];
      }
      if (Array.isArray(r)) return r as Job[];
      return ((r as { data?: Job[] })?.data ?? []) as Job[];
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
