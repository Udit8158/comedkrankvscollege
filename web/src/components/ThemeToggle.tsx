"use client";

import { Moon, Sun } from "lucide-react";

// document.startViewTransition isn't in the default DOM lib types yet.
type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => unknown;
};

/**
 * Sun/moon theme toggle, fixed in the top-right corner. Flips the `light` class
 * on <html> — CSS swaps both the palette and which icon is visible — and stores
 * the choice in localStorage. The pre-paint script in layout.tsx applies the
 * saved/system theme so there's no flash; rendering both icons keeps the server
 * and client markup identical (no hydration mismatch).
 *
 * The switch runs inside a View Transition so the whole app crossfades between
 * palettes. That animates a snapshot rather than re-rendering text frame by
 * frame, which avoids the serif-title flicker seen on mobile WebKit when
 * transitioning text color. Falls back to an instant switch where View
 * Transitions are unsupported or the user prefers reduced motion.
 */
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const apply = () => {
      const isLight = root.classList.toggle("light");
      try {
        localStorage.setItem("theme", isLight ? "light" : "dark");
      } catch {
        /* storage disabled (private mode) — toggle still works for the session */
      }
    };

    const doc = document as DocumentWithViewTransition;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!reduceMotion && typeof doc.startViewTransition === "function") {
      doc.startViewTransition(apply);
    } else {
      apply();
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light and dark theme"
      title="Toggle light / dark"
      className="fixed top-4 right-4 sm:top-5 sm:right-5 z-50 inline-grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-hairline bg-[color:var(--bg-base)] text-fg-mute transition-colors hover:text-accent hover:border-[color:var(--accent-line)]"
    >
      <span aria-hidden className="grid h-4 w-4 place-items-center">
        <Sun className="theme-ico-sun" size={16} strokeWidth={1.75} />
        <Moon className="theme-ico-moon" size={16} strokeWidth={1.75} />
      </span>
    </button>
  );
}
