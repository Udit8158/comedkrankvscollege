"use client";

import { track } from "@vercel/analytics";
import { WhatsAppGlyph } from "./brand/WhatsAppGlyph";
import { waLink, type CtaPlacement } from "@/lib/mindcreed";

/**
 * The one lead affordance in the app. Every CTA is this component so the
 * message, the number and the analytics event can never drift between surfaces.
 *
 * `variant`:
 *   solid — the brass button. One per view, at the point of highest intent.
 *   quiet — a mono text link. Used for the ambient header/footer placements,
 *           where a filled button would read as an ad bar.
 *
 * Each click fires a `whatsapp_cta` event carrying the placement and rank, so
 * the tool's output is countable — which of these spots actually produces
 * conversations, and at what ranks students ask for help.
 */
export function WhatsAppCTA({
  placement,
  rank,
  collegeName,
  collegeCode,
  matchCount,
  label,
  variant = "solid",
  className = "",
}: {
  placement: CtaPlacement;
  rank?: number;
  collegeName?: string;
  collegeCode?: string;
  matchCount?: number;
  label: string;
  variant?: "solid" | "quiet";
  className?: string;
}) {
  const href = waLink({ placement, rank, collegeName, collegeCode, matchCount });

  function onClick() {
    track("whatsapp_cta", {
      placement,
      rank: rank && rank > 0 ? rank : 0,
      college: collegeCode ?? "",
    });
  }

  // An empty label means icon-only (the narrow-screen header), which needs its
  // accessible name from aria-label instead of the missing text node. It also
  // takes no base class: .cta-quiet sets `display` and `color`, and being
  // authored after Tailwind's layer it would beat the caller's `sm:hidden` and
  // `text-accent` utilities.
  const iconOnly = label.length === 0;
  const base = iconOnly
    ? ""
    : variant === "solid"
      ? "cta-brass inline-flex items-center gap-2.5"
      : "cta-quiet inline-flex items-center gap-2";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      aria-label={iconOnly ? "Talk to a MindCreed counsellor on WhatsApp" : undefined}
      className={`${base} ${className}`}
    >
      <WhatsAppGlyph size={variant === "solid" ? 15 : iconOnly ? 15 : 13} />
      {!iconOnly && <span>{label}</span>}
    </a>
  );
}
