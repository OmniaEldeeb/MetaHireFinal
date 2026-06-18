import type { Metadata } from "next";
import { Mail, MessageSquare } from "lucide-react";
import { MarketingShell } from "@/components/landing/marketing-shell";
import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Contact" };

const inputClass =
  "h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-brand";

export default function ContactPage() {
  return (
    <MarketingShell>
      <Container className="max-w-3xl">
        <p className="eyebrow">Contact</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Talk to a human
        </h1>
        <p className="mt-4 text-lg text-muted">
          Questions about hiring, pricing, or your account? Send a note and the
          team gets back within a business day.
        </p>

        <div className="mt-10 grid gap-8 sm:grid-cols-[1fr_1.4fr]">
          <div className="space-y-5">
            <a
              href="mailto:hello@metahire.app"
              className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4"
            >
              <Mail className="mt-0.5 h-5 w-5 text-brand" />
              <span>
                <span className="block text-sm font-medium">Email</span>
                <span className="block text-sm text-muted">
                  hello@metahire.app
                </span>
              </span>
            </a>
            <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4">
              <MessageSquare className="mt-0.5 h-5 w-5 text-brand" />
              <span>
                <span className="block text-sm font-medium">In-app support</span>
                <span className="block text-sm text-muted">
                  Logged in? Open a support ticket from Help.
                </span>
              </span>
            </div>
          </div>

          {/* Static form for now — wire to POST /support/tickets in a later stage. */}
          <form className="space-y-4 rounded-2xl border border-line bg-surface p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <input className={inputClass} placeholder="Name" aria-label="Name" />
              <input
                className={inputClass}
                placeholder="Email"
                type="email"
                aria-label="Email"
              />
            </div>
            <input
              className={inputClass}
              placeholder="Subject"
              aria-label="Subject"
            />
            <textarea
              className={inputClass + " h-32 resize-none py-3"}
              placeholder="How can we help?"
              aria-label="Message"
            />
            <Button type="submit" className="w-full">
              Send message
            </Button>
            <p className="text-center text-xs text-muted">
              This form is a placeholder — connect it to the support API in the
              app build.
            </p>
          </form>
        </div>
      </Container>
    </MarketingShell>
  );
}
