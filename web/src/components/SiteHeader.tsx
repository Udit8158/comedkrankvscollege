"use client";

import Link from "next/link";
import { MindCreedLockup } from "./brand/MindCreedMark";
import { WhatsAppCTA } from "./WhatsAppCTA";
import { ThemeToggle } from "./ThemeToggle";
import { useRank } from "./RankContext";

/**
 * Slim brand bar — the only persistent chrome in the app.
 *
 * It does two jobs that would otherwise need two elements: it says whose tool
 * this is, and it keeps a counsellor one tap away at any scroll depth. That is
 * deliberately instead of a sticky bottom CTA bar: on a phone the results list
 * is the whole point of the page, and a floating bar would sit on top of it for
 * the entire session. 48px of hairline at the top costs the layout far less.
 *
 * The CTA carries whatever rank has been typed (see RankContext), so it is
 * contextual rather than generic even though it never moves.
 */
export function SiteHeader() {
  const { rank } = useRank();

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-[color:var(--bg-base)]/85 backdrop-blur-md supports-[backdrop-filter]:bg-[color:var(--bg-base)]/70">
      <div className="mx-auto w-full max-w-3xl px-6 sm:px-10">
        <div className="flex h-[52px] items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="MindCreed — home"
            className="shrink-0 opacity-90 transition-opacity hover:opacity-100"
          >
            <MindCreedLockup size={19} nameClass="text-[12px] sm:text-[13px]" />
          </Link>

          <div className="flex items-center gap-3 sm:gap-5">
            {/* Desktop: worded link. Mobile: glyph only — the label would crowd
                the wordmark, and the icon is unambiguous at this size.
                Visibility lives on the wrappers, not the links: the links carry
                their own display utility, and two display classes on one
                element resolve by stylesheet order rather than breakpoint. */}
            <span className="hidden sm:block">
              <WhatsAppCTA
                placement="header"
                rank={rank || undefined}
                variant="quiet"
                label="Talk to a counsellor"
              />
            </span>
            <span className="sm:hidden">
              <WhatsAppCTA
                placement="header"
                rank={rank || undefined}
                variant="quiet"
                label=""
                className="inline-grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[color:var(--accent-line)] text-accent transition-opacity hover:opacity-75"
              />
            </span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
