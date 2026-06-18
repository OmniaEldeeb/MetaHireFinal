import { Container, Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { FEATURES, type IconColor } from "@/lib/content/landing";

const ICON_TONE: Record<IconColor, string> = {
  purple: "bg-brand/15 text-brand",
  green: "bg-green/12 text-green",
  amber: "bg-amber/12 text-amber",
  coral: "bg-coral/12 text-coral",
};

export function Features() {
  return (
    <Section id="features">
      <Container>
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to hire well"
          lead="Real AI across the whole journey — matching, CV analysis, interviews, and posting."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 80}>
              <article className="h-full rounded-2xl border border-line bg-surface p-7 transition-all hover:-translate-y-1 hover:border-line2">
                <span
                  className={`grid h-11 w-11 place-items-center rounded-xl ${ICON_TONE[f.color]}`}
                >
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {f.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
