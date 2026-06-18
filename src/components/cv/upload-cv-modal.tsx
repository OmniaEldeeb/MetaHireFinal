"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cvApi } from "@/lib/api/endpoints/cv";
import { useToastStore } from "@/stores/toast.store";

export function UploadCvModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [useAi, setUseAi] = useState(true);
  const [busy, setBusy] = useState(false);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    try {
      await cvApi.upload(file, useAi);
      qc.invalidateQueries({ queryKey: ["cvs"] });
      toast({
        kind: "success",
        title: useAi ? "CV uploaded — AI analysis starting…" : "CV uploaded",
      });
      onClose();
    } catch {
      toast({ kind: "error", title: "Upload failed", message: "Check the file is PDF or DOCX ≤ 10 MB." });
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
        className="modal-in w-full max-w-md rounded-3xl border border-line2 bg-bg-2 p-8 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold tracking-tight">
            Upload a CV
          </h2>
          <button onClick={onClose} className="text-faint hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drop zone */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-6 flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-line2 bg-elevated px-4 py-10 text-center transition-colors hover:border-brand"
        >
          {file ? (
            <>
              <FileText className="h-8 w-8 text-brand" />
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-faint" />
              <p className="text-sm text-muted">
                Click to pick a file
                <br />
                <span className="text-xs">PDF or DOCX · max 10 MB</span>
              </p>
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf"
          className="hidden"
          onChange={pick}
        />

        <div className="mt-5 flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
          <div>
            <p className="text-sm font-medium">Run AI analysis</p>
            <p className="text-xs text-muted">Get a score, strengths, and suggestions.</p>
          </div>
          <Switch checked={useAi} onChange={setUseAi} />
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button className="flex-1" onClick={upload} disabled={!file || busy}>
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
