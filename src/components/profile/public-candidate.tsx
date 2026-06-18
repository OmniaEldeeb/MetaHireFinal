"use client";

import { imgUrl } from "@/lib/utils";

import {
  Loader2,
  MapPin,
  Briefcase,
  GraduationCap,
  FolderGit2,
  BadgeCheck,
  Github,
  Linkedin,
  Globe,
} from "lucide-react";
import { Container } from "@/components/ui/section";
import { profileApi } from "@/lib/api/endpoints/profile";
import { useQuery } from "@tanstack/react-query";

function fmt(d?: string) {
  if (!d) return "";
  const date = new Date(d);
  return isNaN(+date)
    ? d
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

function Block({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Briefcase;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
        <Icon className="h-5 w-5 text-brand" />
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function PublicCandidate({ id }: { id: number }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["user", id],
    queryFn: () => profileApi.getUser(id),
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }
  if (isError || !data?.user) {
    return (
      <Container className="py-16 text-center text-sm text-muted">
        Profile not found.
      </Container>
    );
  }

  const u = data.user;
  const p = u.candidate_profile ?? {};

  return (
    <Container className="max-w-3xl py-8">
      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex items-start gap-5">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-elevated">
            {p.profile_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgUrl(p.profile_image_url) ?? ""} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-2xl font-bold text-brand">
                {u.name?.charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-extrabold tracking-tight">
                {u.name}
              </h1>
              {p.open_to_work ? (
                <span className="rounded-full bg-green/12 px-2.5 py-0.5 text-xs font-medium text-green">
                  Open to work
                </span>
              ) : null}
            </div>
            {p.headline ? <p className="mt-1 text-muted">{p.headline}</p> : null}
            {p.location ? (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-faint">
                <MapPin className="h-3.5 w-3.5" />
                {p.location}
              </p>
            ) : null}
            <div className="mt-3 flex gap-2">
              {p.linkedin_url ? (
                <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="grid h-8 w-8 place-items-center rounded-lg border border-line text-faint hover:border-brand hover:text-brand">
                  <Linkedin className="h-4 w-4" />
                </a>
              ) : null}
              {p.github_url ? (
                <a href={p.github_url} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="grid h-8 w-8 place-items-center rounded-lg border border-line text-faint hover:border-brand hover:text-brand">
                  <Github className="h-4 w-4" />
                </a>
              ) : null}
              {p.portfolio_url ? (
                <a href={p.portfolio_url} target="_blank" rel="noopener noreferrer" aria-label="Portfolio" className="grid h-8 w-8 place-items-center rounded-lg border border-line text-faint hover:border-brand hover:text-brand">
                  <Globe className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
        {p.bio ? <p className="mt-5 text-sm leading-relaxed text-muted">{p.bio}</p> : null}
        {p.skills?.length ? (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {p.skills.map((s) => (
              <span key={s} className="rounded-lg bg-brand-soft px-2.5 py-1 text-sm text-brand">
                {s}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-6 space-y-6">
        {p.experience?.length ? (
          <Block icon={Briefcase} title="Experience">
            {p.experience.map((e, i) => (
              <div key={i} className="border-l-2 border-line pl-4">
                <p className="text-sm font-semibold">{e.title}</p>
                <p className="text-sm text-muted">{e.company}</p>
                <p className="readout mt-0.5 text-xs text-faint">
                  {fmt(e.start_date)} – {e.end_date ? fmt(e.end_date) : "Present"}
                </p>
                {e.description ? (
                  <p className="mt-1.5 text-sm text-muted">{e.description}</p>
                ) : null}
              </div>
            ))}
          </Block>
        ) : null}

        {p.education?.length ? (
          <Block icon={GraduationCap} title="Education">
            {p.education.map((e, i) => (
              <div key={i} className="border-l-2 border-line pl-4">
                <p className="text-sm font-semibold">{e.degree}</p>
                <p className="text-sm text-muted">{e.school}</p>
                <p className="readout mt-0.5 text-xs text-faint">
                  {fmt(e.start_date)} – {e.end_date ? fmt(e.end_date) : "Present"}
                </p>
              </div>
            ))}
          </Block>
        ) : null}

        {p.projects?.length ? (
          <Block icon={FolderGit2} title="Projects">
            {p.projects.map((e, i) => (
              <div key={i}>
                <a
                  href={e.url || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold hover:text-brand"
                >
                  {e.name}
                </a>
                {e.description ? (
                  <p className="mt-0.5 text-sm text-muted">{e.description}</p>
                ) : null}
              </div>
            ))}
          </Block>
        ) : null}

        {p.certifications?.length ? (
          <Block icon={BadgeCheck} title="Certifications">
            {p.certifications.map((e, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{e.name}</p>
                  {e.issuer ? <p className="text-sm text-muted">{e.issuer}</p> : null}
                </div>
                {e.date ? (
                  <p className="readout text-xs text-faint">{fmt(e.date)}</p>
                ) : null}
              </div>
            ))}
          </Block>
        ) : null}
      </div>
    </Container>
  );
}
