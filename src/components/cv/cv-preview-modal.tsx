"use client";

/**
 * CvPreviewModal
 * ==============
 * Opened from the CV card's "Preview" action.
 *
 * - Formatted view: renders the CV as HTML via the API (cvApi.buildHtml) using a
 *   template chosen from the API list (cvApi.templates → nova/meridian/impact/executive).
 * - Original upload view: for CVs of type "uploaded", shows the user's actual
 *   uploaded file from cv.cv_url (inline iframe for PDFs, open/download otherwise).
 */

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, X, FileText, ExternalLink, Globe } from "lucide-react";
import { cvApi, type Cv } from "@/lib/api/endpoints/cv";

const FALLBACK_TEMPLATES = [
  { id: "nova", name: "Nova" },
  { id: "meridian", name: "Meridian" },
  { id: "impact", name: "Impact" },
  { id: "executive", name: "Executive" },
];

export function CvPreviewModal({ cv, onClose }: { cv: Cv; onClose: () => void }) {
  // An uploaded original file is present whenever the backend gives us a
  // cv_url (only set for CVs that have a stored file). This is independent of
  // the type label, which may be "original", "uploaded", etc.
  const hasOriginal = !!cv.cv_url;
  // CVs with a real uploaded file open on it first; generated CVs go straight
  // to the formatted template view.
  const [mode, setMode] = useState<"formatted" | "original">(
    hasOriginal ? "original" : "formatted",
  );

  const { data: templates } = useQuery({
    queryKey: ["cv-templates"],
    queryFn: cvApi.templates,
    staleTime: 5 * 60 * 1000,
  });
  const templateList = templates && templates.length ? templates : FALLBACK_TEMPLATES;

  const [template, setTemplate] = useState<string>("");
  useEffect(() => {
    if (!template && templateList.length) setTemplate(templateList[0].id);
  }, [templateList, template]);

  const { data: built, isLoading, isError } = useQuery({
    queryKey: ["cv-preview-html", cv.id, template],
    queryFn: () => cvApi.buildHtml(cv.id, { template }),
    enabled: mode === "formatted" && !!template,
    staleTime: 60 * 1000,
  });

  const isPdf = useMemo(() => {
    const s = `${cv.original_filename ?? ""} ${cv.cv_url ?? ""}`.toLowerCase();
    return s.includes(".pdf");
  }, [cv.original_filename, cv.cv_url]);

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="modal-in relative flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-line2 bg-bg-2 shadow-lift"
        style={{ maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4 shrink-0">
          <h2 className="font-display text-lg font-bold tracking-tight">Preview CV</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-faint hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-6 py-3 shrink-0">
          {hasOriginal && (
            <div className="flex rounded-xl border border-line p-0.5">
              <button
                onClick={() => setMode("original")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  mode === "original" ? "bg-brand-soft text-brand" : "text-muted hover:text-ink"
                }`}
              >
                <FileText className="h-3.5 w-3.5" /> Original upload
              </button>
              <button
                onClick={() => setMode("formatted")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  mode === "formatted" ? "bg-brand-soft text-brand" : "text-muted hover:text-ink"
                }`}
              >
                <Globe className="h-3.5 w-3.5" /> Formatted
              </button>
            </div>
          )}

          {mode === "formatted" && (
            <label className="flex items-center gap-2 text-xs text-muted">
              Template
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="h-9 rounded-lg border border-line bg-surface px-2 text-sm text-ink outline-none focus:border-brand"
              >
                {templateList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {mode === "original" && cv.cv_url && (
            <a
              href={cv.cv_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
            >
              Open in new tab <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden bg-elevated">
          {mode === "formatted" ? (
            isLoading || !template ? (
              <div className="grid h-full min-h-[55vh] place-items-center">
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
              </div>
            ) : isError ? (
              <div className="grid h-full min-h-[55vh] place-items-center px-6 text-center text-sm text-muted">
                Couldn&apos;t render this template. Try another one.
              </div>
            ) : (
              <iframe
                srcDoc={built?.html ?? ""}
                title="CV preview"
                className="h-[70vh] max-h-[78vh] w-full bg-white"
              />
            )
          ) : isPdf && cv.cv_url ? (
            <iframe
              src={cv.cv_url}
              title="Original CV"
              className="h-[70vh] max-h-[78vh] w-full bg-white"
            />
          ) : (
            <div className="grid h-full min-h-[55vh] place-items-center gap-3 px-6 text-center">
              <FileText className="h-10 w-10 text-faint" />
              <p className="text-sm text-muted">
                This file can&apos;t be previewed inline. You can open or download it instead.
              </p>
              {cv.cv_url && (
                <a
                  href={cv.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium hover:border-brand hover:text-brand"
                >
                  Open original file <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}