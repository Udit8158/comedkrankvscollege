import { MindCreedMark } from "./brand/MindCreedMark";
import { WhatsAppCTA } from "./WhatsAppCTA";
import { BRAND } from "@/lib/mindcreed";

/**
 * Footer — the brand block. Carries the ownership statement, the three places a
 * student can reach MindCreed, and the accuracy disclaimer.
 *
 * The disclaimer is here on purpose rather than tucked away: this tool now
 * carries a real consultancy's name, and a student who feels misled by a
 * predicted seat blames the brand on it. Saying plainly what the numbers are —
 * one round, one category, last year — is what makes the rest believable.
 */
export function SiteFooter() {
  return (
    <footer className="mt-24 pt-10 border-t border-hairline">
      <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-8">
        <div>
          <span className="inline-flex items-center gap-3">
            <MindCreedMark size={26} className="text-accent shrink-0" />
            <span className="font-mono text-[15px] uppercase tracking-[0.22em] text-fg">
              MindCreed
            </span>
          </span>
          <p className="mt-4 max-w-xs text-[14px] text-fg-mute leading-relaxed">
            {BRAND.descriptor}
          </p>
        </div>

        <nav
          aria-label="MindCreed links"
          className="flex flex-col items-start gap-3"
        >
          <WhatsAppCTA
            placement="footer"
            variant="quiet"
            label="WhatsApp a counsellor"
          />
          <a
            href={BRAND.site}
            target="_blank"
            rel="noopener noreferrer"
            className="linkmark font-mono text-[12px] text-fg-mute tracking-wider"
          >
            mindcreed.in ↗
          </a>
          <a
            href={BRAND.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="linkmark font-mono text-[12px] text-fg-mute tracking-wider"
          >
            youtube.com/@mindcreed23 ↗
          </a>
        </nav>
      </div>

      <div className="mt-10 pt-6 border-t border-hairline flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
        <p className="max-w-lg text-[12px] text-fg-mute leading-relaxed">
          Cut-offs are the official COMEDK 2025 Round 3 allotment, General Merit
          only. Indicative of where a rank stands — not a guarantee of a seat.
        </p>
        <a
          href="https://www.linkedin.com/in/uditkundu19/"
          target="_blank"
          rel="noopener noreferrer"
          className="signature group inline-flex items-baseline gap-2"
          aria-label="Tool built by Udit Kundu — open LinkedIn profile"
        >
          <span className="font-mono text-[11px] tracking-wider text-fg-dim group-hover:text-fg-mute transition-colors">
            tool by
          </span>
          <span className="signature-name font-mono text-[11px] tracking-wider text-fg-mute">
            Udit Kundu
          </span>
          <span
            aria-hidden
            className="signature-arrow font-mono text-[10px] text-fg-dim tracking-wider"
          >
            ↗
          </span>
        </a>
      </div>
    </footer>
  );
}
