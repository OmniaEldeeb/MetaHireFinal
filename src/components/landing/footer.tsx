import Link from "next/link";
import { Github, Linkedin, Twitter } from "lucide-react";
import { Container } from "@/components/ui/section";
import { Logo } from "@/components/ui/logo";
import { FOOTER_LINKS } from "@/lib/content/landing";

const SOCIALS = [
  { label: "LinkedIn", href: "https://linkedin.com", icon: Linkedin },
  { label: "X", href: "https://x.com", icon: Twitter },
  { label: "GitHub", href: "https://github.com", icon: Github },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-bg">
      <Container className="py-14">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-faint">
              The smartest way to hire and get hired — AI matching, CV analysis,
              and interviews that read the signal.
            </p>
            <div className="mt-5 flex items-center gap-2.5">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface text-faint transition-colors hover:border-brand hover:text-brand"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-faint">
                {group}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted transition-colors hover:text-ink"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line pt-7 sm:flex-row">
          <p className="text-sm text-faint">
            © {new Date().getFullYear()} MetaHire. All rights reserved.
          </p>
          <div className="flex gap-5">
            <Link href="/privacy" className="text-sm text-faint hover:text-muted">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-faint hover:text-muted">
              Terms
            </Link>
            <Link href="/contact" className="text-sm text-faint hover:text-muted">
              Contact
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
