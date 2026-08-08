"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Page through the list, keeping every active filter.
 *
 * Prev/next only, with a plain "51–100 of 340" between them. Numbered page
 * links would be five more tap targets for a list that is read newest-first and
 * rarely gets past page two — the search box is how anyone finds an old lead,
 * not page seven.
 */
export function Pagination({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  function go(next: number) {
    const query = new URLSearchParams(params.toString());
    if (next <= 1) query.delete("page");
    else query.set("page", String(next));
    router.push(`${pathname}?${query.toString()}`);
  }

  return (
    <nav
      aria-label="Pagination"
      className="rule mt-8 flex items-center justify-between gap-4 pt-5"
    >
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className="cta-quiet cursor-pointer disabled:cursor-default disabled:opacity-30"
      >
        ← Newer
      </button>

      <span className="font-mono text-[11px] tracking-wider tabular-nums text-fg-dim">
        {from}–{to} of {total}
      </span>

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page >= pages}
        className="cta-quiet cursor-pointer disabled:cursor-default disabled:opacity-30"
      >
        Older →
      </button>
    </nav>
  );
}
