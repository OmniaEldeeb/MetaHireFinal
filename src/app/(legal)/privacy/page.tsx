import type { Metadata } from "next";
import {
  MarketingShell,
  LegalBody,
} from "@/components/landing/marketing-shell";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <LegalBody title="Privacy Policy" updated="June 2026">
        <p>
          This is placeholder copy. Replace it with your reviewed policy before
          launch — the structure below reflects what MetaHire actually collects
          and why.
        </p>
        <section>
          <h2>What we collect</h2>
          <p>
            Account details, profile and CV content you provide, and the audio
            and video processed during AI interviews to produce scores.
          </p>
        </section>
        <section>
          <h2>How interview data is used</h2>
          <p>
            Voice and video are analyzed to generate answer, tone, and
            expression scores. Companies see analysis tied only to roles you
            apply to.
          </p>
        </section>
        <section>
          <h2>Your controls</h2>
          <p>
            You can edit your profile, manage your CVs (including soft-delete and
            restore), and request account deletion at any time.
          </p>
        </section>
        <section>
          <h2>Contact</h2>
          <p>Questions about privacy? Reach us through the contact page.</p>
        </section>
      </LegalBody>
    </MarketingShell>
  );
}
