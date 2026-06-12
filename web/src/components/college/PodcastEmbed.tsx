import type { CollegeMeta } from "@/lib/colleges";

export function PodcastEmbed({
  podcast,
}: {
  podcast: NonNullable<CollegeMeta["podcast"]>;
}) {
  const src = `https://www.youtube-nocookie.com/embed/${podcast.youtubeId}`;
  const watchUrl = `https://youtu.be/${podcast.youtubeId}`;

  return (
    <section className="mt-20">
      <div className="flex items-baseline justify-between border-b border-hairline pb-3">
        <span className="eyebrow">student podcast</span>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="linkmark font-mono text-[11px] text-fg-mute tracking-wider"
        >
          watch on youtube ↗
        </a>
      </div>

      <div className="mt-5 aspect-video relative border border-hairline overflow-hidden">
        <iframe
          src={src}
          title={podcast.title ?? "Student podcast"}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>

      {podcast.title && (
        <p className="mt-3 display-italic text-[15px] text-fg-mute">
          {podcast.title}
        </p>
      )}
    </section>
  );
}
