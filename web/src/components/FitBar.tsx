/**
 * Fit bar — a tiny mono-text density meter that shows how comfortably
 * a rank sits below a cut-off. The pivot character "│" is where the
 * cut-off is; filled cells to the left represent the user's headroom.
 *
 * This is the page's signature element. Used everywhere the user has
 * a rank entered, hidden otherwise.
 */

const SEGMENTS = 8;

export function FitBar({ fit, tier }: { fit: number; tier: "safe" | "moderate" | "reach" }) {
  if (tier === "reach") {
    // Past the line — bar is empty, only pivot and a small tail past it.
    return (
      <span className="fit-bar" aria-hidden>
        <span>{"·".repeat(SEGMENTS)}</span>
        <span className="pivot">│</span>
        <span className="text-reach">{"▮▮"}</span>
      </span>
    );
  }

  // Always show at least one filled cell for a qualifying match — even a
  // barely-qualifying rank should visually differ from a reach.
  const filled = Math.max(1, Math.round(fit * SEGMENTS));
  const empty = SEGMENTS - filled;

  return (
    <span className="fit-bar" aria-hidden>
      <span className="filled">{"▮".repeat(filled)}</span>
      <span>{"·".repeat(empty)}</span>
      <span className="pivot">│</span>
    </span>
  );
}
