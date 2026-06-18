"use client";

import { imgUrl } from "@/lib/utils";
import {
  Loader2, Building2, Globe, MapPin, Users,
  CalendarDays, Briefcase, FileText,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Container } from "@/components/ui/section";
import { profileApi } from "@/lib/api/endpoints/profile";

export function PublicCompany({ id }: { id: number }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["company", id],
    queryFn: () => profileApi.getCompany(id),
  });

  if (isLoading) return (
    <div className="grid place-items-center py-24">
      <Loader2 className="h-6 w-6 animate-spin text-brand" />
    </div>
  );
  if (isError || !data?.company) return (
    <Container className="py-16 text-center text-sm text-muted">Company not found.</Container>
  );

  // Real API: data.company = {id,name,logo_url,cover_image_url,locations:[],size,...}
  const c = data.company;
  const stats = data.stats;
  const jobs = data.active_jobs ?? [];
  const locations = c.locations ?? [];

  return (
    <Container className="max-w-3xl py-8 space-y-6">
      {/* Header with cover + logo */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="h-36 bg-elevated">
          {c.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgUrl(c.cover_image_url) ?? ""} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="px-6 pb-6">
          <div className="-mt-10 grid h-20 w-20 place-items-center overflow-hidden rounded-2xl border border-line bg-surface">
            {c.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgUrl(c.logo_url) ?? ""} alt="" className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-8 w-8 text-faint" />
            )}
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">{c.name}</h1>
          {c.industry && <p className="mt-1 text-muted">{c.industry}</p>}

          {/* Stats row */}
          {stats && (
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted">
              {stats.followers_count !== undefined && (
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{stats.followers_count} followers</span>
              )}
              {stats.active_jobs !== undefined && (
                <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{stats.active_jobs} open roles</span>
              )}
              {stats.posts_count !== undefined && (
                <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{stats.posts_count} posts</span>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {c.headquarters && (
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-faint" />{c.headquarters}</span>
            )}
            {/* API returns 'size' not 'size_enum' in public profile response */}
            {(c as { size?: string | null }).size && (
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-faint" />{(c as { size?: string }).size} employees
              </span>
            )}
            {c.founded_year && (
              <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-faint" />Founded {c.founded_year}</span>
            )}
            {c.website && (
              <a href={c.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-brand hover:underline">
                <Globe className="h-4 w-4" />Website
              </a>
            )}
          </div>

          {c.description && (
            <p className="mt-5 text-sm leading-relaxed text-muted">{c.description}</p>
          )}
        </div>
      </div>

      {/* Locations */}
      {locations.length > 0 && (
        <section className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-display text-base font-bold tracking-tight">Locations</h2>
          <ul className="mt-4 space-y-3">
            {locations.map((loc) => (
              <li key={loc.id} className="flex items-start gap-3 rounded-xl border border-line bg-elevated p-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <div>
                  {loc.label && <p className="text-sm font-medium">{loc.label}</p>}
                  <p className="text-sm text-muted">{[loc.city, loc.country].filter(Boolean).join(", ")}</p>
                  {loc.is_remote_friendly && (
                    <span className="readout text-xs text-green">Remote friendly</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Open roles */}
      {jobs.length > 0 && (
        <section className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-display text-base font-bold tracking-tight">Open roles</h2>
          <ul className="mt-4 space-y-3">
            {(jobs as Array<{
              id: number; title: string; work_model?: string;
              work_type?: string; experience_level?: string; salary_range?: string;
            }>).map((job) => (
              <li key={job.id}>
                <Link href={`/jobs/${job.id}`}
                  className="block rounded-xl border border-line bg-elevated p-4 hover:border-brand transition-colors">
                  <p className="text-sm font-semibold">{job.title}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted">
                    {job.work_model && <span className="capitalize">{job.work_model.replace("_", " ")}</span>}
                    {job.work_type && <span className="capitalize">{job.work_type.replace("_", " ")}</span>}
                    {job.experience_level && <span>{job.experience_level}</span>}
                    {job.salary_range && <span className="text-brand">{job.salary_range}</span>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Container>
  );
}
