export function SiteFooter() {
  return (
    <footer className="mt-32 pt-10 border-t border-hairline flex justify-center">
      <a
        href="https://www.linkedin.com/in/uditkundu19/"
        target="_blank"
        rel="noopener noreferrer"
        className="signature group inline-flex items-baseline gap-3"
        aria-label="Created by Udit Kundu — open LinkedIn profile"
      >
        <span className="eyebrow group-hover:text-fg transition-colors">
          crafted by
        </span>
        <span className="signature-name display-italic text-[20px] sm:text-[22px] text-fg">
          Udit Kundu
        </span>
        <span
          aria-hidden
          className="signature-arrow font-mono text-[11px] text-fg-dim tracking-wider group-hover:text-accent transition-colors"
        >
          ↗
        </span>
      </a>
    </footer>
  );
}
