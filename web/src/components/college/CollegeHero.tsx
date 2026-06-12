import type { CollegeMeta } from "@/lib/colleges";

export function CollegeHero({ college }: { college: CollegeMeta }) {
  const metaBits = [
    college.code,
    college.established ? `est. ${college.established}` : null,
    college.type,
  ].filter(Boolean);

  const place = [college.locality, college.city].filter(Boolean).join(" · ");

  return (
    <section className="pt-2">
      <p className="eyebrow">{metaBits.join("  ·  ")}</p>
      <h1 className="display text-[44px] sm:text-[60px] md:text-[76px] leading-[0.96] mt-4 tracking-tight">
        {college.name}
      </h1>
      {place && (
        <p className="mt-4 font-mono text-[12px] text-fg-mute tracking-wider uppercase">
          {place}
        </p>
      )}
      {college.about && (
        <p className="mt-6 max-w-xl text-[15px] text-fg-mute leading-relaxed">
          {college.about}
        </p>
      )}
      {college.website && (
        <p className="mt-4">
          <a
            href={college.website}
            target="_blank"
            rel="noopener noreferrer"
            className="linkmark font-mono text-[12px] text-fg-mute tracking-wider"
          >
            {college.website.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗
          </a>
        </p>
      )}
    </section>
  );
}
