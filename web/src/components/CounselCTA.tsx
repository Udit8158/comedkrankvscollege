import { LeadCTA } from "./LeadCTA";
import {
  WHATSAPP_DISPLAY,
  WHATSAPP_NUMBER,
  type CtaPlacement,
} from "@/lib/mindcreed";

/**
 * The lead block — set in the same editorial voice as the rest of the page: a
 * mono eyebrow, a serif statement, a paragraph of plain reasoning, one button.
 * No card, no shadow, no colour block. It reads as the next section of the
 * document rather than an ad dropped into it, which is the whole reason it can
 * sit inline without costing the page its tone.
 *
 * It is only ever rendered after the tool has done its job — never before a
 * rank produces something. It does now ask for a phone number, but nothing is
 * hidden behind it: every result above is already on screen and stays free
 * whether or not the form is ever opened. Gating results is the obvious way to
 * farm more leads here, and it would trade the channel's credibility — which is
 * the actual asset — for a worse version of what CollegeDunia already does.
 */
export function CounselCTA({
  eyebrow,
  head,
  headTail,
  body,
  ctaLabel,
  placement,
  rank,
  collegeName,
  collegeCode,
  matchCount,
  className = "",
}: {
  eyebrow: string;
  head: string;
  headTail?: string;
  body: string;
  ctaLabel: string;
  placement: CtaPlacement;
  rank?: number;
  collegeName?: string;
  collegeCode?: string;
  matchCount?: number;
  className?: string;
}) {
  return (
    <section className={`mt-20 border-t border-hairline pt-8 ${className}`}>
      <span className="eyebrow">{eyebrow}</span>

      <h2 className="display text-[26px] sm:text-[32px] leading-[1.12] mt-4 max-w-lg">
        {head}{" "}
        {headTail && (
          <span className="display-italic text-fg-mute">{headTail}</span>
        )}
      </h2>

      <p className="mt-5 max-w-md text-[15px] text-fg-mute leading-relaxed">
        {body}
      </p>

      <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
        <LeadCTA
          placement={placement}
          rank={rank}
          collegeName={collegeName}
          collegeCode={collegeCode}
          matchCount={matchCount}
          label={ctaLabel}
        />
        {/* The number stays visible next to the button. A student who would
            rather dial than wait for a callback shouldn't have to hunt for it
            in the footer — and on a phone this is one tap. */}
        <a
          href={`tel:+${WHATSAPP_NUMBER}`}
          className="linkmark font-mono text-[11px] text-fg-dim tracking-wider"
        >
          or call {WHATSAPP_DISPLAY}
        </a>
      </div>
    </section>
  );
}
