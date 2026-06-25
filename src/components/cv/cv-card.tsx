"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Star,
  MoreVertical,
  Download,
  Pencil,
  RefreshCw,
  Trash2,
  BarChart2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { cvApi, type Cv } from "@/lib/api/endpoints/cv";
import { CvBuildModal } from "@/components/cv/cv-build-modal";
import { useToastStore } from "@/stores/toast.store";

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const TYPE_LABELS: Record<string, string> = {
  uploaded: "Uploaded",
  built: "AI built",
  rebuilt: "AI rebuilt",
};

interface CvCardProps {
  cv: Cv;
  onViewReport: (id: number) => void;
  onRestore?: (id: number) => void;
  inTrash?: boolean;
  isFavorite?: boolean; // passed from parent which cross-references favorites list
}

export function CvCard({ cv, onViewReport, onRestore, inTrash, isFavorite = false }: CvCardProps) {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(cv.name ?? cv.original_filename ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [showBuild, setShowBuild] = useState(false);
  // Optimistic local favorite state so star toggles instantly
  const [localFav, setLocalFav] = useState<boolean | null>(null);
  const starred = localFav !== null ? localFav : isFavorite;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["cvs"] });
    qc.invalidateQueries({ queryKey: ["cv-trash"] });
    qc.invalidateQueries({ queryKey: ["cv-favorites"] });
  };

  const toggleFav = async () => {
    // Optimistic update — flip the star immediately
    setLocalFav(!starred);
    try {
      await cvApi.toggleFavorite(cv.id);
      refresh();
    } catch {
      // Revert on error
      setLocalFav(starred);
      toast({ kind: "error", title: "Couldn't update favourite" });
    }
  };

  const download = () => {
    setMenuOpen(false);
    setShowBuild(true);
  };

  const doRename = async () => {
    if (!nameInput.trim()) return;
    try {
      await cvApi.rename(cv.id, nameInput.trim());
      refresh();
      toast({ kind: "success", title: "Renamed" });
    } catch {
      toast({ kind: "error", title: "Rename failed" });
    } finally {
      setRenaming(false);
    }
  };

  const doRebuild = async () => {
    setBusy("rebuild");
    setMenuOpen(false);
    try {
      await cvApi.rebuild(cv.id);
      refresh();
      toast({ kind: "success", title: "Re-running AI analysis…" });
    } catch {
      toast({ kind: "error", title: "Rebuild failed" });
    } finally {
      setBusy(null);
    }
  };

  const doDelete = async () => {
    setMenuOpen(false);
    try {
      await cvApi.softDelete(cv.id);
      refresh();
      toast({ kind: "success", title: "Moved to Trash" });
    } catch {
      toast({ kind: "error", title: "Delete failed" });
    }
  };

  const doRestore = async () => {
    if (!onRestore) return;
    try {
      await cvApi.restore(cv.id);
      refresh();
      toast({ kind: "success", title: "Restored" });
    } catch {
      toast({ kind: "error", title: "Restore failed" });
    }
  };

  return (
    <>
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border bg-surface p-5 transition-all",
        inTrash ? "border-coral/30" : "border-line hover:-translate-y-0.5 hover:shadow-soft",
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
          <FileText className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          {renaming ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") doRename();
                  if (e.key === "Escape") setRenaming(false);
                }}
                className="h-8 flex-1 rounded-lg border border-brand bg-surface px-2 text-sm outline-none"
              />
              <button onClick={doRename} className="text-brand hover:underline text-sm">Save</button>
              <button onClick={() => setRenaming(false)} className="text-faint"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <p className="truncate text-sm font-semibold">
              {cv.name ?? cv.original_filename ?? `CV #${cv.id}`}
            </p>
          )}
          <div className="mt-0.5 flex items-center gap-2">
            {cv.type ? (
              <span className="readout text-[0.65rem] uppercase tracking-wider text-faint">
                {TYPE_LABELS[cv.type] ?? cv.type}
              </span>
            ) : null}
            {cv.language ? (
              <span className="readout text-[0.65rem] uppercase text-faint">
                · {cv.language.toUpperCase()}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleFav}
            aria-label="Favourite"
            className={cn(
              "grid h-8 w-8 place-items-center rounded-lg transition-colors hover:bg-elevated",
              starred ? "text-amber" : "text-faint",
            )}
          >
            <Star className={cn("h-4 w-4", starred && "fill-current")} />
          </button>

          {!inTrash && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="grid h-8 w-8 place-items-center rounded-lg text-faint hover:bg-elevated hover:text-ink"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-2xl border border-line2 bg-surface shadow-lift">
                    {[
                      { icon: Download, label: "Export CV", action: () => download() },
                      { icon: BarChart2, label: "View report", action: () => { setMenuOpen(false); onViewReport(cv.id); } },
                      { icon: Pencil, label: "Rename", action: () => { setMenuOpen(false); setRenaming(true); } },
                      { icon: RefreshCw, label: "Rebuild AI", action: doRebuild },
                      { icon: Trash2, label: "Delete", action: doDelete },
                    ].map(({ icon: Icon, label, action }) => (
                      <button
                        key={label}
                        onClick={action}
                        disabled={busy !== null}
                        className={cn(
                          "flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-elevated disabled:opacity-50",
                          label === "Delete" && "text-coral",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-faint">
        <span>{formatDate(cv.created_at)}</span>
        {inTrash ? (
          <button
            onClick={doRestore}
            className="font-medium text-brand hover:underline"
          >
            Restore
          </button>
        ) : busy === "download" ? (
          <span className="text-muted">Preparing…</span>
        ) : null}
      </div>
    </div>
    {showBuild && <CvBuildModal cvId={cv.id} onClose={() => setShowBuild(false)} />}
  </>
  );
}