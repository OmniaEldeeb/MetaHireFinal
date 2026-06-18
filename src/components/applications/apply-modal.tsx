"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, FileText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cvApi } from "@/lib/api/endpoints/cv";
import { candidateApplicationsApi } from "@/lib/api/endpoints/applications";
import { useToastStore } from "@/stores/toast.store";
import { ApiException } from "@/lib/api/types";

interface ApplyModalProps {
  jobId: number;
  jobTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ApplyModal({ jobId, jobTitle, onClose, onSuccess }: ApplyModalProps) {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);
  const [cvId, setCvId] = useState<number | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const cvs = useQuery({ queryKey: ["cvs"], queryFn: cvApi.list });

  const apply = async () => {
    if (!cvId) return;
    setBusy(true);
    setErr(null);
    try {
      await candidateApplicationsApi.apply(jobId, {
        cv_id: cvId,
        cover_letter: coverLetter.trim() || undefined,
      });
      qc.invalidateQueries({ queryKey: ["applications"] });
      toast({ kind: "success", title: "Application submitted!" });
      onSuccess?.();
      onClose();
    } catch (e) {
      if (e instanceof ApiException && e.status === 400) {
        setErr(e.message);
      } else {
        setErr("Something went wrong. Please try again.");
      }
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
            Apply for this role
          </h2>
          <button onClick={onClose} className="text-faint hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <p className="text-sm text-muted">
            Applying to{" "}
            <span className="font-medium text-ink">{jobTitle}</span>
          </p>

          {err && (
            <div className="rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
              {err}
            </div>
          )}

          {/* CV picker */}
          <div>
            <p className="mb-2 text-sm font-medium">Choose a CV</p>
            {cvs.isLoading ? (
              <div className="grid place-items-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-brand" />
              </div>
            ) : (cvs.data ?? []).length === 0 ? (
              <div className="rounded-xl border border-line bg-elevated px-4 py-4 text-center text-sm text-muted">
                No CVs yet.{" "}
                <a href="/cv" className="font-medium text-brand hover:underline">
                  Build or upload one first.
                </a>
              </div>
            ) : (
              <div className="max-h-52 space-y-2 overflow-y-auto">
                {(cvs.data ?? []).map((cv) => (
                  <button
                    key={cv.id}
                    onClick={() => setCvId(cv.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                      cvId === cv.id
                        ? "border-brand bg-brand-soft"
                        : "border-line hover:border-brand/40"
                    }`}
                  >
                    <FileText
                      className={`h-5 w-5 shrink-0 ${cvId === cv.id ? "text-brand" : "text-faint"}`}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {cv.name ?? cv.original_filename ?? `CV #${cv.id}`}
                      </p>
                      <p className="text-xs capitalize text-muted">{cv.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Field
            label="Cover letter"
            htmlFor="cover"
            optional
            hint="Max 3 000 characters."
          >
            <Textarea
              id="cover"
              rows={5}
              maxLength={3000}
              placeholder="I'm excited about this role because…"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
          </Field>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={apply}
              disabled={!cvId || busy}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit application
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
