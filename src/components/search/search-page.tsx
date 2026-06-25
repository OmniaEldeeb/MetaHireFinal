"use client";

import { imgUrl } from "@/lib/utils";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Search, Briefcase, Users, Building2,
  Newspaper, Loader2, SlidersHorizontal, X,
} from "lucide-react";
import { Container } from "@/components/ui/section";
import { searchApi } from "@/lib/api/endpoints/search";
import { useDebounced } from "@/lib/hooks/use-debounce";
import {
  WORK_TYPE, WORK_MODEL, EXPERIENCE_LEVEL,
} from "@/lib/constants/enums";
import {
  WORK_TYPE_LABELS, WORK_MODEL_LABELS, EXPERIENCE_LEVEL_LABELS,
} from "@/lib/constants/labels";

const TYPE_TABS = [
  { key: "all", label: "All" },
  { key: "jobs", label: "Jobs", icon: Briefcase },
  { key: "users", label: "People", icon: Users },
  { key: "companies", label: "Companies", icon: Building2 },
  { key: "posts", label: "Posts", icon: Newspaper },
];

const selectCls =
  "h-9 rounded-xl border border-line bg-surface px-2.5 text-sm text-ink outline-none focus:border-brand";

function ResultSection({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: typeof Briefcase;
  count: number;
  children: React.ReactNode;
}) {
  if (!count) return null;
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold tracking-tight">
        <Icon className="h-4 w-4 text-brand" />
        {title}
        <span className="readout ml-auto text-xs text-faint">{count}</span>
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function SearchInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const get = (k: string) => sp.get(k) ?? "";

  const [inputVal, setInputVal] = useState(get("q"));
  const [type, setType] = useState(get("type") || "all");
  const [showFilters, setShowFilters] = useState(false);
  const debouncedQ = useDebounced(inputVal, 350);

  // Autocomplete
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sugOpen, setSugOpen] = useState(false);
  const sugQ = useDebounced(inputVal, 250);

  useEffect(() => {
    if (sugQ.length < 1) { setSuggestions([]); return; }
    searchApi.suggestions(sugQ).then((r) => {
      const flat: string[] = [];
      // Controller returns { jobs: [{title,...}], users: [{name,...}], companies: [{name,...}] }
      // Each group uses 'title' (jobs) or 'name' (users/companies) — NOT .label
      if (Array.isArray(r)) {
        r.forEach((s) => {
          const label = (s as { title?: string; name?: string }).title
            ?? (s as { name?: string }).name;
          if (label) flat.push(label);
        });
      } else {
        const groups = r as {
          jobs?: { title?: string }[];
          users?: { name?: string }[];
          companies?: { name?: string }[];
        };
        groups.jobs?.forEach((j) => j.title && flat.push(j.title));
        groups.users?.forEach((u) => u.name && flat.push(u.name));
        groups.companies?.forEach((c) => c.name && flat.push(c.name));
      }
      setSuggestions(flat.slice(0, 8));
    }).catch(() => {});
  }, [sugQ]);

  // Push to URL
  useEffect(() => {
    if (!debouncedQ) return;
    const next = new URLSearchParams(sp.toString());
    next.set("q", debouncedQ);
    next.set("type", type);
    router.replace(`/search?${next}`, { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, type]);

  const params = {
    q: get("q"),
    type: get("type") || "all",
    posted_within: get("posted_within") || undefined,
    location: get("location") || undefined,
    level: get("level") || undefined,
    work_model: get("work_model") || undefined,
    work_type: get("work_type") || undefined,
    per_page: 10,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["search", params],
    queryFn: () => searchApi.search(params),
    enabled: params.q.length >= 2,
  });

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => v ? next.set(k, v) : next.delete(k));
    router.replace(`/search?${next}`, { scroll: false });
  };

  const clearFilters = () => {
    router.replace(`/search?q=${encodeURIComponent(get("q"))}&type=${type}`, { scroll: false });
  };

  const hasFilters = get("posted_within") || get("location") || get("level") || get("work_model") || get("work_type");

  const jobs = data?.jobs ?? [];
  const users = data?.users ?? [];
  const companies = data?.companies ?? [];
  const posts = data?.posts ?? [];
  const totalResults = jobs.length + users.length + companies.length + posts.length;

  return (
    <Container className="py-8">
      <h1 className="mb-5 font-display text-2xl font-extrabold tracking-tight">Search</h1>

      {/* Search box */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-faint" />
        <input
          autoFocus
          value={inputVal}
          onChange={(e) => { setInputVal(e.target.value); setSugOpen(true); }}
          onBlur={() => setTimeout(() => setSugOpen(false), 150)}
          onFocus={() => suggestions.length && setSugOpen(true)}
          placeholder="Search jobs, people, companies, posts…"
          className="h-12 w-full rounded-2xl border border-line bg-surface pl-11 pr-4 text-sm outline-none focus:border-brand"
        />
        {sugOpen && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-2xl border border-line2 bg-surface shadow-lift">
            {suggestions.map((s, i) => (
              <button key={i} onMouseDown={() => { setInputVal(s); setSugOpen(false); }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-elevated">
                <Search className="h-3.5 w-3.5 text-faint" />{s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Type tabs */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {TYPE_TABS.map((t) => (
          <button key={t.key} onClick={() => { setType(t.key); update({ type: t.key }); }}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${type === t.key ? "bg-brand text-white" : "bg-surface border border-line text-muted hover:border-brand hover:text-brand"}`}>
            {t.icon && <t.icon className="h-3.5 w-3.5" />}{t.label}
          </button>
        ))}
        <button onClick={() => setShowFilters((v) => !v)}
          className={`ml-auto flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm transition-colors ${showFilters ? "border-brand text-brand" : "border-line text-muted hover:border-brand"}`}>
          <SlidersHorizontal className="h-4 w-4" />Filters
          {hasFilters && <span className="h-2 w-2 rounded-full bg-brand" />}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface p-4">
          <select className={selectCls} value={get("work_type")} onChange={(e) => update({ work_type: e.target.value })}>
            <option value="">Any type</option>
            {WORK_TYPE.map((t) => <option key={t} value={t}>{WORK_TYPE_LABELS[t]}</option>)}
          </select>
          <select className={selectCls} value={get("work_model")} onChange={(e) => update({ work_model: e.target.value })}>
            <option value="">Any model</option>
            {WORK_MODEL.map((t) => <option key={t} value={t}>{WORK_MODEL_LABELS[t]}</option>)}
          </select>
          <select className={selectCls} value={get("level")} onChange={(e) => update({ level: e.target.value })}>
            <option value="">Any level</option>
            {EXPERIENCE_LEVEL.map((t) => <option key={t} value={t}>{EXPERIENCE_LEVEL_LABELS[t]}</option>)}
          </select>
          <select className={selectCls} value={get("posted_within")} onChange={(e) => update({ posted_within: e.target.value })}>
            <option value="">Any time</option>
            {[["24h","Last 24h"],["3d","Last 3d"],["7d","Last week"],["30d","Last month"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input placeholder="Location" value={get("location")} onChange={(e) => update({ location: e.target.value })}
            className="h-9 rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-brand" />
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-muted hover:text-ink">
              <X className="h-3.5 w-3.5" />Clear
            </button>
          )}
        </div>
      )}

      {/* Results */}
      <div className="mt-6">
        {params.q.length < 2 ? (
          <p className="py-10 text-center text-sm text-muted">
            Type at least 2 characters to search.
          </p>
        ) : isLoading || isFetching ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : totalResults === 0 ? (
          <div className="py-16 text-center">
            <Search className="mx-auto h-8 w-8 text-faint" />
            <p className="mt-3 text-sm text-muted">No results for &ldquo;{params.q}&rdquo;</p>
          </div>
        ) : (
          <div className="space-y-8">
            <ResultSection title="Jobs" icon={Briefcase} count={jobs.length}>
              {jobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-all hover:-translate-y-0.5 hover:shadow-soft">
                  <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-elevated">
                    {job.company?.logo_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img loading="lazy" src={imgUrl(job.company.logo_url) ?? ""} alt="" className="h-full w-full object-cover" />
                      : <Briefcase className="h-4 w-4 text-faint" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{job.title}</p>
                    <p className="truncate text-xs text-muted">{job.company?.name}{job.location ? ` · ${job.location}` : ""}</p>
                  </div>
                </Link>
              ))}
            </ResultSection>

            <ResultSection title="People" icon={Users} count={users.length}>
              {users.map((u) => (
                <Link key={u.id} href={`/users/${u.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 hover:bg-elevated">
                  <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-elevated text-sm font-bold text-brand">
                    {u.candidate_profile?.profile_image_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img loading="lazy" src={imgUrl(u.candidate_profile.profile_image_url) ?? ""} alt="" className="h-full w-full object-cover rounded-full" />
                      : u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{u.name}</p>
                    {u.candidate_profile?.headline && (
                      <p className="text-xs text-muted">{u.candidate_profile.headline}</p>
                    )}
                  </div>
                </Link>
              ))}
            </ResultSection>

            <ResultSection title="Companies" icon={Building2} count={companies.length}>
              {companies.map((c) => (
                <Link key={c.id} href={`/companies/${c.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 hover:bg-elevated">
                  <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-elevated">
                    {c.logo_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img loading="lazy" src={imgUrl(c.logo_url) ?? ""} alt="" className="h-full w-full object-cover" />
                      : <Building2 className="h-4 w-4 text-faint" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{c.name}</p>
                    {c.industry && <p className="text-xs text-muted">{c.industry}</p>}
                  </div>
                </Link>
              ))}
            </ResultSection>

            <ResultSection title="Posts" icon={Newspaper} count={posts.length}>
              {posts.map((post) => (
                <div key={post.id} className="rounded-2xl border border-line bg-surface p-4">
                  <p className="text-xs font-semibold text-muted">{post.author?.name}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-ink">{post.content}</p>
                </div>
              ))}
            </ResultSection>
          </div>
        )}
      </div>
    </Container>
  );
}

export function SearchPage() {
  return (
    <Suspense fallback={<div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>}>
      <SearchInner />
    </Suspense>
  );
}