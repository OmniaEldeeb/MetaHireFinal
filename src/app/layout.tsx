import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import "./globals.css";

const SITE = "MetaHire";
const DESCRIPTION =
  "MetaHire uses real AI to match candidates with jobs, analyze CVs automatically, and help companies create postings in seconds.";

export const metadata: Metadata = {
  title: {
    default: `${SITE} — Smart Hiring, Smarter Careers`,
    template: `%s · ${SITE}`,
  },
  description: DESCRIPTION,
  applicationName: SITE,
  keywords: ["AI hiring", "AI interview", "job matching", "CV builder", "recruitment"],
  openGraph: {
    title: `${SITE} — Smart Hiring, Smarter Careers`,
    description: DESCRIPTION,
    type: "website",
    siteName: SITE,
  },
  twitter: { card: "summary_large_image", title: SITE, description: DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0b0f" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Fonts via <link> (no build-time fetch) — falls back to system
            fonts gracefully if the network blocks Google Fonts. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        {/* Skip-to-content for keyboard/screen-reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-xl focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
