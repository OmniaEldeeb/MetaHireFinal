import { Container, Section, SectionHeading } from "@/components/ui/section";
import { STEPS } from "@/lib/content/landing";

export function HowItWorks() {
  return (
    <Section id="how">
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title="From sign-up to hire in four steps"
          align="center"
        />

        <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="bg-bg p-8">
              <span className="font-display text-5xl font-extrabold leading-none text-line2">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 text-base font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
