import { TierLegend } from "@/components/TierLegend";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { RankProvider } from "@/components/RankContext";
import { LeadProvider } from "@/components/LeadContext";

/**
 * Chrome for the public tool — the predictor and the college pages.
 *
 * This is verbatim what used to sit in the root layout; the only change is
 * where it lives. `(site)` is a route group, so no URL moves: `/` and
 * `/college/[code]` are exactly where they were. What it buys is that
 * `/dashboard` and `/login` sit outside it and inherit none of this.
 */
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // RankProvider wraps header + page so the header's CTA can carry whatever
    // rank the student has typed. LeadProvider sits inside it and holds the
    // single lead-form dialog every CTA opens.
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
  );
}
