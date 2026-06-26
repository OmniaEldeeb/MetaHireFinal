"use client";

/**
 * CV Compare Page — full page at /cv/compare/[from]/[to]
 * GET /cv/{from}/compare/{to}
 *
 * Three-column layout:
 * - Left:   "Before" CV (from)
 * - Center: Changes diff
 * - Right:  "After" CV (to)
 */

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Loader2, ArrowLeft, AlertTriangle, Check,
  Plus, Minus, ChevronRight, FileText,
} from "lucide-react";
import { cvApi, type CvComparisonSide } from "@/lib/api/endpoints/cv";
import { Container } from "@/components/ui/section";

// ── Helpers ───────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type?: string }) {
  const map: Record<string, string> = {
    original:     "bg-elevated text-faint",
    ai_generated: "bg-brand/10 text-brand",
    user_edited:  "bg-green/10 text-green",
    rebuilt:      "bg-amber/10 text-amber",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${map[type ?? ""] ?? "bg-elevated text-faint"}`}>
      {type?.replace(/_/g, " ") ?? "CV"}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="mb-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-faint">{title}</p>
      {children}
    </div>
  );
}

function SideView({ side }: { side: CvComparisonSide }) {
  if (side.mode === "file" && side.file_url) {
    // Proxy through /api/storage to bypass ngrok browser warning
    const proxied = `/api/storage?url=${encodeURIComponent(side.file_url)}`;
    return (
      <div className="flex flex-col gap-2">
        {side.note && <p className="text-xs text-faint italic">{side.note}</p>}
        <iframe
          src={proxied}
          className="w-full rounded-2xl border border-line bg-white"
          style={{ minHeight: 600, border: "none" }}
          title="Original CV"
        />
      </div>
    );
  }

  if (side.mode === "parsed" && side.content) {
    const c = side.content as Record<string, unknown>;
    const str = (v: unknown) => String(v ?? "");

    const experiences = Array.isArray(c.experience)
      ? (c.experience as Record<string, unknown>[]).filter((e) => e && typeof e === "object" && !Array.isArray(e))
      : [];
    const educations = Array.isArray(c.education)
      ? (c.education as Record<string, unknown>[]).filter((e) => e && typeof e === "object" && !Array.isArray(e))
      : [];
    const projects = Array.isArray(c.projects)
      ? (c.projects as Record<string, unknown>[]).filter((e) => e && typeof e === "object" && !Array.isArray(e))
      : [];
    const skills = Array.isArray(c.skills) ? (c.skills as string[]) : [];
    const contact = c.contact && typeof c.contact === "object" && !Array.isArray(c.contact)
      ? c.contact as Record<string, unknown>
      : null;

    return (
      <div className="space-y-0">
        {side.note && <p className="mb-4 text-xs text-faint italic">{side.note}</p>}

        {!!c.name && (
          <Section title="Name">
            <p className="text-lg font-bold text-ink">{str(c.name)}</p>
          </Section>
        )}

        {!!c.title && (
          <Section title="Title">
            <p className="text-sm font-medium text-muted">{str(c.title)}</p>
          </Section>
        )}

        {contact && Object.keys(contact).length > 0 && (
          <Section title="Contact">
            <div className="space-y-1">
              {Object.entries(contact).map(([k, v]) => !!v ? (
                <div key={k} className="flex items-center gap-2 text-xs">
                  <span className="w-16 capitalize text-faint shrink-0">{k}</span>
                  <span className="text-muted truncate">{str(v)}</span>
                </div>
              ) : null)}
            </div>
          </Section>
        )}

        {!!c.summary && (
          <Section title="Summary">
            <p className="text-sm text-muted leading-relaxed">{str(c.summary)}</p>
          </Section>
        )}

        {skills.length > 0 && (
          <Section title="Skills">
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span key={s} className="rounded-lg bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">{s}</span>
              ))}
            </div>
          </Section>
        )}

        {experiences.length > 0 && (
          <Section title={`Experience (${experiences.length})`}>
            <div className="space-y-3">
              {experiences.map((e, i) => (
                <div key={i} className="border-l-2 border-brand/30 pl-3">
                  <p className="text-sm font-semibold">{str(e.title)}</p>
                  <p className="text-xs text-muted">{str(e.company)}</p>
                  {(!!e.start_date || !!e.end_date) && (
                    <p className="text-xs text-faint">{str(e.start_date)} – {!!e.end_date ? str(e.end_date) : "Present"}</p>
                  )}
                  {!!e.description && <p className="mt-1 text-xs text-muted">{str(e.description)}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {educations.length > 0 && (
          <Section title={`Education (${educations.length})`}>
            <div className="space-y-3">
              {educations.map((e, i) => (
                <div key={i} className="border-l-2 border-brand/30 pl-3">
                  <p className="text-sm font-semibold">{str(e.degree)}</p>
                  <p className="text-xs text-muted">{str(e.institution ?? e.school)}</p>
                  {(!!e.start_date || !!e.end_date) && (
                    <p className="text-xs text-faint">{str(e.start_date)} – {!!e.end_date ? str(e.end_date) : "Present"}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {projects.length > 0 && (
          <Section title={`Projects (${projects.length})`}>
            <div className="space-y-3">
              {projects.map((p, i) => (
                <div key={i} className="border-l-2 border-brand/30 pl-3">
                  <p className="text-sm font-semibold">{str(p.name)}</p>
                  {!!p.description && <p className="text-xs text-muted">{str(p.description)}</p>}
                  {!!p.url && <p className="text-xs text-brand truncate">{str(p.url)}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    );
  }

  return <p className="text-sm text-muted">No preview available.</p>;
}

// ── Diff panel ────────────────────────────────────────────────────────────────

function DiffPanel({
  diff,
}: {
  diff: Record<string, {
    changed?: boolean;
    from?: unknown; to?: unknown;
    added?: string[]; removed?: string[];
    from_count?: number; to_count?: number;
    fields?: Record<string, { from?: unknown; to?: unknown }>;
  }>;
}) {
  const changed = Object.entries(diff).filter(([, d]) => d.changed);
  if (changed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-green/10">
          <Check className="h-6 w-6 text-green" />
        </div>
        <p className="text-sm font-medium">No differences found</p>
        <p className="text-xs text-faint">Both versions are identical.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold uppercase tracking-widest text-faint">
        {changed.length} field{changed.length !== 1 ? "s" : ""} changed
      </p>

      {changed.map(([field, d]) => {
        const label = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ");

        // Skills — added/removed tags
        if (d.added !== undefined || d.removed !== undefined) {
          return (
            <div key={field} className="rounded-2xl border border-line bg-surface p-4">
              <p className="mb-3 text-xs font-semibold text-faint uppercase tracking-wider">{label}</p>
              {d.removed && d.removed.length > 0 && (
                <div className="mb-2">
                  <p className="text-[0.65rem] text-coral mb-1">Removed</p>
                  <div className="flex flex-wrap gap-1">
                    {d.removed.map((s) => (
                      <span key={s} className="flex items-center gap-0.5 rounded-lg bg-coral/10 px-2 py-0.5 text-xs text-coral line-through">
                        <Minus className="h-3 w-3 shrink-0" />{s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {d.added && d.added.length > 0 && (
                <div>
                  <p className="text-[0.65rem] text-green mb-1">Added</p>
                  <div className="flex flex-wrap gap-1">
                    {d.added.map((s) => (
                      <span key={s} className="flex items-center gap-0.5 rounded-lg bg-green/10 px-2 py-0.5 text-xs text-green">
                        <Plus className="h-3 w-3 shrink-0" />{s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }

        // Contact — per-field comparison
        if (d.fields) {
          const changedFields = Object.entries(d.fields).filter(([, v]) => v.from !== v.to);
          if (!changedFields.length) return null;
          return (
            <div key={field} className="rounded-2xl border border-line bg-surface p-4">
              <p className="mb-3 text-xs font-semibold text-faint uppercase tracking-wider">{label}</p>
              <div className="space-y-2">
                {changedFields.map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-elevated p-3">
                    <p className="text-[0.65rem] text-faint capitalize mb-1">{k}</p>
                    {v.from != null && (
                      <p className="text-xs text-coral line-through mb-0.5">{String(v.from)}</p>
                    )}
                    {v.to != null && (
                      <p className="text-xs text-green">{String(v.to)}</p>
                    )}
                    {v.to == null && (
                      <p className="text-xs text-faint italic">removed</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // Lists — count diff (experience/education/projects)
        if (d.from_count !== undefined) {
          const increased = (d.to_count ?? 0) > (d.from_count ?? 0);
          return (
            <div key={field} className="rounded-2xl border border-line bg-surface p-4">
              <p className="mb-3 text-xs font-semibold text-faint uppercase tracking-wider">{label}</p>
              <div className="flex items-center gap-3">
                <span className="text-sm text-coral">{d.from_count} items</span>
                <ChevronRight className="h-4 w-4 text-faint" />
                <span className={`text-sm font-semibold ${increased ? "text-green" : "text-coral"}`}>
                  {d.to_count} items
                </span>
                <span className={`text-xs rounded-full px-2 py-0.5 ${increased ? "bg-green/10 text-green" : "bg-coral/10 text-coral"}`}>
                  {increased ? `+${(d.to_count ?? 0) - (d.from_count ?? 0)}` : `${(d.to_count ?? 0) - (d.from_count ?? 0)}`}
                </span>
              </div>
            </div>
          );
        }

        // Simple text diff
        return (
          <div key={field} className="rounded-2xl border border-line bg-surface p-4">
            <p className="mb-3 text-xs font-semibold text-faint uppercase tracking-wider">{label}</p>
            <div className="space-y-2">
              {d.from != null && (
                <div className="rounded-xl bg-coral/5 border border-coral/20 px-3 py-2">
                  <p className="text-[0.6rem] text-coral font-semibold mb-1">BEFORE</p>
                  <p className="text-xs text-coral">{String(d.from)}</p>
                </div>
              )}
              {d.to != null && (
                <div className="rounded-xl bg-green/5 border border-green/20 px-3 py-2">
                  <p className="text-[0.6rem] text-green font-semibold mb-1">AFTER</p>
                  <p className="text-xs text-green">{String(d.to)}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function CvComparePage({ fromId, toId }: { fromId: number; toId: number }) {
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["cv-compare", fromId, toId],
    queryFn: () => cvApi.compare(fromId, toId),
    staleTime: 60_000,
  });

  return (
    <div className="min-h-screen bg-bg-1">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 border-b border-line bg-bg-2/95 backdrop-blur-sm">
        <Container className="py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-sm text-muted hover:border-brand hover:text-brand"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-faint" />
                <span className="font-display text-base font-bold tracking-tight">Compare CVs</span>
                {data && (
                  <div className="flex items-center gap-1.5">
                    <TypeBadge type={data.versions.from.type} />
                    <span className="text-xs text-faint">v{data.versions.from.version}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-faint" />
                    <TypeBadge type={data.versions.to.type} />
                    <span className="text-xs text-faint">v{data.versions.to.version}</span>
                  </div>
                )}
              </div>
            </div>
            {data?.diff_note && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-amber">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-1">{data.diff_note}</span>
              </div>
            )}
          </div>
        </Container>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-32">
          <Loader2 className="h-7 w-7 animate-spin text-brand" />
          <p className="mt-4 text-sm text-muted">Loading comparison…</p>
        </div>
      ) : isError || !data ? (
        <Container className="py-20 text-center text-sm text-muted">
          Could not load comparison. The two CVs may not belong to you.
        </Container>
      ) : (
        <Container className="py-6">
          {/* Mobile diff note */}
          {data.diff_note && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-amber/30 bg-amber/5 px-4 py-3 md:hidden">
              <AlertTriangle className="h-4 w-4 text-amber shrink-0 mt-0.5" />
              <p className="text-xs text-amber">{data.diff_note}</p>
            </div>
          )}

          {/* Three-column layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px_1fr]">

            {/* LEFT — Before (from) */}
            <div>
              <div className="mb-4 flex items-center gap-2 pb-3 border-b border-line">
                <span className="text-base font-bold">Before</span>
                <TypeBadge type={data.versions.from.type} />
                <span className="text-xs text-faint">v{data.versions.from.version}</span>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-6">
                <SideView side={data.from} />
              </div>
            </div>

            {/* CENTER — Diff */}
            <div>
              <div className="mb-4 pb-3 border-b border-line">
                <span className="text-base font-bold">Changes</span>
              </div>
              <DiffPanel diff={data.diff} />
            </div>

            {/* RIGHT — After (to) */}
            <div>
              <div className="mb-4 flex items-center gap-2 pb-3 border-b border-line">
                <span className="text-base font-bold">After</span>
                <TypeBadge type={data.versions.to.type} />
                <span className="text-xs text-faint">v{data.versions.to.version}</span>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-6">
                <SideView side={data.to} />
              </div>
            </div>
          </div>
        </Container>
      )}
    </div>
  );
}