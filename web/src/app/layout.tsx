import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { TierLegend } from "@/components/TierLegend";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { RankProvider } from "@/components/RankContext";
import { LeadProvider } from "@/components/LeadContext";
import { SITE_URL } from "@/lib/site";
import { BRAND, WHATSAPP_NUMBER } from "@/lib/mindcreed";
import "./globals.css";

// Runs before paint to set the initial theme (stored choice, else system
// preference) so there's no flash of the wrong theme on load. Dark is the
// default; only the `light` class is added.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}if(t==='light')document.documentElement.classList.add('light');}catch(e){}})();`;

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Keyword-first, brand last: the COMEDK terms are what earns the click in
  // search, the brand is what the student remembers afterwards.
  title: {
    default: "COMEDK 2026 Rank vs College — College Predictor | MindCreed",
    template: "%s — COMEDK 2026 Cutoffs & Placements | MindCreed",
  },
  description:
    "COMEDK 2026 rank-to-college predictor by MindCreed. Enter your COMEDK rank to see the colleges and branches you can get, based on the official COMEDK 2025 Round 3 cut-offs.",
  keywords: [
    "COMEDK 2026",
    "COMEDK 2026 rank vs college",
    "COMEDK 2026 college predictor",
    "COMEDK rank predictor",
    "COMEDK 2026 cutoff",
    "COMEDK college list",
    "Karnataka engineering colleges",
    "MindCreed",
    "COMEDK counselling Bangalore",
  ],
  applicationName: "MindCreed COMEDK Rank vs College",
  authors: [{ name: BRAND.name, url: BRAND.site }],
  creator: BRAND.name,
  publisher: BRAND.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: BRAND.name,
    title: "COMEDK 2026 Rank vs College — College Predictor | MindCreed",
    description:
      "Enter your COMEDK rank, see the colleges and branches that fit. Based on the official COMEDK 2025 Round 3 cut-offs. By MindCreed, Bengaluru.",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "COMEDK 2026 Rank vs College — College Predictor | MindCreed",
    description:
      "Enter your COMEDK rank, see the colleges and branches that fit. Based on COMEDK 2025 Round 3 cut-offs.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

/** Ties the tool to the consultancy for search engines: who publishes it, how
 *  to reach them, and which profiles are the same entity. */
const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: BRAND.name,
  url: BRAND.site,
  sameAs: [BRAND.youtube, BRAND.site],
  areaServed: "Bengaluru, Karnataka, India",
  description:
    "MindCreed is an admission consultancy in Bengaluru guiding students through COMEDK, KCET and management-quota engineering and medical admissions.",
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: `+${WHATSAPP_NUMBER}`,
      contactType: "admissions counselling",
      areaServed: "IN",
      availableLanguage: ["en", "hi", "kn"],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${instrument.variable} ${mono.variable}`}
    >
      <body className="bg-paper min-h-dvh flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
        />
        {/* RankProvider wraps header + page so the header's CTA can carry
            whatever rank the student has typed. LeadProvider sits inside it and
            holds the single lead-form dialog every CTA opens. */}
        <RankProvider>
          <LeadProvider>
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <div className="mx-auto w-full max-w-3xl px-6 sm:px-10 pb-10">
              <TierLegend />
              <SiteFooter />
            </div>
          </LeadProvider>
        </RankProvider>
        <Analytics />
      </body>
    </html>
  );
}
