import { Star } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { TESTIMONIALS } from "@/lib/content/landing";

const AVATAR_TONE: Record<string, string> = {
  purple: "bg-brand/15 text-brand",
  green: "bg-green/12 text-green",
  amber: "bg-amber/12 text-amber",
};

export function Testimonials() {
  return (
    <Section className="border-y border-line bg-bg-2">
      <Container>
        <SectionHeading
          eyebrow="Loved by both sides"
          title="Fairer for candidates, faster for teams"
          align="center"
        />

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={(i % 3) * 90}>
              <figure className="flex h-full flex-col rounded-2xl border border-line bg-surface p-7">
                <div className="flex gap-0.5 text-amber">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-[0.95rem] leading-relaxed">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold ${AVATAR_TONE[t.avatar]}`}
                  >
                    {t.name.charAt(0)}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{t.name}</span>
                    <span className="block text-xs text-faint">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
