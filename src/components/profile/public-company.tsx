"use client";

import { imgUrl } from "@/lib/utils";
import {
  Loader2,
  Building2,
  Globe,
  MapPin,
  Users,
  CalendarDays,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@/components/ui/section";
import { profileApi } from "@/lib/api/endpoints/profile";

export function PublicCompany({ id }: { id: number }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["company", id],
    queryFn: () => profileApi.getCompany(id),
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }
  if (isError || !data?.company) {
    return (
      <Container className="py-16 text-center text-sm text-muted">
        Company not found.
      </Container>
    );
  }

  const c = data.company;

  return (
    <Container className="max-w-3xl py-8">
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
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
            {c.name}
          </h1>
          {c.industry ? <p className="mt-1 text-muted">{c.industry}</p> : null}

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {c.headquarters ? (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-faint" />
                {c.headquarters}
              </span>
            ) : null}
            {c.size ? (
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-faint" />
                {c.size} employees
              </span>
            ) : null}
            {c.founded_year ? (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-faint" />
                Founded {c.founded_year}
              </span>
            ) : null}
            {c.website ? (
              <a
                href={c.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-brand hover:underline"
              >
                <Globe className="h-4 w-4" />
                Website
              </a>
            ) : null}
          </div>

          {c.description ? (
            <p className="mt-5 text-sm leading-relaxed text-muted">
              {c.description}
            </p>
          ) : null}
        </div>
      </div>
    </Container>
  );
}
