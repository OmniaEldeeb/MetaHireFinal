import type { Metadata } from "next";
import {
  MarketingShell,
  LegalBody,
} from "@/components/landing/marketing-shell";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <MarketingShell>
      <LegalBody title="Terms of Service" updated="June 2026">
        <p>
          This is placeholder copy. Replace it with your reviewed terms before
          launch.
        </p>
        <section>
          <h2>Using MetaHire</h2>
          <p>
            Candidates may build CVs, apply to roles, and take interviews.
            Companies may post roles and review applicants within their plan
            limits.
          </p>
        </section>
        <section>
          <h2>Accounts</h2>
          <p>
            You are responsible for activity under your account. Keep your
            credentials secure and log out of shared devices.
          </p>
        </section>
        <section>
          <h2>Acceptable use</h2>
          <p>
            Don&apos;t misuse the platform, attempt to game scoring, or upload
            content you don&apos;t have rights to.
          </p>
        </section>
        <section>
          <h2>Changes</h2>
          <p>
            We may update these terms; material changes will be communicated in
            advance.
          </p>
        </section>
      </LegalBody>
    </MarketingShell>
  );
}
