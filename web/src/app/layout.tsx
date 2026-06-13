import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { TierLegend } from "@/components/TierLegend";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

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
  title: {
    default: "COMEDK 2026 Rank vs College — College Predictor",
    template: "%s — COMEDK 2026 Cutoffs & Placements",
  },
  description:
    "COMEDK 2026 rank-to-college predictor. Enter your COMEDK rank to see the colleges and branches you can get, based on the official COMEDK 2025 Round 3 cut-offs.",
  keywords: [
    "COMEDK 2026",
    "COMEDK 2026 rank vs college",
    "COMEDK 2026 college predictor",
    "COMEDK rank predictor",
    "COMEDK 2026 cutoff",
    "COMEDK college list",
    "Karnataka engineering colleges",
  ],
  applicationName: "COMEDK Rank vs College",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "COMEDK 2026 Rank vs College",
    title: "COMEDK 2026 Rank vs College — College Predictor",
    description:
      "Enter your COMEDK rank, see the colleges and branches that fit. Based on the official COMEDK 2025 Round 3 cut-offs.",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "COMEDK 2026 Rank vs College — College Predictor",
    description:
      "Enter your COMEDK rank, see the colleges and branches that fit. Based on COMEDK 2025 Round 3 cut-offs.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${instrument.variable} ${mono.variable}`}
    >
      <body className="bg-paper min-h-dvh flex flex-col">
        <div className="flex-1">{children}</div>
        <div className="mx-auto w-full max-w-3xl px-6 sm:px-10 pb-10">
          <TierLegend />
          <SiteFooter />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
