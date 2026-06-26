"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X, Loader2, TrendingUp, AlertCircle, Lightbulb,
  CheckCircle2, XCircle, Target, Zap, Award, ChevronRight,
  Briefcase, User, GraduationCap, FolderGit2, RefreshCw, Info,
} from "lucide-react";
import { cvApi } from "@/lib/api/endpoints/cv";
import { CvCompareModal } from "@/components/cv/cv-compare-modal";
import { useToastStore } from "@/stores/toast.store";
import type { CvReport, CvScoreBreakdown } from "@/lib/api/endpoints/cv";

// ── Helpers ─────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "text-green" : score >= 60 ? "text-amber" : "text-coral";
  const bg = score >= 80 ? "bg-green/10" : score >= 60 ? "bg-amber/10" : "bg-coral/10";
  const label = score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Average" : "Needs improvement";
  const r = 34;
  const circ = 2 * Math.PI * r;
  return (
    <div className={`rounded-2xl ${bg} p-5 flex items-center gap-5`}>
      <div className="relative grid h-20 w-20 shrink-0 place-items-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor"
            className="text-line2" strokeWidth="8" />
          <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor"
            className={color} strokeWidth="8"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - score / 100)}
            strokeLinecap="round" />
        </svg>
        <span className={`readout text-xl font-bold ${color}`}>{score}</span>
      </div>
      <div>
        <p className="readout text-xs uppercase tracking-wider text-faint">ATS Score</p>
        <p className={`mt-0.5 text-lg font-bold ${color}`}>{label}</p>
        <div className="mt-2 h-1.5 w-32 overflow-hidden rounded-full bg-line2">
          <div className={`h-full rounded-full ${score >= 80 ? "bg-green" : score >= 60 ? "bg-amber" : "bg-coral"}`}
            style={{ width: `${score}%` }} />
        </div>
      </div>
    </div>
  );
}

function ScoreBreakdown({ bd }: { bd: CvScoreBreakdown }) {
  const items = [
    { label: "Skills match", value: bd.skills_match },
    { label: "Experience", value: bd.experience_relevance },
    { label: "Education", value: bd.education_fit },
    { label: "Projects", value: bd.projects },
    { label: "ATS readability", value: bd.ats_readability },
    { label: "Achievements", value: bd.achievements },
  ].filter((i) => i.value !== undefined);

  if (!items.length) return null;
  return (
    <div className="rounded-xl border border-line bg-elevated p-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-faint mb-3">Score breakdown</p>
      {items.map(({ label, value }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="w-32 text-xs text-muted shrink-0">{label}</span>
          <div className="flex-1 h-1.5 rounded-full bg-line2 overflow-hidden">
            <div
              className={`h-full rounded-full ${(value ?? 0) >= 7 ? "bg-green" : (value ?? 0) >= 4 ? "bg-amber" : "bg-coral"}`}
              style={{ width: `${((value ?? 0) / 10) * 100}%` }} />
          </div>
          <span className="text-xs font-medium w-6 text-right">{value}</span>
        </div>
      ))}
    </div>
  );
}

function FitBadge({ level }: { level: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    excellent: { label: "Excellent fit", cls: "bg-green/10 text-green" },
    good:      { label: "Good fit",      cls: "bg-brand/10 text-brand" },
    fair:      { label: "Fair fit",      cls: "bg-amber/10 text-amber" },
    low:       { label: "Low fit",       cls: "bg-coral/10 text-coral" },
    poor:      { label: "Poor fit",      cls: "bg-coral/10 text-coral" },
  };
  const { label, cls } = map[level.toLowerCase()] ?? { label: level, cls: "bg-elevated text-muted" };
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
}

function HireTag({ v }: { v: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    yes:       { label: "Recommend hire", cls: "bg-green/10 text-green" },
    strong_yes:{ label: "Strong hire",    cls: "bg-green/10 text-green" },
    maybe:     { label: "Maybe",          cls: "bg-amber/10 text-amber" },
    no:        { label: "Not recommended",cls: "bg-coral/10 text-coral" },
  };
  const { label, cls } = map[v.toLowerCase()] ?? { label: v, cls: "bg-elevated text-muted" };
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
}

function CareerBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    junior: "bg-amber/10 text-amber",
    mid:    "bg-brand/10 text-brand",
    senior: "bg-green/10 text-green",
    lead:   "bg-purple/10 text-purple",
  };
  const cls = map[level.toLowerCase()] ?? "bg-elevated text-muted";
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${cls}`}>{level} level</span>;
}

function Section({ icon: Icon, title, color, items }: {
  icon: typeof TrendingUp; title: string; color: string; items?: string[];
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
            <ChevronRight className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${color}`} />{s}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SkillTags({ label, skills, variant }: {
  label: string; skills?: string[]; variant: "match" | "missing" | "neutral";
}) {
  if (!skills?.length) return null;
  const cls = variant === "match" ? "bg-green/10 text-green" :
              variant === "missing" ? "bg-coral/10 text-coral" : "bg-elevated text-muted";
  const Icon = variant === "match" ? CheckCircle2 : variant === "missing" ? XCircle : null;
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-faint">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((s) => (
          <span key={s} className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium ${cls}`}>
            {Icon && <Icon className="h-3 w-3" />}{s}
          </span>
        ))}
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="rounded-xl border border-line bg-elevated px-4 py-3">
      <p className="text-xs font-semibold text-faint uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-muted">{value}</p>
    </div>
  );
}

// ── WITH job description ─────────────────────────────────────────────────────

function ReportWithJob({ data }: { data: CvReport }) {
  const sc = data.score;
  const an = data.analysis;
  const re = data.recommendation;

  return (
    <div className="space-y-6">
      {/* ATS Score */}
      {sc?.score != null && <ScoreRing score={sc.score} />}

      {/* Score breakdown */}
      {sc?.score_breakdown && <ScoreBreakdown bd={sc.score_breakdown} />}

      {/* Job fit + Hire recommendation */}
      <div className="flex flex-wrap items-center gap-3">
        {an?.job_fit_level && <FitBadge level={an.job_fit_level} />}
        {(an?.hire_recommendation ?? sc?.hire_decision_hint) && (
          <HireTag v={(an?.hire_recommendation ?? sc?.hire_decision_hint)!} />
        )}
      </div>

      {/* Fit summary */}
      {an?.fit_summary && (
        <p className="rounded-xl border border-line bg-elevated px-4 py-3 text-sm text-muted">{an.fit_summary}</p>
      )}

      {/* Skills */}
      <div className="space-y-4">
        <SkillTags label="Matched skills" skills={sc?.matched_skills} variant="match" />
        <SkillTags label="Missing skills" skills={sc?.missing_skills} variant="missing" />
      </div>

      {/* Strengths for this job */}
      <Section icon={TrendingUp} color="text-green" title="Strengths for this role"
        items={an?.strengths_for_this_job ?? sc?.strengths} />

      {/* Critical gaps */}
      <Section icon={AlertCircle} color="text-coral" title="Critical gaps"
        items={an?.critical_gaps} />

      {/* Nice-to-have gaps */}
      <Section icon={Target} color="text-amber" title="Nice-to-have gaps"
        items={an?.nice_to_have_gaps} />

      {/* Experience & education match */}
      <InfoCard label="Experience match" value={an?.experience_match} />
      <InfoCard label="Education match" value={an?.education_match} />

      {/* Experience analysis detail */}
      {sc?.experience_analysis && (
        <div className="rounded-xl border border-line bg-elevated p-4 space-y-1.5">
          <p className="text-xs font-semibold text-faint uppercase tracking-wider mb-2">Experience analysis</p>
          {sc.experience_analysis.required_level && <p className="text-sm text-muted">Required: <span className="font-medium text-ink">{sc.experience_analysis.required_level}</span></p>}
          {sc.experience_analysis.detected_level && <p className="text-sm text-muted">Detected: <span className="font-medium text-ink">{sc.experience_analysis.detected_level}</span></p>}
          {sc.experience_analysis.years_required != null && <p className="text-sm text-muted">Years required: <span className="font-medium text-ink">{sc.experience_analysis.years_required}</span></p>}
          {sc.experience_analysis.years_detected != null && <p className="text-sm text-muted">Years detected: <span className="font-medium text-ink">{sc.experience_analysis.years_detected}</span></p>}
        </div>
      )}

      {/* Education analysis detail */}
      {sc?.education_analysis && (
        <div className="rounded-xl border border-line bg-elevated p-4 space-y-1.5">
          <p className="text-xs font-semibold text-faint uppercase tracking-wider mb-2">Education analysis</p>
          {sc.education_analysis.required && <p className="text-sm text-muted">Required: <span className="font-medium text-ink">{sc.education_analysis.required}</span></p>}
          {sc.education_analysis.detected && <p className="text-sm text-muted">Detected: <span className="font-medium text-ink">{sc.education_analysis.detected}</span></p>}
          {sc.education_analysis.match_level && <p className="text-sm text-muted">Match: <span className="font-medium text-ink capitalize">{sc.education_analysis.match_level}</span></p>}
        </div>
      )}

      {/* Projects analysis */}
      {sc?.projects_analysis && (
        <div className="space-y-3">
          {sc.projects_analysis.relevant_projects?.length ? (
            <SkillTags label="Relevant projects" skills={sc.projects_analysis.relevant_projects} variant="match" />
          ) : null}
          {sc.projects_analysis.missing_project_types?.length ? (
            <SkillTags label="Missing project types" skills={sc.projects_analysis.missing_project_types} variant="missing" />
          ) : null}
        </div>
      )}

      {/* Interview focus */}
      <Section icon={Briefcase} color="text-brand" title="Interview focus areas"
        items={an?.interview_focus_areas} />

      {/* ATS keywords */}
      {sc?.ats_keywords_missing?.length ? (
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-coral">
            <Zap className="h-4 w-4" /> ATS keywords to add
          </h3>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sc.ats_keywords_missing.map((k) => (
              <span key={k} className="rounded-lg bg-coral/10 px-2.5 py-1 text-xs font-medium text-coral">{k}</span>
            ))}
          </div>
        </div>
      ) : null}

      {/* CV improvements */}
      <Section icon={Lightbulb} color="text-amber" title="CV improvements"
        items={re?.cv_improvements ?? sc?.quick_recommendations} />

      {/* Skill gaps */}
      <Section icon={Target} color="text-faint" title="Skill gaps to fill"
        items={re?.skill_gaps} />

      {/* ATS optimization */}
      <Section icon={Zap} color="text-brand" title="ATS optimization tips"
        items={re?.ats_optimization} />

      {/* Career advice */}
      <Section icon={Award} color="text-brand" title="Career advice"
        items={re?.career_advice} />

      {/* Weaknesses */}
      <Section icon={AlertCircle} color="text-coral" title="Weaknesses"
        items={sc?.weaknesses} />

      {/* Summary */}
      {(an?.summary ?? sc?.summary) && (
        <p className="border-t border-line pt-4 text-xs text-faint">{an?.summary ?? sc?.summary}</p>
      )}
    </div>
  );
}

// ── WITHOUT job description ───────────────────────────────────────────────────

function ReportNoJob({ data }: { data: CvReport }) {
  const sc = data.score;
  const an = data.analysis;
  const re = data.recommendation;

  return (
    <div className="space-y-6">
      {/* Career level */}
      {an?.career_level && (
        <div className="flex items-center gap-3">
          <CareerBadge level={an.career_level} />
        </div>
      )}

      {/* General summary from analysis */}
      {an?.summary && (
        <p className="rounded-xl border border-line bg-elevated px-4 py-3 text-sm text-muted">{an.summary}</p>
      )}

      {/* Key skills detected */}
      <SkillTags label="Key skills detected" skills={an?.key_skills_detected} variant="match" />

      {/* Strengths from analysis */}
      <Section icon={TrendingUp} color="text-green" title="Strengths"
        items={an?.strengths ?? sc?.strengths} />

      {/* Weaknesses from analysis */}
      <Section icon={AlertCircle} color="text-coral" title="Areas to improve"
        items={an?.weaknesses ?? sc?.weaknesses} />

      {/* Career progression */}
      <InfoCard label="Career progression" value={an?.career_progression_analysis} />

      {/* Missing information */}
      <Section icon={Info} color="text-amber" title="Missing information in your CV"
        items={an?.missing_information} />

      {/* Interview focus */}
      <Section icon={Briefcase} color="text-brand" title="Interview focus areas"
        items={an?.interview_focus_areas} />

      {/* ATS keywords missing */}
      {sc?.ats_keywords_missing?.length ? (
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-coral">
            <Zap className="h-4 w-4" /> ATS keywords missing
          </h3>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sc.ats_keywords_missing.map((k) => (
              <span key={k} className="rounded-lg bg-coral/10 px-2.5 py-1 text-xs font-medium text-coral">{k}</span>
            ))}
          </div>
        </div>
      ) : null}

      {/* CV improvements */}
      <Section icon={Lightbulb} color="text-amber" title="CV improvements"
        items={re?.cv_improvements ?? sc?.quick_recommendations} />

      {/* Skill gaps */}
      <Section icon={Target} color="text-faint" title="Skill gaps to fill"
        items={re?.skill_gaps} />

      {/* ATS optimization */}
      <Section icon={Zap} color="text-brand" title="ATS optimization tips"
        items={re?.ats_optimization} />

      {/* Career advice */}
      <Section icon={Award} color="text-brand" title="Career advice"
        items={re?.career_advice} />

      {/* Tip */}
      <div className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3">
        <p className="text-xs text-brand font-medium">
          💡 Tip: paste a job description above for a tailored fit score, gap analysis, and hire recommendation.
        </p>
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export function CvReportModal({ cvId, onClose }: { cvId: number; onClose: () => void }) {
  const toast = useToastStore((s) => s.push);
  const qc = useQueryClient();
  const [jobDesc, setJobDesc] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [rebuiltCvId, setRebuiltCvId] = useState<number | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["cv-report", cvId, submitted ? jobDesc.trim().slice(0, 30) : ""],
    queryFn: () => cvApi.report(cvId, submitted ? jobDesc : undefined),
    enabled: true,
    staleTime: Infinity,
  });

  const handleGenerate = () => {
    setSubmitted(true);
    setTimeout(() => refetch(), 0);
  };

  // Rebuild CV from AI — POST /cv/{id}/rebuild
  const handleRebuild = async () => {
    setRebuilding(true);
    try {
      const rebuilt = await cvApi.rebuild(cvId);
      qc.invalidateQueries({ queryKey: ["cvs"] });
      // Store the new CV id so user can compare original vs rebuilt
      if (rebuilt?.id) setRebuiltCvId(rebuilt.id);
      toast({ kind: "success", title: "CV rebuilt with AI", message: "Your CV has been updated from your profile data." });
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast({ kind: "error", title: "Rebuild failed", message: e?.message });
    } finally {
      setRebuilding(false);
    }
  };

  const loading = isLoading || isFetching;

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="modal-in relative w-full max-w-lg overflow-hidden rounded-3xl border border-line2 bg-bg-2 shadow-lift flex flex-col"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4 shrink-0">
          <h2 className="font-display text-lg font-bold tracking-tight">CV analysis report</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-faint hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Job description input */}
        <div className="border-b border-line px-6 py-4 shrink-0">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-faint">
            Job description <span className="normal-case font-normal text-faint">(optional — for job-specific analysis)</span>
          </label>
          <textarea
            value={jobDesc}
            onChange={(e) => { setJobDesc(e.target.value); setSubmitted(false); }}
            placeholder="Paste the job description here for a tailored fit score, gap analysis, and hire recommendation…"
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
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="grid place-items-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
              <p className="mt-3 text-sm text-muted">Analysing your CV with AI…</p>
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

        {/* Footer — Rebuild with AI button */}
        {!loading && data && (
          <div className="border-t border-line px-6 py-4 shrink-0 flex items-center justify-between gap-3">
            <p className="text-xs text-faint">Rebuild your CV using AI based on your latest profile data.</p>
            <button
              onClick={handleRebuild}
              disabled={rebuilding}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-brand-soft disabled:opacity-60 transition-colors"
            >
              {rebuilding
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <RefreshCw className="h-4 w-4" />}
              Rebuild with AI
            </button>
            {rebuiltCvId && (
              <button
                onClick={() => setShowCompare(true)}
                className="flex items-center gap-2 rounded-xl border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-brand-soft"
              >
                Compare versions
              </button>
            )}
          </div>
        )}
        {showCompare && rebuiltCvId && (
          <CvCompareModal fromId={cvId} toId={rebuiltCvId} onClose={() => setShowCompare(false)} />
        )}
      </div>
    </div>
  );
}