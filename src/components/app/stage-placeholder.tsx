import type { LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/section";

export function StagePlaceholder({
  icon: Icon,
  title,
  description,
  stage,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  stage: string;
}) {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-line bg-surface p-10 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Icon className="h-6 w-6" />
        </span>
        <span className="readout mt-5 inline-block rounded-full bg-elevated px-2.5 py-1 text-[0.65rem] uppercase tracking-wider text-faint">
          {stage}
        </span>
        <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted">{description}</p>
      </div>
    </Container>
  );
}
