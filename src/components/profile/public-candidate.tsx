"use client";

import { imgUrl } from "@/lib/utils";
import {
  Loader2, MapPin, Briefcase, GraduationCap, FolderGit2,
  BadgeCheck, Github, Linkedin, Globe, Users, FileText, Languages,
} from "lucide-react";
import { Container } from "@/components/ui/section";
import { profileApi } from "@/lib/api/endpoints/profile";
import { useQuery } from "@tanstack/react-query";
import { PostCard } from "@/components/social/post-card";
import { ProfileActions } from "./profile-actions";
import type { Post } from "@/lib/api/endpoints/social";

function fmt(d?: string) {
  if (!d) return "";
  const date = new Date(d);
  return isNaN(+date) ? d : date.toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

function Block({ icon: Icon, title, children }: {
  icon: typeof Briefcase; title: string; children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
        <Icon className="h-5 w-5 text-brand" />{title}
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

  if (isLoading) return (
    <div className="grid place-items-center py-24">
      <Loader2 className="h-6 w-6 animate-spin text-brand" />
    </div>
  );
  if (isError || !data?.user) return (
    <Container className="py-16 text-center text-sm text-muted">Profile not found.</Container>
  );

  // Real API response shape (confirmed from actual response):
  // data.user = { id, name, role, profile_url }
  // data.profile = { headline, bio, location, skills, profile_image_url, linkedin_url, ... }
  // data.stats = { connections_count, posts_count }
  // data.posts = { data: Post[], current_page, last_page, total }
  const u = data.user;
  const p = data.profile ?? {};
  const stats = data.stats;
  const posts = (data.posts?.data ?? []) as Post[];

  return (
    <Container className="max-w-3xl py-8">
      {/* Header card */}
      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex items-start gap-5">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-elevated">
            {p.profile_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgUrl(p.profile_image_url) ?? ""} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-2xl font-bold text-brand">{u.name?.charAt(0)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-extrabold tracking-tight">{u.name}</h1>
              {p.open_to_work && (
                <span className="rounded-full bg-green/12 px-2.5 py-0.5 text-xs font-medium text-green">
                  Open to work
                </span>
              )}
            </div>
            {p.headline && <p className="mt-1 text-muted">{p.headline}</p>}
            {p.location && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-faint">
                <MapPin className="h-3.5 w-3.5" />{p.location}
              </p>
            )}
            {stats && (
              <div className="mt-3 flex items-center gap-4 text-sm text-muted">
                {stats.connections_count !== undefined && (
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />{stats.connections_count} connection{stats.connections_count !== 1 ? "s" : ""}
                  </span>
                )}
                {stats.posts_count !== undefined && (
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />{stats.posts_count} posts
                  </span>
                )}
              </div>
            )}
            <div className="mt-3 flex gap-2">
              {p.linkedin_url && (
                <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-line text-faint hover:border-brand hover:text-brand">
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {p.github_url && (
                <a href={p.github_url} target="_blank" rel="noopener noreferrer" aria-label="GitHub"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-line text-faint hover:border-brand hover:text-brand">
                  <Github className="h-4 w-4" />
                </a>
              )}
              {p.portfolio_url && (
                <a href={p.portfolio_url} target="_blank" rel="noopener noreferrer" aria-label="Portfolio"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-line text-faint hover:border-brand hover:text-brand">
                  <Globe className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
        {p.bio && <p className="mt-5 text-sm leading-relaxed text-muted whitespace-pre-line">{p.bio}</p>}

        {/* Connect + Message buttons */}
        <ProfileActions
          userId={u.id}
          isCompany={false}
          initialStatus={data.connection_status ?? null}
        />
        {(p.skills as string[] | undefined)?.length ? (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {(p.skills as string[]).map((s) => (
              <span key={s} className="rounded-lg bg-brand-soft px-2.5 py-1 text-sm text-brand">{s}</span>
            ))}
          </div>
        ) : null}
      </div>

      {/* CV sections */}
      <div className="mt-6 space-y-6">
        {(p.experience as { title?: string; company?: string; start_date?: string; end_date?: string; description?: string }[] | undefined)?.length ? (
          <Block icon={Briefcase} title="Experience">
            {(p.experience as { title?: string; company?: string; start_date?: string; end_date?: string; description?: string }[]).map((e, i) => (
              <div key={i} className="border-l-2 border-line pl-4">
                <p className="text-sm font-semibold">{e.title}</p>
                <p className="text-sm text-muted">{e.company}</p>
                <p className="readout mt-0.5 text-xs text-faint">
                  {fmt(e.start_date)} – {e.end_date ? fmt(e.end_date) : "Present"}
                </p>
                {e.description && <p className="mt-1.5 text-sm text-muted">{e.description}</p>}
              </div>
            ))}
          </Block>
        ) : null}

        {(p.education as { degree?: string; school?: string; start_date?: string; end_date?: string }[] | undefined)?.length ? (
          <Block icon={GraduationCap} title="Education">
            {(p.education as { degree?: string; school?: string; start_date?: string; end_date?: string }[]).map((e, i) => (
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

        {(p.projects as { name?: string; url?: string; description?: string }[] | undefined)?.length ? (
          <Block icon={FolderGit2} title="Projects">
            {(p.projects as { name?: string; url?: string; description?: string }[]).map((e, i) => (
              <div key={i}>
                <a href={e.url || undefined} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-semibold hover:text-brand">{e.name}</a>
                {e.description && <p className="mt-0.5 text-sm text-muted">{e.description}</p>}
              </div>
            ))}
          </Block>
        ) : null}

        {(p.certifications as { name?: string; issuer?: string; date?: string }[] | undefined)?.length ? (
          <Block icon={BadgeCheck} title="Certifications">
            {(p.certifications as { name?: string; issuer?: string; date?: string }[]).map((e, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{e.name}</p>
                  {e.issuer && <p className="text-sm text-muted">{e.issuer}</p>}
                </div>
                {e.date && <p className="readout text-xs text-faint">{fmt(e.date)}</p>}
              </div>
            ))}
          </Block>
        ) : null}

        {/* Languages */}
        {(p.languages_spoken as { language?: string; proficiency?: string }[] | undefined)?.length ? (
          <Block icon={Languages} title="Languages">
            {(p.languages_spoken as { language?: string; proficiency?: string }[]).map((l, i) => (
              <div key={i} className="flex items-center justify-between">
                <p className="text-sm font-semibold">{l.language}</p>
                {l.proficiency && (
                  <span className="readout rounded-full bg-elevated px-2.5 py-0.5 text-xs capitalize text-muted">
                    {l.proficiency}
                  </span>
                )}
              </div>
            ))}
          </Block>
        ) : null}

        {/* Posts */}
        {posts.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-lg font-bold tracking-tight">Posts</h2>
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Container>
  );
}