import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { TierLegend } from "@/components/TierLegend";
import { SiteFooter } from "@/components/SiteFooter";
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
  title: "COMEDK 2025 cut-off lookup",
  description:
    "Enter your COMEDK rank, see the colleges and branches that fit. Based on the official 2025 Round 3 cut-offs.",
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
      </body>
    </html>
  );
}
