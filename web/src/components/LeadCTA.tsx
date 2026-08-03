"use client";

import { Phone } from "lucide-react";
import { useLead } from "./LeadContext";
import type { CtaPlacement } from "@/lib/mindcreed";

/**
 * The one lead affordance in the app. Replaces the old direct wa.me link: the
 * tap now opens the capture form, so the number is recorded before the
 * conversation starts instead of only existing inside someone's WhatsApp.
 *
 * `variant`:
 *   solid — the brass button. One per view, at the point of highest intent.
 *   quiet — a mono text link, for the ambient header/footer placements where a
 *           filled button would read as an ad bar.
 *
 * No WhatsApp glyph here any more — it would promise a chat and open a form.
 * The green glyph reappears in the dialog's success state, where it is true.
 */
export function LeadCTA({
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
  const { openLead } = useLead();

  // An empty label means icon-only (the narrow-screen header), which takes its
  // accessible name from aria-label. It also takes no base class: .cta-quiet
  // sets `display` and `color`, and being authored after Tailwind's layer it
  // would beat the caller's `sm:hidden` and `text-accent` utilities.
  const iconOnly = label.length === 0;
  const base = iconOnly
    ? ""
    : variant === "solid"
      ? "cta-brass inline-flex items-center justify-center gap-2.5"
      : "cta-quiet inline-flex items-center gap-2";

  return (
    <button
      type="button"
      onClick={() =>
        openLead({ placement, rank, collegeName, collegeCode, matchCount })
      }
      aria-label={iconOnly ? "Request a callback from MindCreed" : undefined}
      aria-haspopup="dialog"
      className={`${base} cursor-pointer ${className}`}
    >
      {iconOnly ? (
        <Phone size={14} strokeWidth={1.75} aria-hidden />
      ) : (
        <span>{label}</span>
      )}
    </button>
  );
}
