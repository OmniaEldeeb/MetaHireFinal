"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, Wand2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cvApi, blobDownload } from "@/lib/api/endpoints/cv";
import { useToastStore } from "@/stores/toast.store";
import { imgUrl } from "@/lib/utils";

export function BuildCvModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);
  const [format, setFormat] = useState<"pdf" | "docx">("pdf");
  const [template, setTemplate] = useState("nova");
  const [jobDesc, setJobDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const templates = useQuery({
    queryKey: ["cv-templates"],
    queryFn: cvApi.templates,
    staleTime: 1000 * 60 * 30,
  });
  const tpl = templates.data ?? [];

  const build = async () => {
    setBusy(true);
    try {
      const blob = await cvApi.buildFromProfile({
        format,
        template,
        job_description: jobDesc.trim() || undefined,
      });
      blobDownload(blob, `metahire-cv.${format}`);
      qc.invalidateQueries({ queryKey: ["cvs"] });
      setDone(true);
      toast({ kind: "success", title: "CV generated and downloading!" });
    } catch {
      toast({
        kind: "error",
        title: "Build failed",
        message: "Make sure your profile is complete first.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="modal-in w-full max-w-lg rounded-3xl border border-line2 bg-bg-2 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-display text-xl font-bold tracking-tight">
            Build CV from profile
          </h2>
          <button onClick={onClose} className="text-faint hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-green" />
              <p className="font-display text-lg font-bold">
                Your CV is downloading!
              </p>
              <p className="text-sm text-muted">
                It&apos;s also been saved to your CV library.
              </p>
              <Button onClick={onClose} variant="outline" className="mt-2">
                Close
              </Button>
            </div>
          ) : (
            <>
              {/* Template */}
              <div>
                <p className="mb-3 text-sm font-medium">Template</p>
                {templates.isLoading ? (
                  <div className="grid place-items-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-brand" />
                  </div>
                ) : tpl.length === 0 ? (
                  /* Fallback when API returns empty — show sensible defaults */
                  <div className="grid grid-cols-2 gap-3">
                    {["nova", "classic"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTemplate(t)}
                        className={`rounded-xl border p-3 capitalize text-sm font-medium transition-all ${
                          template === t
                            ? "border-brand bg-brand-soft text-brand"
                            : "border-line hover:border-brand/40"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {tpl.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTemplate(t.id)}
                        className={`overflow-hidden rounded-xl border transition-all ${
                          template === t.id
                            ? "border-brand shadow-glow"
                            : "border-line hover:border-brand/40"
                        }`}
                      >
                        {t.preview_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imgUrl(t.preview_url) ?? ""}
                            alt={t.name}
                            className="h-28 w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-28 place-items-center bg-elevated text-sm font-medium capitalize">
                            {t.name}
                          </div>
                        )}
                        <p className="py-2 text-center text-xs font-medium">
                          {t.name}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Format */}
              <div>
                <p className="mb-3 text-sm font-medium">Format</p>
                <div className="flex gap-2">
                  {(["pdf", "docx"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`h-10 rounded-xl border px-4 text-sm font-medium uppercase transition-colors ${
                        format === f
                          ? "border-brand bg-brand-soft text-brand"
                          : "border-line hover:border-brand/40"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional job description */}
              <Field
                label="Tailor to job description"
                htmlFor="jd"
                optional
                hint="Paste a job description to tailor your CV's language and keywords."
              >
                <Textarea
                  id="jd"
                  rows={4}
                  placeholder="We are looking for a Senior Laravel Developer…"
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                />
              </Field>

              <Button
                className="w-full"
                onClick={build}
                disabled={busy}
                size="lg"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Building…
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Generate &amp; download
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
