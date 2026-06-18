import { api } from "../client";
import type { Paginated } from "../types";
import type { WorkType, WorkModel, ExperienceLevel } from "@/lib/constants/enums";

export interface JobCompany {
  id: number;
  name: string;
  logo_url?: string | null;
  industry?: string;
}

export interface Job {
  id: number;
  title: string;
  description?: string;
  target_role?: string;
  location?: string;
  work_type?: WorkType;
  work_model?: WorkModel;
  experience_level?: ExperienceLevel;
  salary_range?: string;
  is_active?: boolean;
  expires_at?: string | null;
  created_at?: string;
  requirements?: string[];
  skills?: string[];
  category_id?: number;
  company?: JobCompany;
}

export interface Category {
  id: number;
  name: string;
}

function qs(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "" && v !== null) sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const jobsApi = {
  list: (params: Record<string, string | number | undefined>) =>
    api.get<Paginated<Job> | Job[]>(`/jobs${qs(params)}`),
  get: (id: number) => api.get<{ job?: Job } | Job>(`/jobs/${id}`),
  categories: () => api.get<Category[]>("/categories"),
  byCompany: (companyId: number) =>
    api.get<Paginated<Job> | Job[]>(`/companies/${companyId}/jobs`),
};

/** Normalize a list response that may be a Laravel paginator or a bare array. */
export function normalizeJobs(res: Paginated<Job> | Job[] | undefined): {
  items: Job[];
  page: number;
  lastPage: number;
  total: number;
} {
  if (!res) return { items: [], page: 1, lastPage: 1, total: 0 };
  if (Array.isArray(res)) {
    return { items: res, page: 1, lastPage: 1, total: res.length };
  }
  return {
    items: res.data ?? [],
    page: res.current_page ?? 1,
    lastPage: res.last_page ?? 1,
    total: res.total ?? res.data?.length ?? 0,
  };
}

export function normalizeJob(res: { job?: Job } | Job | undefined): Job | null {
  if (!res) return null;
  if ("id" in res && typeof res.id === "number") return res as Job;
  return (res as { job?: Job }).job ?? null;
}
