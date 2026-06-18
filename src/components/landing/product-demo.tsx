import { Check } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/section";
import { DEMO_POINTS } from "@/lib/content/landing";

interface MockJob {
  title: string;
  company: string;
  badge: { text: string; tone: string };
  tags: string[];
  score: number;
  scoreColor: string;
}

const JOBS: MockJob[] = [
  {
    title: "Senior Laravel Developer",
    company: "TechCorp Egypt",
    badge: { text: "98% match", tone: "bg-green/12 text-green" },
    tags: ["Laravel", "MySQL", "Redis"],
    score: 98,
    scoreColor: "rgb(var(--green))",
  },
  {
    title: "Frontend Engineer",
    company: "Helios",
    badge: { text: "91% match", tone: "bg-brand/15 text-brand" },
    tags: ["React", "Next.js", "TypeScript"],
    score: 91,
    scoreColor: "rgb(var(--accent))",
  },
  {
    title: "Product Designer",
    company: "Onyx HR",
    badge: { text: "84% match", tone: "bg-amber/12 text-amber" },
    tags: ["Figma", "Design systems"],
    score: 84,
    scoreColor: "rgb(var(--amber))",
  },
];

export function ProductDemo() {
  return (
    <Section className="border-y border-line bg-bg-2">
      <Container>
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="See it work"
              title="Matches you can actually trust"
              lead="Every role comes with a live fit score, so the best matches rise to the top automatically."
            />
            <ul className="mt-7 space-y-3.5">
              {DEMO_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-[0.95rem]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green" />
                  <span className="text-muted">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-line2 bg-bg-3 p-5 shadow-lift sm:p-6">
            <div className="mb-5 flex gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
            </div>
            <div className="space-y-2.5">
              {JOBS.map((job) => (
                <div
                  key={job.title}
                  className="rounded-xl border border-line bg-surface p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{job.title}</p>
                      <p className="mt-0.5 text-xs text-faint">{job.company}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${job.badge.tone}`}
                    >
                      {job.badge.text}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded border border-line bg-bg px-2 py-0.5 text-[0.7rem] text-faint"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-line2">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${job.score}%`,
                          backgroundColor: job.scoreColor,
                        }}
                      />
                    </div>
                    <span className="readout text-xs text-faint">{job.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
