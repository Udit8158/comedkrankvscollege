import { COLLEGES, type CollegeMeta } from "@/data/colleges";

const BY_CODE: Map<string, CollegeMeta> = new Map(
  COLLEGES.map((c) => [c.code, c]),
);

/** Look up a college by its primary key (e.g. "E095"). */
export function getCollege(code: string): CollegeMeta | undefined {
  return BY_CODE.get(code);
}

/** All colleges, in source order. */
export function listColleges(): CollegeMeta[] {
  return COLLEGES;
}

/** Convenience: full display name including locality + city when available. */
export function fullName(c: CollegeMeta): string {
  const tail = [c.locality, c.city].filter(Boolean).join(", ");
  return tail ? `${c.name}-${tail}` : c.name;
}

export type { CollegeMeta };
