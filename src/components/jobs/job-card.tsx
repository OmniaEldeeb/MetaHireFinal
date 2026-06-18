import { imgUrl } from "@/lib/utils";
import Link from "next/link";
import { MapPin, Building2, Clock } from "lucide-react";
import type { Job } from "@/lib/api/endpoints/jobs";
import {
  WORK_TYPE_LABELS,
  WORK_MODEL_LABELS,
  EXPERIENCE_LEVEL_LABELS,
} from "@/lib/constants/labels";
import type {
  WorkType,
  WorkModel,
  ExperienceLevel,
} from "@/lib/constants/enums";

function ago(iso?: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d <= 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export function JobCard({ job }: { job: Job }) {
  const badges = [
    job.work_type ? WORK_TYPE_LABELS[job.work_type as WorkType] : null,
    job.work_model ? WORK_MODEL_LABELS[job.work_model as WorkModel] : null,
    job.experience_level
      ? EXPERIENCE_LEVEL_LABELS[job.experience_level as ExperienceLevel]
      : null,
  ].filter(Boolean) as string[];

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group block rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-soft"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-elevated">
          {job.company?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgUrl(job.company.logo_url) ?? ""} alt="" className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-5 w-5 text-faint" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-bold tracking-tight group-hover:text-brand">
            {job.title}
          </h3>
          <p className="truncate text-sm text-muted">
            {job.company?.name ?? "Company"}
          </p>
        </div>
        {job.created_at ? (
          <span className="readout flex shrink-0 items-center gap-1 text-xs text-faint">
            <Clock className="h-3 w-3" />
            {ago(job.created_at)}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {badges.map((b) => (
          <span
            key={b}
            className="rounded-lg bg-elevated px-2.5 py-1 text-xs font-medium text-muted"
          >
            {b}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted">
          <MapPin className="h-4 w-4 text-faint" />
          {job.location ?? "—"}
        </span>
        {job.salary_range ? (
          <span className="readout text-xs text-brand">{job.salary_range}</span>
        ) : null}
      </div>
    </Link>
  );
}
