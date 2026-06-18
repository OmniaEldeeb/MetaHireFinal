"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/section";
import { JobsGridSkeleton } from "@/components/ui/skeleton";
import { JobCard } from "@/components/jobs/job-card";
import { jobsApi, normalizeJobs } from "@/lib/api/endpoints/jobs";
import { useDebounced } from "@/lib/hooks/use-debounce";
import {
  WORK_TYPE,
  WORK_MODEL,
  EXPERIENCE_LEVEL,
} from "@/lib/constants/enums";
import {
  WORK_TYPE_LABELS,
  WORK_MODEL_LABELS,
  EXPERIENCE_LEVEL_LABELS,
} from "@/lib/constants/labels";

const selectCls =
  "h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand";

export function JobsBoard() {
  const router = useRouter();
  const sp = useSearchParams();

  const get = (k: string) => sp.get(k) ?? "";
  const page = Number(sp.get("page") ?? 1);

  const paramObj = useMemo(
    () => ({
      search: get("search") || undefined,
      work_type: get("work_type") || undefined,
      work_model: get("work_model") || undefined,
      level: get("level") || undefined,
      location: get("location") || undefined,
      category_id: get("category_id") || undefined,
      active_only: get("active_only") || undefined,
      page,
      per_page: 12,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sp.toString()],
  );

  const update = (patch: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, String(v));
    }
    if (!("page" in patch)) next.delete("page");
    router.replace(`/jobs?${next.toString()}`, { scroll: false });
  };

  // Debounced search
  const [searchInput, setSearchInput] = useState(get("search"));
  const debouncedSearch = useDebounced(searchInput, 400);
  useEffect(() => {
    if (debouncedSearch !== get("search")) {
      update({ search: debouncedSearch || undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: jobsApi.categories,
    staleTime: 1000 * 60 * 30,
  });

  const jobsQuery = useQuery({
    queryKey: ["jobs", paramObj],
    queryFn: () => jobsApi.list(paramObj),
  });

  const { items, lastPage, total } = normalizeJobs(jobsQuery.data);

  const hasFilters =
    !!get("search") ||
    !!get("work_type") ||
    !!get("work_model") ||
    !!get("level") ||
    !!get("location") ||
    !!get("category_id") ||
    !!get("active_only");

  const clearAll = () => {
    setSearchInput("");
    router.replace("/jobs", { scroll: false });
  };

  return (
    <Container className="py-10">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Find your next role
        </h1>
        <p className="mt-2 text-muted">
          Browse open positions and apply with an AI-scored profile.
        </p>
      </div>

      {/* Search + filters */}
      <div className="mt-8 rounded-2xl border border-line bg-surface p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search title or keyword…"
            className="h-11 w-full rounded-xl border border-line bg-bg-2 pl-10 pr-3 text-sm outline-none focus:border-brand"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-faint" />
          <select
            className={selectCls}
            value={get("work_type")}
            onChange={(e) => update({ work_type: e.target.value })}
          >
            <option value="">Any type</option>
            {WORK_TYPE.map((t) => (
              <option key={t} value={t}>
                {WORK_TYPE_LABELS[t]}
              </option>
            ))}
          </select>

          <select
            className={selectCls}
            value={get("work_model")}
            onChange={(e) => update({ work_model: e.target.value })}
          >
            <option value="">Any model</option>
            {WORK_MODEL.map((t) => (
              <option key={t} value={t}>
                {WORK_MODEL_LABELS[t]}
              </option>
            ))}
          </select>

          <select
            className={selectCls}
            value={get("level")}
            onChange={(e) => update({ level: e.target.value })}
          >
            <option value="">Any level</option>
            {EXPERIENCE_LEVEL.map((t) => (
              <option key={t} value={t}>
                {EXPERIENCE_LEVEL_LABELS[t]}
              </option>
            ))}
          </select>

          <select
            className={selectCls}
            value={get("category_id")}
            onChange={(e) => update({ category_id: e.target.value })}
          >
            <option value="">Any category</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            value={get("location")}
            onChange={(e) => update({ location: e.target.value || undefined })}
            placeholder="Location"
            className="h-10 w-36 rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-brand"
          />

          <label className="flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm">
            <input
              type="checkbox"
              checked={get("active_only") === "true"}
              onChange={(e) =>
                update({ active_only: e.target.checked ? "true" : undefined })
              }
              className="accent-brand"
            />
            Active only
          </label>

          {hasFilters ? (
            <button
              onClick={clearAll}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-muted hover:text-ink"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {/* Results */}
      <div className="mt-6">
        {jobsQuery.isLoading ? (
          <JobsGridSkeleton count={6} />
        ) : jobsQuery.isError ? (
          <p className="py-20 text-center text-sm text-muted">
            Couldn&apos;t load jobs. Please try again.
          </p>
        ) : items.length === 0 ? (
          <div className="grid place-items-center gap-2 py-20 text-center">
            <Search className="h-7 w-7 text-faint" />
            <p className="text-sm text-muted">No jobs match your filters.</p>
            {hasFilters ? (
              <button
                onClick={clearAll}
                className="text-sm font-medium text-brand hover:underline"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-faint">
              {total} {total === 1 ? "result" : "results"}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {lastPage > 1 ? (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  disabled={page <= 1}
                  onClick={() => update({ page: page - 1 })}
                  className="inline-flex h-10 items-center gap-1 rounded-xl border border-line2 bg-surface px-4 text-sm disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>
                <span className="readout text-sm text-muted">
                  {page} / {lastPage}
                </span>
                <button
                  disabled={page >= lastPage}
                  onClick={() => update({ page: page + 1 })}
                  className="inline-flex h-10 items-center gap-1 rounded-xl border border-line2 bg-surface px-4 text-sm disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </Container>
  );
}
