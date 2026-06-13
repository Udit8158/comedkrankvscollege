"use client";

import { Moon, Sun } from "lucide-react";

/**
 * Sun/moon theme toggle, fixed in the top-right corner. Flips the `light` class
 * on <html> — CSS swaps both the palette and which icon is visible — and stores
 * the choice in localStorage. The pre-paint script in layout.tsx applies the
 * saved/system theme so there's no flash; rendering both icons keeps the server
 * and client markup identical (no hydration mismatch).
 */
export function ThemeToggle() {
  function toggle() {
    const isLight = document.documentElement.classList.toggle("light");
    try {
      localStorage.setItem("theme", isLight ? "light" : "dark");
    } catch {
      /* storage disabled (private mode) — toggle still works for the session */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light and dark theme"
      title="Toggle light / dark"
      className="fixed top-4 right-4 sm:top-5 sm:right-5 z-50 inline-grid h-9 w-9 place-items-center rounded-full border border-hairline bg-[color:var(--bg-base)] text-fg-mute transition-colors hover:text-accent hover:border-[color:var(--accent-line)]"
    >
      <span aria-hidden className="grid h-4 w-4 place-items-center">
        <Sun className="theme-ico-sun" size={16} strokeWidth={1.75} />
        <Moon className="theme-ico-moon" size={16} strokeWidth={1.75} />
      </span>
    </button>
  );
}
