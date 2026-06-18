"use client";

import { ArrowRight } from "lucide-react";
import { Container, Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { useSignupModal } from "@/components/landing/signup-modal";

export function FinalCta() {
  const showSignup = useSignupModal((s) => s.show);

  return (
    <Section className="border-t border-line bg-bg-2">
      <Container>
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-brand/25 bg-surface px-6 py-16 text-center sm:px-12 sm:py-20">
          <div
            className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[32rem] -translate-x-1/2 rounded-full bg-brand/15 blur-[100px]"
            aria-hidden
          />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-[2.75rem]">
              Start hiring smarter today
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[1.05rem] text-muted">
              Join MetaHire free and let AI do the heavy lifting — for candidates
              and companies alike.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button size="lg" onClick={showSignup}>
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href="/contact" variant="outline" size="lg">
                Contact sales
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
