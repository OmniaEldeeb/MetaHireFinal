"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STATS, HERO_BADGE } from "@/lib/content/landing";
import { useSignupModal } from "@/components/landing/signup-modal";

export function Hero() {
  const showSignup = useSignupModal((s) => s.show);
  const Badge = HERO_BADGE.icon;

  return (
    <section className="relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden px-5 pb-16 pt-24 text-center sm:px-8">
      <div className="pointer-events-none absolute inset-0 grid-field" aria-hidden />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[52rem] -translate-x-1/2 rounded-full bg-brand/15 blur-[130px]"
        aria-hidden
      />

      <div className="relative">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-[0.8rem] font-medium text-brand">
          <Badge className="h-3.5 w-3.5" />
          {HERO_BADGE.text}
        </span>

        <h1 className="mx-auto mt-7 max-w-4xl font-display text-[2.75rem] font-extrabold leading-[1.06] tracking-tight sm:text-6xl lg:text-[4.75rem]">
          The <span className="text-brand">smartest</span> way to hire and get
          hired
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
          MetaHire uses real AI to match candidates with jobs, analyze CVs
          automatically, and help companies create postings in seconds through a
          conversational chatbot.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={showSignup}>
            Get started free
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button href="/jobs" variant="outline" size="lg">
            Browse jobs
          </Button>
        </div>

        <dl className="mx-auto mt-16 flex max-w-2xl flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <dd className="font-display text-3xl font-bold tracking-tight">
                {s.value}
              </dd>
              <dt className="mt-1 text-sm text-faint">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
