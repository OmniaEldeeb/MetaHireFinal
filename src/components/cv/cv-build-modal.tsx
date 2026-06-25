"use client";

/**
 * CV Build Modal
 * Lets the user pick:
 *   - Format: HTML (preview inline) · PDF (download) · DOCX (download)
 *   - Template: nova, meridian, impact, executive, ats, harvard, hybrid, corporate
 *   - Photo upload (only for templates that support it — currently "nova")
 *
 * Endpoints used (confirmed from CvController):
 *   POST /cv/{id}/build  { format, template, photo_base64? }
 *     html  → JSON { type:"html", template, html:"<!DOCTYPE..." }
 *     pdf   → binary blob
 *     docx  → binary blob
 *   POST /cv/photo       { photo: File } → { photo_base64: string }
 */

import { useState, useRef } from "react";
import {
  X, Loader2, Download, Eye, Globe, FileText, Camera, Check,
} from "lucide-react";
import { cvApi, blobDownload } from "@/lib/api/endpoints/cv";
import { useToastStore } from "@/stores/toast.store";

const TEMPLATES = [
  { id: "ats",       label: "ATS",       desc: "Plain, ATS-safe, no graphics" },
  { id: "nova",      label: "Nova",       desc: "Modern with photo support" },
  { id: "meridian",  label: "Meridian",  desc: "Clean two-column" },
  { id: "impact",    label: "Impact",    desc: "Bold executive style" },
  { id: "executive", label: "Executive", desc: "Traditional professional" },
  { id: "harvard",   label: "Harvard",   desc: "Academic format" },
  { id: "hybrid",    label: "Hybrid",    desc: "Creative professional" },
  { id: "corporate", label: "Corporate", desc: "Formal corporate layout" },
];

// Templates that support a photo
const PHOTO_TEMPLATES = new Set(["nova"]);

const FORMATS = [
  { id: "html",  label: "HTML Preview", icon: Globe,    desc: "View in browser" },
  { id: "pdf",   label: "PDF",          icon: FileText, desc: "Download PDF" },
  { id: "docx",  label: "Word (DOCX)",  icon: FileText, desc: "Download DOCX" },
];

export function CvBuildModal({ cvId, onClose }: { cvId: number; onClose: () => void }) {
  const toast = useToastStore((s) => s.push);
  const fileRef = useRef<HTMLInputElement>(null);

  const [format, setFormat] = useState<"html" | "pdf" | "docx">("html");
  const [template, setTemplate] = useState("ats");
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [building, setBuilding] = useState(false);
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);

  const needsPhoto = PHOTO_TEMPLATES.has(template);

  // Upload photo → get base64 from backend
  const handlePhoto = async (file: File) => {
    setUploadingPhoto(true);
    setPhotoPreview(URL.createObjectURL(file));
    try {
      const res = await cvApi.uploadPhoto(file);
      setPhotoBase64(res.photo_base64);
      toast({ kind: "success", title: "Photo ready" });
    } catch {
      toast({ kind: "error", title: "Photo upload failed" });
      setPhotoPreview(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleBuild = async () => {
    setBuilding(true);
    setHtmlPreview(null);
    try {
      if (format === "html") {
        const res = await cvApi.buildHtml(cvId, {
          template,
          photo_base64: photoBase64 ?? undefined,
        });
        setHtmlPreview(res.html);
      } else {
        const blob = await cvApi.build(cvId, {
          format,
          template,
          photo_base64: photoBase64 ?? undefined,
        });
        const ext = format === "pdf" ? "pdf" : "docx";
        blobDownload(blob, `cv-${cvId}-${template}.${ext}`);
        toast({ kind: "success", title: `CV downloaded as ${ext.toUpperCase()}` });
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast({ kind: "error", title: "Build failed", message: e?.message });
    } finally {
      setBuilding(false);
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
          <h2 className="font-display text-lg font-bold tracking-tight">Export CV</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-faint hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Only show config when no HTML preview yet */}
        {!htmlPreview ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Format picker */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-faint">Format</p>
              <div className="grid grid-cols-3 gap-3">
                {FORMATS.map(({ id, label, icon: Icon, desc }) => (
                  <button
                    key={id}
                    onClick={() => { setFormat(id as typeof format); setHtmlPreview(null); }}
                    className={`rounded-2xl border p-4 text-left transition-colors ${
                      format === id
                        ? "border-brand bg-brand-soft"
                        : "border-line hover:border-brand/50"
                    }`}
                  >
                    <Icon className={`h-5 w-5 mb-2 ${format === id ? "text-brand" : "text-muted"}`} />
                    <p className={`text-sm font-semibold ${format === id ? "text-brand" : "text-ink"}`}>{label}</p>
                    <p className="text-xs text-muted mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Template picker */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-faint">Template</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TEMPLATES.map(({ id, label, desc }) => (
                  <button
                    key={id}
                    onClick={() => { setTemplate(id); setHtmlPreview(null); }}
                    className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      template === id
                        ? "border-brand bg-brand-soft"
                        : "border-line hover:border-brand/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold ${template === id ? "text-brand" : "text-ink"}`}>{label}</p>
                      {template === id && <Check className="h-3.5 w-3.5 text-brand" />}
                    </div>
                    <p className="text-[0.65rem] text-muted mt-0.5">{desc}</p>
                    {PHOTO_TEMPLATES.has(id) && (
                      <span className="mt-1 inline-block rounded-full bg-amber/10 px-1.5 py-0.5 text-[0.6rem] font-medium text-amber">
                        Photo
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo upload — only for photo-supporting templates */}
            {needsPhoto && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-faint">
                  Profile photo <span className="normal-case font-normal">(optional — for {template} template)</span>
                </p>
                <div className="flex items-center gap-4">
                  <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-line bg-elevated">
                    {photoPreview
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={photoPreview} alt="" className="h-full w-full object-cover" />
                      : <Camera className="h-6 w-6 text-faint" />}
                  </div>
                  <div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handlePhoto(f);
                      }}
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium hover:border-brand hover:text-brand disabled:opacity-60"
                    >
                      {uploadingPhoto
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Camera className="h-4 w-4" />}
                      {photoPreview ? "Change photo" : "Upload photo"}
                    </button>
                    <p className="mt-1 text-xs text-faint">JPEG, PNG or WebP · max 3 MB</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* HTML Preview */
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-6 py-3 border-b border-line flex items-center justify-between shrink-0 bg-elevated">
              <p className="text-sm font-medium text-ink">HTML Preview — {TEMPLATES.find(t => t.id === template)?.label}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setHtmlPreview(null)}
                  className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium hover:bg-surface"
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([htmlPreview], { type: "text/html" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `cv-${cvId}-${template}.html`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-strong"
                >
                  <Download className="h-3.5 w-3.5" /> Download HTML
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-white">
              <iframe
                srcDoc={htmlPreview}
                className="w-full h-full"
                style={{ minHeight: "500px", border: "none" }}
                title="CV Preview"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        {!htmlPreview && (
          <div className="border-t border-line px-6 py-4 shrink-0 flex items-center justify-between gap-4">
            <p className="text-xs text-faint">
              {format === "html"
                ? "Preview your CV in the browser as HTML"
                : `Download your CV as ${format.toUpperCase()}`}
            </p>
            <button
              onClick={handleBuild}
              disabled={building || uploadingPhoto}
              className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
            >
              {building
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : format === "html"
                  ? <Eye className="h-4 w-4" />
                  : <Download className="h-4 w-4" />}
              {format === "html" ? "Preview" : `Download ${format.toUpperCase()}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}