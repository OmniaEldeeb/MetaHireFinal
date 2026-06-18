"use client";

import { Check } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/content/landing";
import { useSignupModal } from "@/components/landing/signup-modal";

export function Pricing() {
  const showSignup = useSignupModal((s) => s.show);

  return (
    <Section id="pricing">
      <Container>
        <SectionHeading
          eyebrow="Pricing"
          title="Free to get hired. Pay to hire."
          lead="Candidates never pay. Companies start free and scale when they do."
          align="center"
        />

        <div className="mx-auto mt-14 grid max-w-5xl items-stretch gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-surface p-8",
                plan.featured ? "border-brand/50 shadow-glow" : "border-line",
              )}
            >
              {plan.featured ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand px-3.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-white">
                  Most popular
                </span>
              ) : null}

              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                {plan.name}
              </p>
              <p className="mt-3 font-display text-4xl font-extrabold leading-none">
                {plan.price}
                <span className="ml-1 font-sans text-base font-normal text-faint">
                  {plan.cadence}
                </span>
              </p>
              <p className="mt-3 text-sm text-muted">{plan.desc}</p>

              <ul className="mt-7 space-y-2.5">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green" />
                    <span className="text-muted">{feat}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-1">
                {plan.action === "contact" ? (
                  <Button
                    href="/contact"
                    variant={plan.featured ? "primary" : "outline"}
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                ) : (
                  <Button
                    variant={plan.featured ? "primary" : "outline"}
                    className="w-full"
                    onClick={showSignup}
                  >
                    {plan.cta}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
