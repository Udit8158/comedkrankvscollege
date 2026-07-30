/**
 * Section rule. Static by default (the college page uses it that way); pass
 * `onToggle` and it becomes the accordion header for a collapsible group —
 * same typography, plus an ascii [+]/[−] marker so the affordance reads as
 * part of the documentary set rather than a widget.
 */
export function SectionHead({
  label,
  count,
  expanded,
  onToggle,
  controls,
}: {
  label: string;
  count?: number;
  /** Only meaningful alongside `onToggle`. */
  expanded?: boolean;
  onToggle?: () => void;
  /** id of the panel this header opens — for aria-controls. */
  controls?: string;
}) {
  const inner = (
    <>
      <span className="eyebrow section-label">─── {label}</span>
      {typeof count === "number" && (
        <span className="font-mono text-[11px] text-fg-dim tracking-wider">
          {count.toString().padStart(2, "0")} {count === 1 ? "match" : "matches"}
        </span>
      )}
      <span className="flex-1 h-px bg-hairline translate-y-[-2px]" />
      {onToggle && (
        <span
          className="section-mark font-mono text-[11px] text-fg-dim tracking-wider"
          aria-hidden="true"
        >
          [{expanded ? "−" : "+"}]
        </span>
      )}
    </>
  );

  if (!onToggle) {
    return (
      <div className="flex items-baseline gap-3 pb-3 pt-10 first:pt-2">
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls={controls}
      className="section-toggle w-full text-left flex items-baseline gap-3 py-4"
    >
      {inner}
    </button>
  );
}
