import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 sm:px-10 pt-20 pb-32">
      <p className="eyebrow">404 · college</p>
      <h1 className="display text-[44px] sm:text-[60px] leading-tight mt-4">
        That code isn&apos;t in the dataset.
      </h1>
      <p className="mt-6 max-w-md text-[15px] text-fg-mute leading-relaxed">
        The COMEDK Round 3 2025 list covers 150 colleges by code (E001 – E217).
        If you hit this page from a typed URL, double-check the code.
      </p>
      <Link
        href="/"
        className="linkmark font-mono text-[12px] text-fg-mute tracking-wider inline-block mt-8"
      >
        ← back to predictor
      </Link>
    </main>
  );
}
