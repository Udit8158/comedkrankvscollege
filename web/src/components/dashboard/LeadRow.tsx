"use client";

import { useState, useTransition } from "react";
import { setLeadNote, setLeadStatus } from "@/app/dashboard/actions";
import { WhatsAppGlyph } from "@/components/brand/WhatsAppGlyph";
import { LEAD_STATUSES, STATUS_META, type LeadStatus } from "@/lib/lead-status";
import { formatPhone } from "@/lib/leads";
import {
  formatAge,
  formatDate,
  formatRank,
  formatTime,
  PLACEMENT_HINT,
  placementLabel,
} from "@/lib/dash-format";
import type { LeadRecord } from "@/lib/leads-store";
import type { CtaPlacement } from "@/lib/mindcreed";

/**
 * One lead, as a record card rather than a table row.
 *
 * A six-column table is the obvious shape and the wrong one here: the columns
 * that matter (number, status) are two of six, the rest is context that only
 * matters once you've decided to call, and on a phone — where a counsellor
 * actually works through this list — it collapses into unreadable slivers. So
 * the number leads, the context sits under it in one mono line, and the two
 * controls sit right where the eye ends up.
 *
 * The number is a link twice over. Tapping it dials; the glyph beside it opens
 * WhatsApp on the same number. Both are the entire job of this page, so neither
 * is behind a menu.
 */
export function LeadRow({ lead, now }: { lead: LeadRecord; now: number }) {
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [note, setNote] = useState(lead.note ?? "");
  const [savedNote, setSavedNote] = useState(lead.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function changeStatus(next: LeadStatus) {
    const previous = status;
    // Optimistic: the select shows the new value immediately and rolls back if
    // the write fails. A counsellor moving ten rows should not wait on ten
    // round trips, and a status that snaps back is unambiguous when it does.
    setStatus(next);
    setError(null);
    startTransition(async () => {
      const result = await setLeadStatus(lead.id, next);
      if (!result.ok) {
        setStatus(previous);
        setError(result.error ?? "Could not save.");
      }
    });
  }

  function commitNote() {
    const trimmed = note.trim();
    if (trimmed === savedNote.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await setLeadNote(lead.id, trimmed);
      if (result.ok) {
        setSavedNote(trimmed);
      } else {
        setError(result.error ?? "Could not save.");
      }
    });
  }

  const meta = [
    lead.rank > 0 ? `rank ${formatRank(lead.rank)}` : null,
    placementLabel(lead.placement),
    lead.collegeName ??
      (lead.collegeCode ? `College ${lead.collegeCode}` : null),
    typeof lead.matchCount === "number"
      ? `${lead.matchCount} option${lead.matchCount === 1 ? "" : "s"} shown`
      : null,
  ].filter(Boolean) as string[];

  return (
    <li className={`row px-1 py-4 ${pending ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <a
              href={`tel:+91${lead.phone}`}
              className="font-mono text-[17px] tracking-[0.02em] tabular-nums text-fg transition-colors hover:text-accent"
            >
              {formatPhone(lead.phone)}
            </a>
            <a
              href={`https://wa.me/91${lead.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open WhatsApp with ${formatPhone(lead.phone)}`}
              className="text-fg-dim transition-colors hover:text-accent"
            >
              <WhatsAppGlyph size={15} />
            </a>
          </div>

          <p
            className="mt-2 font-mono text-[11px] leading-relaxed tracking-wide text-fg-mute"
            title={PLACEMENT_HINT[lead.placement as CtaPlacement]}
          >
            {meta.join("  ·  ")}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <time
            dateTime={lead.createdAt}
            title={`${formatDate(lead.createdAt)}, ${formatTime(lead.createdAt)}`}
            className="font-mono text-[11px] tracking-wider whitespace-nowrap text-fg-dim"
          >
            {formatAge(lead.createdAt, now)}
          </time>

          <label>
            <span className="sr-only">
              Status for {formatPhone(lead.phone)}
            </span>
            <select
              value={status}
              disabled={pending}
              onChange={(e) => changeStatus(e.target.value as LeadStatus)}
              className={`dash-status tone-${STATUS_META[status].tone}`}
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* The note. Always present, never a button you have to find first — the
          thing worth writing down is remembered during the call, not after
          hunting for where to put it. Saves on blur; no Save button to forget.

          The "last touched by" credit rides on this same line rather than
          taking one of its own. At fifty rows a page that line was costing more
          vertical space than the notes it was annotating, and it is the least
          consulted thing in the row — it answers "who spoke to them?", which
          only matters once you have already decided to open the lead. */}
      <div className="mt-2 flex items-start gap-2.5">
        <span aria-hidden className="mt-[7px] h-px w-3 shrink-0 bg-hairline" />
        <textarea
          value={note}
          rows={1}
          disabled={pending}
          onChange={(e) => setNote(e.target.value)}
          onBlur={commitNote}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.blur();
            }
            if (e.key === "Escape") {
              setNote(savedNote);
              e.currentTarget.blur();
            }
          }}
          placeholder="Add a note…"
          aria-label={`Note for ${formatPhone(lead.phone)}`}
          className="dash-note"
        />
        {lead.updatedBy && (
          <span
            title={`Last updated by ${lead.updatedBy}`}
            className="mt-[3px] shrink-0 font-mono text-[10px] tracking-wider text-fg-dim"
          >
            {lead.updatedBy.split("@")[0]}
          </span>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-2 pl-[22px] font-mono text-[10px] tracking-wider text-reach"
        >
          {error}
        </p>
      )}
    </li>
  );
}
