/**
 * Tier legend — shown at the foot of every page so the SAFE / MODERATE / REACH
 * markers in any cut-off table on the site have a single, universal key.
 */
export function TierLegend() {
  return (
    <section
      aria-label="cut-off tier legend"
      className="pt-8 border-t border-hairline flex flex-wrap items-center gap-x-10 gap-y-3 text-[12px]"
    >
      <span className="flex items-center gap-2">
        <span className="tier safe">safe</span>
        <span className="text-fg-mute">easy peasy for you</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="tier moderate">moderate</span>
        <span className="text-fg-mute">gonna be very close</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="tier reach">reach</span>
        <span className="text-fg-mute">most likely you will miss</span>
      </span>
    </section>
  );
}
