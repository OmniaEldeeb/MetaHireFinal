import { api } from "../client";
import type { Language } from "@/lib/constants/enums";

// ── Session ──────────────────────────────────────────────────────────────────

export interface StartSessionBody {
  target_role: string;
  level: string;
  tech_stack: string[];
  experience_years: number;
  language: Language;
  total_questions: 5 | 10 | 15;
  target_company?: string;
  job_description_text?: string;
  cv_id?: number;
  // For job interviews: interview already created via invitation token
  // Skip POST /interview/start and use this id directly
  interview_id?: number;
}

/**
 * The AI-interview backend (POST /interview/start) only accepts four levels:
 * junior, mid, senior, lead. The app-wide EXPERIENCE_LEVEL list has 12 values
 * (used for jobs/profiles), so any non-interview level must be mapped down to
 * one of the four — otherwise the API rejects it with 422 "level is invalid".
 */
export type InterviewLevel = "junior" | "mid" | "senior" | "lead";

export function normalizeInterviewLevel(level: string | null | undefined): InterviewLevel {
  switch ((level ?? "").toLowerCase()) {
    case "intern":
    case "entry":
    case "junior":
      return "junior";
    case "mid":
    case "mid-level":
      return "mid";
    case "senior":
    case "staff":
    case "principal":
      return "senior";
    case "lead":
    case "manager":
    case "director":
    case "vp":
    case "executive":
      return "lead";
    default:
      return "mid";
  }
}

export interface InterviewSession {
  interview_id: number;
  type: string;
  target_role: string;
  level: string;
  total_questions: number;
  language: Language;
}

// ── Tone (audio chunks) ──────────────────────────────────────────────────────

export interface ToneSession { tone_interview_id: number; status: string }

export interface ToneChunkResult {
  has_speech: boolean;
  emotion: string;
  confidence: number;
  score: number;
  probabilities?: Record<string, number>;
}

export interface ToneFinishResult {
  tone_interview_id: number;
  status: string;
  final_score: number;
  dominant_emotion: string;
  total_chunks: number;
  speech_chunks: number;
}

// ── Face (video frames) ──────────────────────────────────────────────────────

export interface FaceSession { face_interview_id: number; status: string }

export interface FaceChunkResult {
  is_face: boolean;
  emotion: string;
  confidence: number;
  score: number;
  probabilities?: Record<string, number>;
}

export interface FaceFinishResult {
  face_interview_id: number;
  status: string;
  final_score: number;
  dominant_emotion: string;
  total_frames: number;
  face_frames: number;
}

// ── AI Q&A ───────────────────────────────────────────────────────────────────

export interface FirstQuestion {
  greeting?: string;
  question_id: number;
  question_number: number;
  question: string;
  expected_time: number; // minutes
  total_questions: number;
  interview_type?: string;
  target_role?: string;
}

export interface AnswerResult {
  question_number: number;
  transcript?: string;
  answer_score?: number;
  answer_feedback?: string;
  ideal_answer?: string;
  interview_complete: boolean;
  next_question_id?: number;
  next_question_number?: number;
  next_question?: string;
  expected_time?: number;
  total_questions?: number;
  technical_score?: number;
  overall_feedback?: string;
  recommendations?: { topic: string; reason: string; resources?: string[] }[];
}

// ── Report ───────────────────────────────────────────────────────────────────

export interface InterviewReport {
  interview_id?: number;
  type?: string;
  status?: string;
  target_role?: string;
  target_company?: string;
  level?: string;
  tech_stack?: string[];
  experience_years?: number;
  language?: string;
  technical_score?: number;
  communication_score?: number;
  tone_score?: number;
  face_score?: number;
  overall_score?: number;
  overall_feedback?: string;
  total_questions?: number;
  questions_answered?: number;
  started_at?: string;
  finished_at?: string;
  questions?: {
    question: string;
    question_number?: number;
    answer?: string;
    transcript?: string;
    score?: number;
    feedback?: string;
    ideal_answer?: string;
    audio_url?: string;
    expected_time?: number;
  }[];
  recommendations?: { topic: string; reason: string; resources?: string[] }[];
}

export interface PastInterview {
  id: number;
  type?: string;
  target_role?: string;
  target_company?: string;
  level?: string;
  status?: string;
  technical_score?: number;
  final_score?: number;
  communication_score?: number;
  s_tone?: number;
  s_face?: number;
  started_at?: string;    // InterviewResource has started_at (not created_at)
  finished_at?: string;
  language?: string;
  total_questions?: number;
  tech_stack?: string[];
}

// ── Invitation token ─────────────────────────────────────────────────────────

export interface InvitationDetail {
  // Confirmed from ApplicationController::resolveInvitation() response
  interview_id: number;
  job_title: string;
  company_name: string;
  target_role: string;
  level: string;
  tech_stack: string[];
  total_questions: number;
  language: string;
  expires_at: string;
  started_at: string;
}

// ── API calls ────────────────────────────────────────────────────────────────

function audioForm(audio: Blob, extra?: Record<string, string>) {
  const fd = new FormData();
  fd.append("audio", audio, "answer.webm");
  if (extra) for (const [k, v] of Object.entries(extra)) fd.append(k, v);
  return fd;
}

function imageForm(image: Blob, chunkIndex: number) {
  const fd = new FormData();
  fd.append("file", image, "frame.jpg");
  fd.append("chunk_index", String(chunkIndex));
  return fd;
}

function audioChunkForm(chunk: Blob, chunkIndex: number) {
  const fd = new FormData();
  fd.append("file", chunk, `chunk-${chunkIndex}.webm`);
  fd.append("chunk_index", String(chunkIndex));
  return fd;
}

// ── Response normalizers ──────────────────────────────────────────────────────
// The backend is not perfectly consistent in how it names question fields
// (e.g. `/ai-interview/{id}/start` returns `question_text` per the API docs,
// while the answer endpoint returns `next_question`). These helpers map every
// known variant onto our internal shape so the UI/TTS always have the text.

type Raw = Record<string, unknown>;

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? (n as number) : fallback;
}

/** First defined/finite numeric value among candidates, else undefined. */
function numOpt(...vals: unknown[]): number | undefined {
  for (const v of vals) {
    if (v === undefined || v === null) continue;
    const n = typeof v === "string" ? Number(v) : (v as number);
    if (Number.isFinite(n)) return n as number;
  }
  return undefined;
}

function str(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

function normalizeFirstQuestion(raw: unknown): FirstQuestion {
  const r = (raw ?? {}) as Raw;
  return {
    greeting: str(r.greeting),
    question_id: num(r.question_id),
    question_number: num(r.question_number, 1),
    question: str(r.question, r.question_text) ?? "",
    expected_time: num(r.expected_time, 2),
    total_questions: num(r.total_questions, 0),
    interview_type: str(r.interview_type, r.type),
    target_role: str(r.target_role),
  };
}

function normalizeAnswer(raw: unknown): AnswerResult {
  const r = (raw ?? {}) as Raw;
  return {
    ...(r as unknown as AnswerResult),
    question_number: num(r.question_number),
    transcript: str(r.transcript),
    answer_score: r.answer_score === undefined ? undefined : num(r.answer_score),
    answer_feedback: str(r.answer_feedback, r.feedback),
    ideal_answer: str(r.ideal_answer),
    interview_complete: Boolean(r.interview_complete),
    next_question_id:
      r.next_question_id === undefined ? undefined : num(r.next_question_id),
    next_question_number:
      r.next_question_number === undefined
        ? undefined
        : num(r.next_question_number),
    next_question: str(r.next_question, r.next_question_text),
    expected_time:
      r.expected_time === undefined ? undefined : num(r.expected_time),
    total_questions:
      r.total_questions === undefined ? undefined : num(r.total_questions),
    technical_score:
      r.technical_score === undefined ? undefined : num(r.technical_score),
    overall_feedback: str(r.overall_feedback, r.summary),
  };
}

function normalizeReport(raw: unknown): InterviewReport {
  const r = (raw ?? {}) as Raw;

  const questions = Array.isArray(r.questions)
    ? (r.questions as Raw[]).map((q) => ({
        question: str(q.question, q.question_text) ?? "",
        question_number:
          q.question_number === undefined ? undefined : num(q.question_number),
        // The candidate's spoken answer (transcript) — keep both names usable.
        answer: str(q.answer, q.transcript),
        transcript: str(q.transcript, q.answer),
        // Backend names the per-answer score `answer_score`.
        score: numOpt(q.score, q.answer_score),
        feedback: str(q.feedback, q.answer_feedback),
        ideal_answer: str(q.ideal_answer),
        audio_url: str(q.audio_url),
        expected_time:
          q.expected_time === undefined ? undefined : num(q.expected_time),
      }))
    : undefined;

  return {
    interview_id: numOpt(r.interview_id),
    type: str(r.type, r.interview_type),
    status: str(r.status),
    target_role: str(r.target_role),
    target_company: str(r.target_company),
    level: str(r.level),
    tech_stack: Array.isArray(r.tech_stack)
      ? (r.tech_stack as string[])
      : undefined,
    experience_years: numOpt(r.experience_years),
    language: str(r.language),
    // Technical / answers score.
    technical_score: numOpt(r.technical_score),
    communication_score: numOpt(r.communication_score),
    // Tone (`s_tone`) and face (`s_face`) scores from the analysis services.
    tone_score: numOpt(r.tone_score, r.s_tone),
    face_score: numOpt(r.face_score, r.s_face),
    // Overall / composite score.
    overall_score: numOpt(r.overall_score, r.final_score),
    // Free-text feedback (`ai_feedback` on the record, `summary` on the report).
    overall_feedback: str(r.overall_feedback, r.ai_feedback, r.summary),
    total_questions: numOpt(r.total_questions),
    questions_answered: numOpt(r.questions_answered),
    started_at: str(r.started_at),
    finished_at: str(r.finished_at),
    questions,
    recommendations: Array.isArray(r.recommendations)
      ? (r.recommendations as InterviewReport["recommendations"])
      : undefined,
  };
}

export const interviewApi = {
  // Session
  start: (body: StartSessionBody) =>
    api.post<InterviewSession>("/interview/start", {
      ...body,
      level: normalizeInterviewLevel(body.level),
    }),
  finish: (id: number) =>
    api.post<unknown>(`/interview/${id}/finish`),
  linkTone: (id: number, tone_interview_id: number) =>
    api.post<unknown>(`/interview/${id}/link-tone`, { tone_interview_id }),
  linkFace: (id: number, face_interview_id: number) =>
    api.post<unknown>(`/interview/${id}/link-face`, { face_interview_id }),
  get: (id: number) =>
    api.get<unknown>(`/interview/${id}`),
  history: () =>
    api.get<unknown>("/interviews").then((r) => {
      if (!r || typeof r !== "object") return [] as PastInterview[];
      const obj = r as Record<string, unknown>;
      // PracticeInterviewController::index returns { interviews: [...] }
      if ("interviews" in obj) {
        const v = obj.interviews;
        return (Array.isArray(v) ? v : (v as { data?: PastInterview[] })?.data ?? []) as PastInterview[];
      }
      if (Array.isArray(r)) return r as PastInterview[];
      return ((r as { data?: PastInterview[] }).data ?? []) as PastInterview[];
    }),
  resolveInvitation: (token: string) =>
    api.get<InvitationDetail>(`/interview/invitation/${token}`),

  // Tone
  toneStart: () =>
    api.post<ToneSession>("/tone-interview/start"),
  toneChunk: (id: number, chunk: Blob, chunkIndex: number) =>
    api.post<ToneChunkResult>(
      `/tone-interview/${id}/chunk`,
      audioChunkForm(chunk, chunkIndex),
    ),
  toneFinish: (id: number) =>
    api.post<ToneFinishResult>(`/tone-interview/${id}/finish`),

  // Face
  faceStart: () =>
    api.post<FaceSession>("/face-interview/start"),
  faceChunk: (id: number, image: Blob, chunkIndex: number) =>
    api.post<FaceChunkResult>(
      `/face-interview/${id}/chunk`,
      imageForm(image, chunkIndex),
    ),
  faceFinish: (id: number) =>
    api.post<FaceFinishResult>(`/face-interview/${id}/finish`),

  // AI Q&A
  aiStart: (interviewId: number) =>
    api
      .post<unknown>(`/ai-interview/${interviewId}/start`)
      .then(normalizeFirstQuestion),
  answer: (interviewId: number, questionId: number, audio: Blob) =>
    api
      .post<unknown>(
        `/ai-interview/${interviewId}/answer/${questionId}`,
        audioForm(audio),
      )
      .then(normalizeAnswer),

  // Report — the full per-interview record (`/interview/{id}`) carries the
  // authoritative scores (s_tone, s_face, technical/final) and per-question
  // data; the AI report endpoint may add a summary/recommendations. Fetch both,
  // merge (record wins for scores), and normalize to the UI shape.
  report: async (interviewId: number) => {
    const [detail, aiReport] = await Promise.allSettled([
      api.get<unknown>(`/interview/${interviewId}`),
      api.get<unknown>(`/ai-interview/${interviewId}/report`),
    ]);

    const detailData =
      detail.status === "fulfilled" ? (detail.value as Raw) : {};
    const reportData =
      aiReport.status === "fulfilled" ? (aiReport.value as Raw) : {};

    // If neither call succeeded, surface the detail error to the caller.
    if (detail.status === "rejected" && aiReport.status === "rejected") {
      throw detail.reason;
    }

    return normalizeReport({ ...reportData, ...detailData });
  },
};