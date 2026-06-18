import { Plus } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/section";
import { FAQS } from "@/lib/content/landing";

export function Faq() {
  return (
    <Section id="faq">
      <Container>
        <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered"
          align="center"
        />

        <div className="mx-auto mt-14 flex max-w-3xl flex-col gap-2.5">
          {FAQS.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-line bg-surface px-6"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[0.95rem] font-medium [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface2 text-faint transition-transform group-open:rotate-45 group-open:text-brand">
                  <Plus className="h-4 w-4" />
                </span>
              </summary>
              <p className="pb-5 text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  );
}
