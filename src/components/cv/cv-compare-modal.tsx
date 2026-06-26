"use client";

/**
 * CV Compare Modal
 * GET /cv/{from}/compare/{to}
 *
 * Shows two CV versions side by side with a diff.
 * - mode: "file"   → show PDF in iframe (original upload)
 * - mode: "parsed" → show structured parsed_data fields
 *
 * Triggered from:
 * 1. After edit   → compare original vs new user_edited
 * 2. After report → "Compare with another" button
 * 3. cv-manager   → select exactly 2 CVs → Compare button
 */

import { useQuery } from "@tanstack/react-query";
import {
  X, Loader2, FileText, Check, Minus, Plus, AlertTriangle,
} from "lucide-react";
import { cvApi, type CvComparisonSide } from "@/lib/api/endpoints/cv";
import { imgUrl } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type?: string }) {
  const map: Record<string, string> = {
    original:    "bg-elevated text-faint",
    ai_generated:"bg-brand/10 text-brand",
    user_edited: "bg-green/10 text-green",
    rebuilt:     "bg-amber/10 text-amber",
  };
  const cls = map[type ?? ""] ?? "bg-elevated text-faint";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold capitalize ${cls}`}>
      {type?.replace(/_/g, " ") ?? "CV"}
    </span>
  );
}

function SideView({ side, label, versionLabel }: {
  side: CvComparisonSide;
  label: string;
  versionLabel: string;
}) {
  if (side.mode === "file" && side.file_url) {
    const proxied = imgUrl(side.file_url) ?? side.file_url;
    return (
      <div className="flex flex-col h-full min-h-[400px]">
        <p className="mb-2 text-xs text-faint">{side.note}</p>
        <iframe
          src={proxied}
          className="flex-1 rounded-xl border border-line"
          style={{ minHeight: 360 }}
          title={label}
        />
      </div>
    );
  }

  if (side.mode === "parsed" && side.content) {
    const c = side.content as Record<string, unknown>;
    const str = (v: unknown) => (v ? String(v) : "");
    return (
      <div className="space-y-3 text-sm">
        {side.note && <p className="text-xs text-faint">{side.note}</p>}
        {!!c.name    && <div><p className="text-xs text-faint mb-0.5">Name</p><p className="font-semibold">{str(c.name)}</p></div>}
        {!!c.title   && <div><p className="text-xs text-faint mb-0.5">Title</p><p>{str(c.title)}</p></div>}
        {!!c.summary && <div><p className="text-xs text-faint mb-0.5">Summary</p><p className="text-muted leading-relaxed">{str(c.summary)}</p></div>}
        {Array.isArray(c.skills) && c.skills.length > 0 && (
          <div>
            <p className="text-xs text-faint mb-1">Skills</p>
            <div className="flex flex-wrap gap-1">
              {(c.skills as string[]).map((s) => (
                <span key={s} className="rounded-md bg-brand-soft px-2 py-0.5 text-xs text-brand">{s}</span>
              ))}
            </div>
          </div>
        )}
        {Array.isArray(c.experience) && c.experience.length > 0 && (
          <div>
            <p className="text-xs text-faint mb-1">Experience ({(c.experience as unknown[]).length})</p>
            {(c.experience as Record<string, unknown>[]).map((e, i) => (
              <div key={i} className="mb-1.5 border-l-2 border-line pl-3">
                <p className="text-xs font-medium">{String(e.title ?? "")}</p>
                <p className="text-xs text-muted">{String(e.company ?? "")}</p>
              </div>
            ))}
          </div>
        )}
        {Array.isArray(c.education) && c.education.length > 0 && (
          <div>
            <p className="text-xs text-faint mb-1">Education ({(c.education as unknown[]).length})</p>
            {(c.education as Record<string, unknown>[]).map((e, i) => (
              <div key={i} className="mb-1.5 border-l-2 border-line pl-3">
                <p className="text-xs font-medium">{String(e.degree ?? "")}</p>
                <p className="text-xs text-muted">{String(e.institution ?? e.school ?? "")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <p className="text-sm text-muted">No preview available.</p>;
}

function DiffRow({ field, diff }: {
  field: string;
  diff: { changed?: boolean; from?: unknown; to?: unknown; added?: string[]; removed?: string[]; from_count?: number; to_count?: number; fields?: Record<string, { from?: unknown; to?: unknown }> };
}) {
  if (!diff.changed) return null;

  const label = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ");

  // Skills diff
  if (diff.added || diff.removed) {
    return (
      <div className="py-2 border-b border-line last:border-0">
        <p className="text-xs font-semibold text-faint mb-1">{label}</p>
        <div className="flex flex-wrap gap-1">
          {diff.added?.map((s) => (
            <span key={s} className="flex items-center gap-0.5 rounded-md bg-green/10 px-2 py-0.5 text-xs text-green">
              <Plus className="h-3 w-3" />{s}
            </span>
          ))}
          {diff.removed?.map((s) => (
            <span key={s} className="flex items-center gap-0.5 rounded-md bg-coral/10 px-2 py-0.5 text-xs text-coral">
              <Minus className="h-3 w-3" />{s}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Contact fields diff
  if (diff.fields) {
    return (
      <div className="py-2 border-b border-line last:border-0">
        <p className="text-xs font-semibold text-faint mb-1">{label}</p>
        {Object.entries(diff.fields).map(([k, v]) => (
          v.from !== v.to ? (
            <div key={k} className="flex items-start gap-2 text-xs mb-0.5">
              <span className="w-16 text-faint capitalize shrink-0">{k}</span>
              <span className="text-coral line-through opacity-60">{String(v.from ?? "—")}</span>
              <span className="text-green">{String(v.to ?? "—")}</span>
            </div>
          ) : null
        ))}
      </div>
    );
  }

  // Count diff (experience/education/projects)
  if (diff.from_count !== undefined) {
    return (
      <div className="flex items-center justify-between py-2 border-b border-line last:border-0">
        <p className="text-xs font-semibold">{label}</p>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-coral">{diff.from_count} items</span>
          <span className="text-faint">→</span>
          <span className="text-green">{diff.to_count} items</span>
        </div>
      </div>
    );
  }

  // Simple text diff
  return (
    <div className="py-2 border-b border-line last:border-0">
      <p className="text-xs font-semibold text-faint mb-1">{label}</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <p className="text-coral bg-coral/5 rounded-lg p-2 line-clamp-3">{String(diff.from ?? "—")}</p>
        <p className="text-green bg-green/5 rounded-lg p-2 line-clamp-3">{String(diff.to ?? "—")}</p>
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export function CvCompareModal({
  fromId,
  toId,
  onClose,
}: {
  fromId: number;
  toId: number;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["cv-compare", fromId, toId],
    queryFn: () => cvApi.compare(fromId, toId),
    staleTime: 60_000,
  });

  const changedFields = data
    ? Object.entries(data.diff).filter(([, d]) => d.changed)
    : [];

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="modal-in relative w-full max-w-5xl overflow-hidden rounded-3xl border border-line2 bg-bg-2 shadow-lift flex flex-col"
        style={{ maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-lg font-bold tracking-tight">Compare CVs</h2>
            {data && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <TypeBadge type={data.versions.from.type} />
                <span className="text-faint">v{data.versions.from.version}</span>
                <span className="text-faint mx-1">→</span>
                <TypeBadge type={data.versions.to.type} />
                <span className="text-faint">v{data.versions.to.version}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-faint hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
            <p className="mt-3 text-sm text-muted">Loading comparison…</p>
          </div>
        ) : isError || !data ? (
          <p className="py-16 text-center text-sm text-muted">Could not load comparison.</p>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Diff note */}
            {data.diff_note && (
              <div className="mx-6 mt-4 flex items-start gap-2 rounded-xl border border-amber/30 bg-amber/5 px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-amber shrink-0 mt-0.5" />
                <p className="text-xs text-amber">{data.diff_note}</p>
              </div>
            )}

            {/* Summary */}
            {changedFields.length > 0 ? (
              <div className="mx-6 mt-4 flex items-center gap-2">
                <span className="text-xs font-semibold text-faint">{changedFields.length} field{changedFields.length !== 1 ? "s" : ""} changed</span>
                <div className="flex items-center gap-1 text-xs">
                  <span className="h-2 w-2 rounded-full bg-coral" />
                  <span className="text-faint">removed</span>
                  <span className="h-2 w-2 rounded-full bg-green ml-2" />
                  <span className="text-faint">added/changed</span>
                </div>
              </div>
            ) : (
              <div className="mx-6 mt-4 flex items-center gap-2 text-xs text-green">
                <Check className="h-4 w-4" /> No differences found
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Left: From */}
              <div className="p-6 lg:border-r border-line">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-faint" />
                  <span className="text-sm font-semibold">Version {data.versions.from.version}</span>
                  <TypeBadge type={data.versions.from.type} />
                </div>
                <SideView side={data.from} label="From" versionLabel={`v${data.versions.from.version}`} />
              </div>

              {/* Right: To */}
              <div className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-faint" />
                  <span className="text-sm font-semibold">Version {data.versions.to.version}</span>
                  <TypeBadge type={data.versions.to.type} />
                </div>
                <SideView side={data.to} label="To" versionLabel={`v${data.versions.to.version}`} />
              </div>
            </div>

            {/* Diff section */}
            {changedFields.length > 0 && (
              <div className="border-t border-line mx-6 mt-2 mb-6">
                <h3 className="py-4 text-sm font-semibold">Changes</h3>
                {changedFields.map(([field, diff]) => (
                  <DiffRow key={field} field={field} diff={diff} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}