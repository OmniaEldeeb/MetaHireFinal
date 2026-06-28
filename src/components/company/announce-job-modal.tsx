"use client";

/**
 * AnnounceJobModal — lets a company/HR user post a job opening to the feed.
 * Sends POST /api/posts with { type: "job_share", shared_job_id, content,
 * visibility }; the backend embeds the job card in the resulting post.
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, X, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { socialApi } from "@/lib/api/endpoints/social";
import { useToastStore } from "@/stores/toast.store";

export function AnnounceJobModal({
  jobId,
  jobTitle,
  onClose,
}: {
  jobId: number;
  jobTitle: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);
  const [content, setContent] = useState(
    `We're hiring! Join our team as ${jobTitle} 🚀`,
  );
  const [visibility, setVisibility] = useState("public");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("type", "job_share");
      fd.append("shared_job_id", String(jobId));
      fd.append("content", content);
      fd.append("visibility", visibility);
      await socialApi.createPost(fd);
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast({ kind: "success", title: "Shared to feed" });
      onClose();
    } catch {
      toast({ kind: "error", title: "Couldn't share", message: "Please try again." });
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
        className="modal-in relative w-full max-w-lg overflow-hidden rounded-3xl border border-line2 bg-bg-2 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
            <Megaphone className="h-5 w-5 text-brand" />
            Announce to feed
          </h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-faint hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full resize-none rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand"
            placeholder="Write something about this role…"
          />
          <div className="flex items-center gap-2 text-sm">
            <label className="text-muted">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="h-9 rounded-lg border border-line bg-surface px-2 text-sm outline-none focus:border-brand"
            >
              <option value="public">Public</option>
              <option value="connections">Connections</option>
            </select>
          </div>
          <p className="text-xs text-faint">
            This posts the job card to the feed where people can see it and apply.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={busy || !content.trim()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
            Share to feed
          </Button>
        </div>
      </div>
    </div>
  );
}