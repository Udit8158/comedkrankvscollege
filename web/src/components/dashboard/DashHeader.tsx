import { MindCreedLockup } from "@/components/brand/MindCreedMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Session } from "@/lib/auth/session";

/**
 * Staff bar. Same 52px hairline rule as the public header so the two feel like
 * one product, with the CTA swapped for who you are and the way out.
 *
 * The signed-in address is spelled out rather than hidden behind an avatar
 * menu: two or three people share this dashboard and at least one of them will
 * have two Google accounts, so "which account am I in?" is a question worth
 * answering without a click.
 */
export function DashHeader({ session }: { session: Session }) {
  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-[color:var(--bg-base)]/85 backdrop-blur-md supports-[backdrop-filter]:bg-[color:var(--bg-base)]/70">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="flex h-[52px] items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <MindCreedLockup size={18} nameClass="text-[11px] sm:text-[12px]" />
            <span
              aria-hidden
              className="hidden font-mono text-[11px] text-fg-dim sm:inline"
            >
              /
            </span>
            <span className="eyebrow hidden sm:inline">leads</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <span className="hidden max-w-[22ch] truncate font-mono text-[11px] tracking-wide text-fg-dim sm:inline">
              {session.email}
            </span>
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="cta-quiet cursor-pointer">
                Sign out
              </button>
            </form>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
