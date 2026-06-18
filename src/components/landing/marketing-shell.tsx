import { Container } from "@/components/ui/section";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Footer } from "@/components/landing/footer";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-line">
        <Container className="flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button href="/" variant="ghost" size="sm">
              Back home
            </Button>
          </div>
        </Container>
      </header>
      <main className="py-16">{children}</main>
      <Footer />
    </>
  );
}

export function LegalBody({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <Container className="max-w-3xl">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        {title}
      </h1>
      <p className="readout mt-3 text-sm text-muted">Last updated {updated}</p>
      <div className="mt-10 space-y-8 leading-relaxed text-ink/90 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_p]:mt-3 [&_p]:text-muted">
        {children}
      </div>
    </Container>
  );
}
