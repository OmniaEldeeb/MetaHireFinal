"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  X, Loader2, TrendingUp, AlertCircle, Lightbulb,
  CheckCircle2, XCircle, Target, Zap, Award, ChevronRight,
  Briefcase,
} from "lucide-react";
import { cvApi } from "@/lib/api/endpoints/cv";
import type { CvReport } from "@/lib/api/endpoints/cv";

// ── Helpers ────────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-green" :
    score >= 60 ? "text-amber" :
    "text-coral";
  const bgColor =
    score >= 80 ? "bg-green/10" :
    score >= 60 ? "bg-amber/10" :
    "bg-coral/10";
  const label =
    score >= 85 ? "Excellent" :
    score >= 70 ? "Good" :
    score >= 50 ? "Average" :
    "Needs Improvement";

  return (
    <div className={`rounded-2xl ${bgColor} p-5 flex items-center gap-5`}>
      <div className="relative grid h-20 w-20 shrink-0 place-items-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor"
            className="text-line2" strokeWidth="8" />
          <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor"
            className={color} strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - score / 100)}`}
            strokeLinecap="round" />
        </svg>
        <span className={`readout text-xl font-bold ${color}`}>{score}</span>
      </div>
      <div>
        <p className="readout text-xs uppercase tracking-wider text-faint">ATS score</p>
        <p className={`mt-0.5 text-lg font-bold ${color}`}>{label}</p>
        <div className="mt-2 h-1.5 w-32 overflow-hidden rounded-full bg-line2">
          <div className={`h-full rounded-full ${score >= 80 ? "bg-green" : score >= 60 ? "bg-amber" : "bg-coral"}`}
            style={{ width: `${score}%` }} />
        </div>
      </div>
    </div>
  );
}

function FitBadge({ level }: { level: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    excellent: { label: "Excellent fit", cls: "bg-green/10 text-green" },
    good:      { label: "Good fit",      cls: "bg-brand/10 text-brand" },
    fair:      { label: "Fair fit",      cls: "bg-amber/10 text-amber" },
    poor:      { label: "Poor fit",      cls: "bg-coral/10 text-coral" },
  };
  const { label, cls } = map[level.toLowerCase()] ?? { label: level, cls: "bg-elevated text-muted" };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function Section({ icon: Icon, title, color, items }: {
  icon: typeof TrendingUp;
  title: string;
  color: string;
  items: string[];
}) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className={`flex items-center gap-2 text-sm font-semibold ${color}`}>
        <Icon className="h-4 w-4" /> {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {items.map((s, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-muted">
            <ChevronRight className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${color}`} />
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SkillTags({ label, skills, variant }: {
  label: string;
  skills: string[];
  variant: "match" | "missing";
}) {
  if (!skills?.length) return null;
  const isMatch = variant === "match";
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-faint">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((s) => (
          <span key={s} className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium
            ${isMatch ? "bg-green/10 text-green" : "bg-coral/10 text-coral"}`}>
            {isMatch
              ? <CheckCircle2 className="h-3 w-3" />
              : <XCircle className="h-3 w-3" />}
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Report content — WITH job description ──────────────────────────────────────

function ReportWithJob({ data }: { data: CvReport }) {
  const sc = data.score;
  const an = data.analysis;
  const re = data.recommendation;

  return (
    <div className="space-y-6">
      {/* Score */}
      {sc?.score !== undefined && <ScoreRing score={sc.score} />}

      {/* Job fit level */}
      {an?.job_fit_level && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink">Job fit</span>
          <FitBadge level={an.job_fit_level} />
        </div>
      )}

      {/* Fit summary */}
      {an?.fit_summary && (
        <p className="rounded-xl border border-line bg-elevated px-4 py-3 text-sm text-muted">
          {an.fit_summary}
        </p>
      )}

      {/* Matched / missing skills */}
      {(sc?.matched_skills?.length || sc?.missing_skills?.length) && (
        <div className="space-y-4">
          <SkillTags label="Matched skills" skills={sc?.matched_skills ?? []} variant="match" />
          <SkillTags label="Missing skills" skills={sc?.missing_skills ?? []} variant="missing" />
        </div>
      )}

      {/* Strengths for this job */}
      <Section
        icon={TrendingUp} color="text-green" title="Strengths for this role"
        items={an?.strengths_for_this_job ?? sc?.strengths ?? []} />

      {/* Critical gaps */}
      <Section
        icon={AlertCircle} color="text-coral" title="Critical gaps"
        items={an?.critical_gaps ?? []} />

      {/* Nice to have */}
      <Section
        icon={Target} color="text-amber" title="Nice-to-have gaps"
        items={an?.nice_to_have_gaps ?? []} />

      {/* Interview focus */}
      <Section
        icon={Briefcase} color="text-brand" title="Interview focus areas"
        items={an?.interview_focus_areas ?? []} />

      {/* CV improvements */}
      <Section
        icon={Lightbulb} color="text-amber" title="CV improvements"
        items={re?.cv_improvements ?? sc?.quick_recommendations ?? []} />

      {/* ATS keywords missing */}
      {sc?.ats_keywords_missing?.length ? (
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-coral">
            <Zap className="h-4 w-4" /> ATS keywords to add
          </h3>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sc.ats_keywords_missing.map((k) => (
              <span key={k} className="rounded-lg bg-coral/10 px-2.5 py-1 text-xs font-medium text-coral">
                {k}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Career advice */}
      <Section
        icon={Award} color="text-brand" title="Career advice"
        items={re?.career_advice ?? []} />

      {/* Summary */}
      {(an?.summary ?? sc?.summary) && (
        <p className="border-t border-line pt-4 text-xs text-faint">
          {an?.summary ?? sc?.summary}
        </p>
      )}
    </div>
  );
}

// ── Report content — WITHOUT job description ───────────────────────────────────

function ReportNoJob({ data }: { data: CvReport }) {
  const sc = data.score;
  const re = data.recommendation;

  return (
    <div className="space-y-6">
      {/* Score */}
      {sc?.score !== undefined && <ScoreRing score={sc.score} />}

      {/* General summary */}
      {sc?.summary && (
        <p className="rounded-xl border border-line bg-elevated px-4 py-3 text-sm text-muted">
          {sc.summary}
        </p>
      )}

      {/* Skills snapshot */}
      {(sc?.matched_skills?.length || sc?.missing_skills?.length) && (
        <div className="space-y-4">
          <SkillTags label="Skills found" skills={sc?.matched_skills ?? []} variant="match" />
          <SkillTags label="Skills to add" skills={sc?.missing_skills ?? []} variant="missing" />
        </div>
      )}

      {/* Strengths */}
      <Section
        icon={TrendingUp} color="text-green" title="Strengths"
        items={sc?.strengths ?? []} />

      {/* Weaknesses */}
      <Section
        icon={AlertCircle} color="text-coral" title="Areas to improve"
        items={sc?.weaknesses ?? []} />

      {/* ATS keywords */}
      {sc?.ats_keywords_missing?.length ? (
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-coral">
            <Zap className="h-4 w-4" /> ATS keywords missing
          </h3>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sc.ats_keywords_missing.map((k) => (
              <span key={k} className="rounded-lg bg-coral/10 px-2.5 py-1 text-xs font-medium text-coral">
                {k}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Quick recommendations */}
      <Section
        icon={Lightbulb} color="text-amber" title="Quick recommendations"
        items={re?.cv_improvements ?? sc?.quick_recommendations ?? []} />

      {/* ATS optimizations */}
      <Section
        icon={Zap} color="text-brand" title="ATS optimization tips"
        items={re?.ats_optimization ?? []} />

      {/* Tip to add job description */}
      <div className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3">
        <p className="text-xs text-brand font-medium">
          💡 Tip: add a job description above for a tailored analysis with job-fit score and gap breakdown.
        </p>
      </div>
    </div>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────────

export function CvReportModal({
  cvId,
  onClose,
}: {
  cvId: number;
  onClose: () => void;
}) {
  const [jobDesc, setJobDesc] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["cv-report", cvId, submitted ? jobDesc.trim().slice(0, 30) : ""],
    queryFn: () => cvApi.report(cvId, submitted ? jobDesc : undefined),
    enabled: true,   // run immediately with no job desc
    staleTime: Infinity,
  });

  const handleGenerate = () => {
    setSubmitted(true);
    setTimeout(() => refetch(), 0);
  };

  const loading = isLoading || isFetching;

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="modal-in relative w-full max-w-lg overflow-hidden rounded-3xl border border-line2 bg-bg-2 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-display text-lg font-bold tracking-tight">
            CV analysis report
          </h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-faint hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Job description input */}
        <div className="border-b border-line px-6 py-4">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-faint">
            Job description <span className="normal-case font-normal text-faint">(optional — for job-specific analysis)</span>
          </label>
          <textarea
            value={jobDesc}
            onChange={(e) => { setJobDesc(e.target.value); setSubmitted(false); }}
            placeholder="Paste the job description here to get a tailored fit score, gap analysis, and interview focus areas…"
            rows={3}
            className="w-full resize-none rounded-xl border border-line bg-elevated px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="mt-2 flex h-9 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {jobDesc.trim() ? "Analyse for this job" : "Generate report"}
          </button>
        </div>

        {/* Report body */}
        <div className="max-h-[55vh] overflow-y-auto p-6">
          {loading ? (
            <div className="grid place-items-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
              <p className="mt-3 text-sm text-muted">Analysing your CV…</p>
            </div>
          ) : isError || !data ? (
            <p className="py-8 text-center text-sm text-muted">
              Report unavailable. The AI may still be processing — try again in a moment.
            </p>
          ) : data.hasJobDescription ? (
            <ReportWithJob data={data} />
          ) : (
            <ReportNoJob data={data} />
          )}
        </div>
      </div>
    </div>
  );
}
