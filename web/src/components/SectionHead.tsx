export function SectionHead({
  label,
  count,
}: {
  label: string;
  count?: number;
}) {
  return (
    <div className="flex items-baseline gap-3 pb-3 pt-10 first:pt-2">
      <span className="eyebrow">─── {label}</span>
      {typeof count === "number" && (
        <span className="font-mono text-[11px] text-fg-dim tracking-wider">
          {count.toString().padStart(2, "0")} {count === 1 ? "match" : "matches"}
        </span>
      )}
      <span className="flex-1 h-px bg-hairline translate-y-[-2px]" />
    </div>
  );
}
