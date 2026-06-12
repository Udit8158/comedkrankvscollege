import type { CollegeMeta } from "@/lib/colleges";

export function PlacementStrip({
  placement,
}: {
  placement?: CollegeMeta["placement"];
}) {
  const cse = placement?.cseAvgLpa;
  const overall = placement?.overallAvgLpa;
  const hasData = cse !== undefined || overall !== undefined;

  return (
    <section className="mt-20">
      <div className="flex items-baseline justify-between border-b border-hairline pb-3">
        <span className="eyebrow">placement</span>
        {placement?.year && (
          <span className="font-mono text-[12px] text-fg-mute tabular-nums">
            {placement.year}
          </span>
        )}
      </div>

      {hasData ? (
        <div className="grid grid-cols-2 gap-x-10 mt-6">
          {cse !== undefined && <Cell label="cse avg" value={cse} />}
          {overall !== undefined && (
            <Cell label="overall avg" value={overall} />
          )}
        </div>
      ) : (
        <p className="mt-5 display-italic text-[18px] text-fg-mute max-w-md">
          placement data — not yet published.
        </p>
      )}
    </section>
  );
}

function Cell({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="eyebrow text-fg-dim">{label}</p>
      <p className="font-mono text-[34px] sm:text-[44px] text-fg mt-1 leading-none tabular-nums">
        {value}
        <span className="text-fg-mute text-[18px] sm:text-[22px] ml-2">
          LPA
        </span>
      </p>
    </div>
  );
}
