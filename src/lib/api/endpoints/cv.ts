import { api } from "../client";
import type { Paginated } from "../types";

export type CvType = "uploaded" | "built" | "rebuilt";

export interface Cv {
  id: number;
  user_id?: number;
  version?: number;
  type?: CvType;
  name?: string;
  original_filename?: string;
  language?: string;
  created_at?: string;
  is_favorite?: boolean;
}

export interface CvTemplate {
  id: string;
  name: string;
  preview_url?: string;
}

// Matches real controller response shape from CvAiService.report()
// Controller returns: { score: CvScoreData, analysis: CvAnalysisData, recommendation: CvRecommendationData }
// We flatten into a single CvReport object for the modal

// ── Confirmed from actual API response (POST /cv/{id}/report) ─────────────────

export interface CvScoreBreakdown {
  skills_match?: number;
  experience_relevance?: number;
  education_fit?: number;
  projects?: number;
  ats_readability?: number;
  achievements?: number;
}

export interface CvExperienceAnalysis {
  required_level?: string;
  detected_level?: string;
  years_required?: number;
  years_detected?: number;
}

export interface CvEducationAnalysis {
  required?: string;
  detected?: string;
  match_level?: string;
}

export interface CvProjectsAnalysis {
  relevant_projects?: string[];
  missing_project_types?: string[];
}

export interface CvScoreData {
  // Present in with_job mode, null in general mode
  score?: number | null;
  score_breakdown?: CvScoreBreakdown | null;
  matched_skills?: string[];
  missing_skills?: string[];
  experience_analysis?: CvExperienceAnalysis | null;
  education_analysis?: CvEducationAnalysis | null;
  projects_analysis?: CvProjectsAnalysis | null;
  ats_keywords_missing?: string[];
  strengths?: string[];
  weaknesses?: string[];
  quick_recommendations?: string[];
  hire_decision_hint?: string;
  summary?: string | null;
}

export interface CvAnalysisData {
  // with_job mode fields
  job_fit_level?: string;            // 'low'|'fair'|'good'|'excellent'
  fit_summary?: string;
  strengths_for_this_job?: string[];
  critical_gaps?: string[];
  nice_to_have_gaps?: string[];
  experience_match?: string;
  education_match?: string;
  interview_focus_areas?: string[];
  hire_recommendation?: string;      // 'yes'|'no'|'maybe'
  summary?: string;

  // general mode fields (no job description)
  career_level?: string;             // 'junior'|'mid'|'senior'
  strengths?: string[];
  weaknesses?: string[];
  key_skills_detected?: string[];
  career_progression_analysis?: string;
  missing_information?: string[];
}

export interface CvRecommendationData {
  cv_improvements?: string[];
  skill_gaps?: string[];
  career_advice?: string[];
  ats_optimization?: string[];
}

export interface CvReport {
  score?: CvScoreData;
  analysis?: CvAnalysisData;
  recommendation?: CvRecommendationData;
  hasJobDescription?: boolean;       // true when report was generated with a job description
}

// Legacy alias kept for backwards compatibility
export type CvAnalysis = CvReport;

export interface CvComparison {
  cv1?: { id: number; score?: number; strengths?: string[] };
  cv2?: { id: number; score?: number; strengths?: string[] };
  summary?: string;
}

export interface CvHistory {
  versions?: { version: number; created_at: string; type: CvType }[];
}

function listOrPaginated<T>(res: Paginated<T> | T[]): T[] {
  if (Array.isArray(res)) return res;
  return res.data ?? [];
}

export const cvApi = {
  list: () => api.get<Paginated<Cv> | Cv[]>("/cv").then(listOrPaginated),
  trash: () => api.get<Paginated<Cv> | Cv[]>("/cv/trash").then(listOrPaginated),
  favorites: () =>
    api.get<Paginated<Cv> | Cv[]>("/cv/favorites").then(listOrPaginated),
  templates: () =>
    api.get<{ data?: CvTemplate[] } | CvTemplate[]>("/cv/templates").then(
      (r) => (Array.isArray(r) ? r : ((r as { data?: CvTemplate[] }).data ?? [])),
    ),

  get: (id: number) => api.get<Cv>(`/cv/${id}`),

  // GET /cv/{id} — full detail: { cv, display, latest_analysis, latest_score }
  show: (id: number) => api.get<{
    cv: Cv;
    display?: Record<string, unknown>;
    latest_analysis?: Record<string, unknown> | null;
    latest_score?: Record<string, unknown> | null;
  }>(`/cv/${id}`),

  // PATCH /cv/{id} — update CV parsed_data (edit CV content)
  update: (id: number, body: { parsed_data?: Record<string, unknown>; name?: string }) =>
    api.patch<Cv>(`/cv/${id}`, body),
  upload: (file: File, useAi = false) => {
    const fd = new FormData();
    fd.append("file", file);
    if (useAi) fd.append("use_ai", "true");
    return api.post<Cv>("/cv/upload", fd);
  },
  uploadPhoto: (file: File) =>
    api.post<{ photo_base64: string }>("/cv/photo", (() => {
      const fd = new FormData();
      fd.append("photo", file);
      return fd;
    })()),
  buildFromProfile: (body: {
    format: "pdf" | "docx";
    template: string;
    job_description?: string;
    photo_base64?: string;
  }) =>
    api.post<Blob>("/cv/build-from-profile", body, { responseType: "blob" }),
  // POST /cv/{id}/build
  // format=html  → JSON { type:"html", template, html:"<!DOCTYPE..." }
  // format=pdf|docx → binary blob
  buildHtml: (id: number, body: { template: string; photo_base64?: string }) =>
    api.post<{ type: string; template: string; html: string }>(
      `/cv/${id}/build`,
      { format: "html", ...body }
    ),
  build: (id: number, body: { format: "pdf" | "docx"; template: string; photo_base64?: string }) =>
    api.post<Blob>(`/cv/${id}/build`, body, { responseType: "blob" }),
  rename: (id: number, name: string) =>
    api.patch<Cv>(`/cv/${id}/rename`, { name }),
  softDelete: (id: number) => api.delete<unknown>(`/cv/${id}`),
  bulkDelete: (ids: number[]) =>
    api.delete<unknown>("/cv", { data: { ids } }),
  restore: (id: number) => api.post<Cv>(`/cv/${id}/restore`),
  rebuild: (id: number) => api.post<Cv>(`/cv/${id}/rebuild`),
  toggleFavorite: (id: number) =>
    api.post<{ is_favorite?: boolean; favorited?: boolean }>(
      `/cv/${id}/favorite`,
    ),
  // POST /cv/{id}/report — optional job_description for job-specific analysis
  // Controller returns: { score: {...}, analysis: {...}, recommendation: {...} }
  report: (id: number, jobDescription?: string) => {
    const body: Record<string, string> = {};
    if (jobDescription?.trim()) body.job_description = jobDescription.trim();
    return api.post<unknown>(`/cv/${id}/report`, body).then((r) => {
      const raw = (r ?? {}) as Record<string, unknown>;
      return {
        score: raw.score as CvScoreData | undefined,
        analysis: raw.analysis as CvAnalysisData | undefined,
        recommendation: raw.recommendation as CvRecommendationData | undefined,
        hasJobDescription: !!jobDescription?.trim(),
      } as CvReport;
    });
  },
  compare: (id: number, otherId: number) =>
    api.get<CvComparison>(`/cv/${id}/compare/${otherId}`),
  history: (id: number) => api.get<CvHistory>(`/cv/${id}/history`),
};

/** Trigger a file download from a Blob. */
export function blobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}