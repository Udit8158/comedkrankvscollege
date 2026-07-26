/**
 * MindCreed brand + lead-capture configuration.
 *
 * Single source of truth for everything client-facing: the phone number, the
 * links, and — most importantly — the pre-filled WhatsApp messages. Every CTA
 * in the app routes through `waLink()` so a message is never hard-coded at the
 * call site and the number only ever changes here.
 *
 * Why WhatsApp and not a form: the audience arrives from a YouTube video on a
 * phone. A form is a second surface to build, host and check; a wa.me tap opens
 * a thread MindCreed already lives in, with the student's rank in the first
 * line — so the lead arrives qualified instead of as a row to chase.
 */

export const BRAND = {
  name: "MindCreed",
  /** Shown under the wordmark in the footer. */
  descriptor: "Engineering & medical admission counselling in Bengaluru.",
  site: "https://mindcreed.in",
  youtube: "https://www.youtube.com/@mindcreed23",
  /** Office landline published on mindcreed.in — kept for the footer only. */
  landline: "+91 80 4680 5801",
} as const;

/** Counselling WhatsApp line. Digits only, country code first — wa.me format. */
export const WHATSAPP_NUMBER = "919740916666";
/** Same number, formatted for display. */
export const WHATSAPP_DISPLAY = "+91 97409 16666";

/**
 * Where a CTA sits. Sent to analytics so the lead flow can be tuned against
 * real numbers rather than taste, and so the value of the tool is reportable.
 */
export type CtaPlacement =
  | "header"
  | "results"
  | "no-matches"
  | "college"
  | "footer";

/** Indian-format rank for use inside message text ("34,500"). */
function fmt(rank: number): string {
  return rank.toLocaleString("en-IN");
}

/**
 * The pre-filled message, written in the student's voice — they are the sender.
 * Each carries the context MindCreed needs to answer without a round of
 * "what's your rank?": the rank itself, and on a college page, which college.
 */
export function waMessage(opts: {
  placement: CtaPlacement;
  rank?: number;
  collegeName?: string;
  collegeCode?: string;
  matchCount?: number;
}): string {
  const { placement, rank, collegeName, collegeCode, matchCount } = opts;
  const hasRank = typeof rank === "number" && rank > 0;
  const rankBit = hasRank ? `my COMEDK rank is ${fmt(rank)}` : "";

  if (placement === "college" && collegeName) {
    const college = collegeCode ? `${collegeName} (${collegeCode})` : collegeName;
    return hasRank
      ? `Hi MindCreed, I want to know about admission to ${college}. ${
          rankBit.charAt(0).toUpperCase() + rankBit.slice(1)
        }.`
      : `Hi MindCreed, I want to know about admission to ${college}. Can you help?`;
  }

  if (placement === "no-matches") {
    return hasRank
      ? `Hi MindCreed, ${rankBit} and the rank tool showed no colleges at this rank. What are my options?`
      : `Hi MindCreed, my COMEDK rank is low and I'm not sure what my options are. Can you help?`;
  }

  if (placement === "results") {
    if (hasRank && matchCount) {
      return `Hi MindCreed, ${rankBit} and the rank tool showed ${matchCount} options. Can you help me pick the right one?`;
    }
    return hasRank
      ? `Hi MindCreed, ${rankBit}. Can you help me shortlist a college?`
      : `Hi MindCreed, I need help shortlisting an engineering college.`;
  }

  // header / footer — the ambient CTA. Rank is included when the student has
  // already typed one, so even a stray tap arrives qualified.
  return hasRank
    ? `Hi MindCreed, ${rankBit}. I was using the rank vs college tool — can you help me choose?`
    : `Hi MindCreed, I need help with COMEDK admission and choosing a college.`;
}

/** Build the click-to-chat URL with the message pre-filled. */
export function waLink(opts: Parameters<typeof waMessage>[0]): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    waMessage(opts),
  )}`;
}
