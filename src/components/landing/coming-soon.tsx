import { MarketingShell } from "@/components/landing/marketing-shell";
import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

/** Temporary stand-in for routes that arrive in later stages
 *  (login, register, jobs). Keeps the landing CTAs from 404-ing. */
export function ComingSoon({
  title,
  note,
}: {
  title: string;
  note: string;
}) {
  return (
    <MarketingShell>
      <Container className="max-w-xl py-16 text-center">
        <p className="eyebrow justify-center">Next stage</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="mt-4 text-muted">{note}</p>
        <div className="mt-8 flex justify-center">
          <Button href="/">Back to home</Button>
        </div>
      </Container>
    </MarketingShell>
  );
}
