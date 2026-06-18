"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  Wand2,
  Loader2,
  FileText,
  Trash2,
  Star,
} from "lucide-react";
import { Container } from "@/components/ui/section";
import { CvCardSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { CvCard } from "@/components/cv/cv-card";
import { UploadCvModal } from "@/components/cv/upload-cv-modal";
import { BuildCvModal } from "@/components/cv/build-cv-modal";
import { CvReportModal } from "@/components/cv/cv-report-modal";
import { cvApi } from "@/lib/api/endpoints/cv";
import { useToastStore } from "@/stores/toast.store";

const TABS = [
  { key: "library", label: "Library" },
  { key: "favorites", label: "Favourites" },
  { key: "trash", label: "Trash" },
];

export function CvManager() {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);
  const [tab, setTab] = useState("library");
  const [showUpload, setShowUpload] = useState(false);
  const [showBuild, setShowBuild] = useState(false);
  const [reportCvId, setReportCvId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const cvs = useQuery({ queryKey: ["cvs"], queryFn: cvApi.list });
  const favs = useQuery({
    queryKey: ["cv-favorites"],
    queryFn: cvApi.favorites,
    // Always fetch so we know which CVs are starred, even on the "all" tab
  });
  // Build a Set of favorite CV ids for O(1) lookup
  const favoriteIds = new Set((favs.data ?? []).map((cv) => cv.id));
  const trash = useQuery({
    queryKey: ["cv-trash"],
    queryFn: cvApi.trash,
    enabled: tab === "trash",
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["cvs"] });
    qc.invalidateQueries({ queryKey: ["cv-favorites"] });
    qc.invalidateQueries({ queryKey: ["cv-trash"] });
  };

  const items =
    tab === "favorites"
      ? (favs.data ?? [])
      : tab === "trash"
        ? (trash.data ?? [])
        : (cvs.data ?? []);
  const isLoading =
    tab === "favorites" ? favs.isLoading : tab === "trash" ? trash.isLoading : cvs.isLoading;

  const toggleSelect = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const bulkDelete = async () => {
    if (!selected.size) return;
    try {
      await cvApi.bulkDelete([...selected]);
      setSelected(new Set());
      refresh();
      toast({ kind: "success", title: `${selected.size} CV(s) deleted` });
    } catch {
      toast({ kind: "error", title: "Bulk delete failed" });
    }
  };

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            My CVs
          </h1>
          <p className="mt-1 text-sm text-muted">
            Upload, build, score, and manage your CV library.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUpload(true)}
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
          <Button size="sm" onClick={() => setShowBuild(true)}>
            <Wand2 className="h-4 w-4" />
            Build with AI
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <Tabs tabs={TABS} active={tab} onChange={(k) => { setTab(k); setSelected(new Set()); }} />
        {selected.size > 0 && (
          <button
            onClick={bulkDelete}
            className="inline-flex items-center gap-1.5 rounded-xl border border-coral/40 px-3 py-2 text-sm font-medium text-coral hover:bg-coral/10"
          >
            <Trash2 className="h-4 w-4" />
            Delete {selected.size}
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="mt-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({length:3}).map((_,i)=><CvCardSkeleton key={i}/>)}</div>
        ) : items.length === 0 ? (
          <div className="grid place-items-center gap-3 py-20 text-center">
            {tab === "trash" ? (
              <Trash2 className="h-8 w-8 text-faint" />
            ) : tab === "favorites" ? (
              <Star className="h-8 w-8 text-faint" />
            ) : (
              <FileText className="h-8 w-8 text-faint" />
            )}
            <p className="text-sm text-muted">
              {tab === "trash"
                ? "Trash is empty."
                : tab === "favorites"
                  ? "No favourites yet — star a CV to pin it here."
                  : "No CVs yet. Upload or build one to get started."}
            </p>
            {tab === "library" && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowUpload(true)}>
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
                <Button size="sm" onClick={() => setShowBuild(true)}>
                  <Wand2 className="h-4 w-4" />
                  Build with AI
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((cv) => (
              <div key={cv.id} className="relative">
                {tab === "library" && (
                  <input
                    type="checkbox"
                    aria-label="Select"
                    checked={selected.has(cv.id)}
                    onChange={() => toggleSelect(cv.id)}
                    className="absolute left-3 top-3 z-10 h-4 w-4 cursor-pointer accent-brand"
                  />
                )}
                <CvCard
                  cv={cv}
                  isFavorite={favoriteIds.has(cv.id)}
                  inTrash={tab === "trash"}
                  onViewReport={setReportCvId}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {showUpload && <UploadCvModal onClose={() => setShowUpload(false)} />}
      {showBuild && <BuildCvModal onClose={() => setShowBuild(false)} />}
      {reportCvId !== null && (
        <CvReportModal cvId={reportCvId} onClose={() => setReportCvId(null)} />
      )}
    </Container>
  );
}
