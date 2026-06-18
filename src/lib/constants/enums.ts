/**
 * The ONLY place enums live. Backend validation rules win over the docs.
 * Reconcile against routes/api.php + Form Requests if anything drifts.
 */

export const WORK_TYPE = [
  "full_time",
  "part_time",
  "contract",
  "freelance",
  "internship",
] as const;
export type WorkType = (typeof WORK_TYPE)[number];

/** Expanded 12-value list from the real backend (docs only list 5). */
export const EXPERIENCE_LEVEL = [
  "intern",
  "entry",
  "junior",
  "mid",
  "senior",
  "lead",
  "staff",
  "principal",
  "manager",
  "director",
  "vp",
  "executive",
] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVEL)[number];

export const WORK_MODEL = ["onsite", "remote", "hybrid"] as const;
export type WorkModel = (typeof WORK_MODEL)[number];

export const APPLICATION_STATUS = [
  "pending",
  "reviewed",
  "shortlisted",
  "interview_invited",
  "interview_completed",
  "final_invited",
  "hired",
  "rejected",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUS)[number];

export const REACTION_TYPE = [
  "like",
  "love",
  "celebrate",
  "support",
  "funny",
] as const;
export type ReactionType = (typeof REACTION_TYPE)[number];

export const POST_VISIBILITY = ["public", "connections", "private"] as const;
export type PostVisibility = (typeof POST_VISIBILITY)[number];

export const USER_ROLE = ["candidate", "company", "admin"] as const;
export type UserRole = (typeof USER_ROLE)[number];

export const LANGUAGE = ["en", "ar"] as const;
export type Language = (typeof LANGUAGE)[number];
