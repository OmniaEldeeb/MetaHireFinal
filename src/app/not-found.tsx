import { MarketingShell } from "@/components/landing/marketing-shell";
import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <MarketingShell>
      <Container className="max-w-xl py-20 text-center">
        <p className="readout text-6xl font-medium text-brand">404</p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">
          This page isn&apos;t here
        </h1>
        <p className="mt-3 text-muted">
          The link may be broken or the page may have moved.
        </p>
        <div className="mt-8 flex justify-center">
          <Button href="/">Back to home</Button>
        </div>
      </Container>
    </MarketingShell>
  );
}
