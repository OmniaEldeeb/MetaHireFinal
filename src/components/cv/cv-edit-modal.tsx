"use client";

/**
 * CV Edit Modal — PATCH /cv/{id}
 *
 * Pre-fills from cv.parsed_data (fetched via GET /cv/{id} if not already loaded).
 * Creates a new user_edited version — source CV is never mutated.
 * After save: invalidates CV list → new version appears → user can export it.
 */

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X, Loader2, Plus, Trash2, Save,
} from "lucide-react";
import { cvApi, type CvParsedDataExperience, type CvParsedDataEducation, type CvParsedDataProject } from "@/lib/api/endpoints/cv";
import { useToastStore } from "@/stores/toast.store";

// ── Small helpers ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-faint">{label}</label>
      {children}
    </div>
  );
}

const input = "w-full rounded-xl border border-line bg-elevated px-3 py-2 text-sm outline-none focus:border-brand";
const textarea = input + " resize-none";

// ── Main modal ────────────────────────────────────────────────────────────────

export function CvEditModal({ cvId, onClose }: { cvId: number; onClose: () => void }) {
  const toast = useToastStore((s) => s.push);
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  // Fetch full CV with parsed_data
  const { data: cvData, isLoading } = useQuery({
    queryKey: ["cv-detail", cvId],
    queryFn: () => cvApi.get(cvId),
    staleTime: 0,
  });

  const pd = cvData?.cv?.parsed_data ?? {};

  // Form state — mirrors CvParsedData
  const [name,    setName]    = useState("");
  const [title,   setTitle]   = useState("");
  const [summary, setSummary] = useState("");
  const [skills,  setSkills]  = useState<string[]>([]);
  const [experience, setExperience] = useState<CvParsedDataExperience[]>([]);
  const [education,  setEducation]  = useState<CvParsedDataEducation[]>([]);
  const [projects,   setProjects]   = useState<CvParsedDataProject[]>([]);

  // Pre-fill once data loads
  useEffect(() => {
    if (!pd) return;
    setName(pd.name ?? "");
    setTitle(pd.title ?? "");
    setSummary(pd.summary ?? "");
    setSkills(pd.skills ?? []);
    setExperience(
      (pd.experience ?? []).map((e) => ({
        title: (e as CvParsedDataExperience).title ?? "",
        company: (e as CvParsedDataExperience).company ?? "",
        start_date: (e as CvParsedDataExperience).start_date ?? "",
        end_date: (e as CvParsedDataExperience).end_date ?? "",
        description: (e as CvParsedDataExperience).description ?? "",
      }))
    );
    setEducation(
      (pd.education ?? []).map((e) => ({
        degree: (e as CvParsedDataEducation).degree ?? "",
        institution: (e as CvParsedDataEducation).institution ?? (e as CvParsedDataEducation).school ?? "",
        start_date: (e as CvParsedDataEducation).start_date ?? "",
        end_date: (e as CvParsedDataEducation).end_date ?? "",
      }))
    );
    setProjects(
      (pd.projects ?? []).map((p) => ({
        name: (p as CvParsedDataProject).name ?? "",
        description: (p as CvParsedDataProject).description ?? "",
        url: (p as CvParsedDataProject).url ?? "",
      }))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cvData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await cvApi.update(cvId, {
        parsed_data: {
          name:       name.trim()    || undefined,
          title:      title.trim()   || undefined,
          summary:    summary.trim() || undefined,
          skills:     skills.filter(Boolean),
          experience: experience.filter((e) => e.title || e.company),
          education:  education.filter((e) => e.degree || e.institution),
          projects:   projects.filter((p) => p.name),
        },
      });
      // Invalidate list → new user_edited version appears in CV manager
      qc.invalidateQueries({ queryKey: ["cvs"] });
      toast({ kind: "success", title: "CV saved", message: "A new edited version was created." });
      onClose();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast({ kind: "error", title: "Save failed", message: e?.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="modal-in relative w-full max-w-2xl overflow-hidden rounded-3xl border border-line2 bg-bg-2 shadow-lift flex flex-col"
        style={{ maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4 shrink-0">
          <h2 className="font-display text-lg font-bold tracking-tight">Edit CV</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-faint hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="grid place-items-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
              <p className="mt-3 text-sm text-muted">Loading CV data…</p>
            </div>
          ) : (
            <>
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full name">
                  <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </Field>
                <Field label="Job title">
                  <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Flutter Developer" />
                </Field>
              </div>

              {/* Summary */}
              <Field label="Summary">
                <textarea className={textarea} rows={3} value={summary}
                  onChange={(e) => setSummary(e.target.value)} placeholder="Professional summary…" />
              </Field>

              {/* Skills */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-faint">Skills</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {skills.map((s, i) => (
                    <span key={i} className="flex items-center gap-1 rounded-lg bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">
                      {s}
                      <button onClick={() => setSkills(skills.filter((_, j) => j !== i))}
                        className="hover:text-coral"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
                <input className={input} placeholder="Add skill and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      setSkills([...skills, e.currentTarget.value.trim()]);
                      e.currentTarget.value = "";
                      e.preventDefault();
                    }
                  }} />
              </div>

              {/* Experience */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-faint">Experience</label>
                  <button onClick={() => setExperience([...experience, { title: "", company: "", start_date: "", end_date: "", description: "" }])}
                    className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs hover:border-brand hover:text-brand">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
                {experience.map((e, i) => (
                  <div key={i} className="mb-3 rounded-xl border border-line bg-elevated p-4 space-y-3">
                    <div className="flex justify-end">
                      <button onClick={() => setExperience(experience.filter((_, j) => j !== i))}
                        className="text-faint hover:text-coral"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Title">
                        <input className={input} value={e.title ?? ""} placeholder="Job title"
                          onChange={(ev) => setExperience(experience.map((x, j) => j === i ? { ...x, title: ev.target.value } : x))} />
                      </Field>
                      <Field label="Company">
                        <input className={input} value={e.company ?? ""} placeholder="Company name"
                          onChange={(ev) => setExperience(experience.map((x, j) => j === i ? { ...x, company: ev.target.value } : x))} />
                      </Field>
                      <Field label="Start date">
                        <input className={input} type="date" value={e.start_date ?? ""}
                          onChange={(ev) => setExperience(experience.map((x, j) => j === i ? { ...x, start_date: ev.target.value } : x))} />
                      </Field>
                      <Field label="End date">
                        <input className={input} type="date" value={e.end_date ?? ""}
                          onChange={(ev) => setExperience(experience.map((x, j) => j === i ? { ...x, end_date: ev.target.value || null } : x))} />
                      </Field>
                    </div>
                    <Field label="Description">
                      <textarea className={textarea} rows={2} value={e.description ?? ""} placeholder="What you did…"
                        onChange={(ev) => setExperience(experience.map((x, j) => j === i ? { ...x, description: ev.target.value } : x))} />
                    </Field>
                  </div>
                ))}
              </div>

              {/* Education */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-faint">Education</label>
                  <button onClick={() => setEducation([...education, { degree: "", institution: "", start_date: "", end_date: "" }])}
                    className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs hover:border-brand hover:text-brand">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
                {education.map((e, i) => (
                  <div key={i} className="mb-3 rounded-xl border border-line bg-elevated p-4 space-y-3">
                    <div className="flex justify-end">
                      <button onClick={() => setEducation(education.filter((_, j) => j !== i))}
                        className="text-faint hover:text-coral"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Degree">
                        <input className={input} value={e.degree ?? ""} placeholder="e.g. BSc Computer Science"
                          onChange={(ev) => setEducation(education.map((x, j) => j === i ? { ...x, degree: ev.target.value } : x))} />
                      </Field>
                      <Field label="Institution">
                        <input className={input} value={e.institution ?? ""} placeholder="University name"
                          onChange={(ev) => setEducation(education.map((x, j) => j === i ? { ...x, institution: ev.target.value } : x))} />
                      </Field>
                      <Field label="Start date">
                        <input className={input} type="date" value={e.start_date ?? ""}
                          onChange={(ev) => setEducation(education.map((x, j) => j === i ? { ...x, start_date: ev.target.value } : x))} />
                      </Field>
                      <Field label="End date">
                        <input className={input} type="date" value={e.end_date ?? ""}
                          onChange={(ev) => setEducation(education.map((x, j) => j === i ? { ...x, end_date: ev.target.value || null } : x))} />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>

              {/* Projects */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-faint">Projects</label>
                  <button onClick={() => setProjects([...projects, { name: "", description: "", url: "" }])}
                    className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs hover:border-brand hover:text-brand">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
                {projects.map((p, i) => (
                  <div key={i} className="mb-3 rounded-xl border border-line bg-elevated p-4 space-y-3">
                    <div className="flex justify-end">
                      <button onClick={() => setProjects(projects.filter((_, j) => j !== i))}
                        className="text-faint hover:text-coral"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                    <Field label="Name">
                      <input className={input} value={p.name ?? ""} placeholder="Project name"
                        onChange={(ev) => setProjects(projects.map((x, j) => j === i ? { ...x, name: ev.target.value } : x))} />
                    </Field>
                    <Field label="URL">
                      <input className={input} value={p.url ?? ""} placeholder="https://github.com/…"
                        onChange={(ev) => setProjects(projects.map((x, j) => j === i ? { ...x, url: ev.target.value } : x))} />
                    </Field>
                    <Field label="Description">
                      <textarea className={textarea} rows={2} value={p.description ?? ""} placeholder="What it does…"
                        onChange={(ev) => setProjects(projects.map((x, j) => j === i ? { ...x, description: ev.target.value } : x))} />
                    </Field>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isLoading && (
          <div className="border-t border-line px-6 py-4 shrink-0 flex items-center justify-between gap-3">
            <p className="text-xs text-faint">
              A new <span className="font-medium text-ink">edited version</span> will be created. The original is kept.
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save new version
            </button>
          </div>
        )}
      </div>
    </div>
  );
}