/**
 * The MindCreed mark — an open book whose page edges read as an "M".
 *
 * Drawn as a stroked path in `currentColor` rather than shipped as the raster
 * logo. Two reasons: the source logo is a 200px JPEG on a plum tile, which is
 * both soft on retina and a colour that fights this app's paper-and-brass
 * palette; and a monochrome lockup inherits the theme, so the mark stays legible
 * in both light and dark without a second asset.
 */
export function MindCreedMark({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={(size * 56) / 64}
      viewBox="0 0 64 56"
      fill="none"
      stroke="currentColor"
      strokeWidth={3.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      className={className}
    >
      {/* Book outline: top edges sweep down to the centre notch (the M's
          vertex), sides drop straight, bottom edges meet at a point. */}
      <path d="M4 6.5C13 8.5 24 12 32 18c8-6 19-9.5 28-11.5V40c-9 2-20 5.5-28 11.5C24 45.5 13 42 4 40Z" />
      {/* Page edges — the M's legs. Outer pair sits higher; inner pair follows
          the centre dip, which is what makes the letterform read. */}
      <path d="M13.5 15v25" />
      <path d="M23 18.5v25" />
      <path d="M41 18.5v25" />
      <path d="M50.5 15v25" />
    </svg>
  );
}

/**
 * MindCreed wordmark lockup — mark plus name. `tone="quiet"` is the header
 * treatment (mark in accent, name in body ink); `tone="loud"` is the footer.
 */
export function MindCreedLockup({
  size = 20,
  nameClass = "text-[13px]",
}: {
  size?: number;
  nameClass?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <MindCreedMark size={size} className="text-accent shrink-0" />
      <span
        className={`font-mono uppercase tracking-[0.22em] text-fg ${nameClass}`}
      >
        MindCreed
      </span>
    </span>
  );
}
