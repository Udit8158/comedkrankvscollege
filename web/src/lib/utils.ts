import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRank(n: number): string {
  // Indian numbering with thin spaces — feels documentary, not slick.
  return n.toLocaleString("en-IN");
}

/** Split college "Name-Locality, City" into title + locality. */
export function splitCollegeName(s: string): {
  title: string;
  locality: string;
} {
  const idx = s.indexOf("-");
  if (idx === -1) return { title: s, locality: "" };
  return { title: s.slice(0, idx).trim(), locality: s.slice(idx + 1).trim() };
}
