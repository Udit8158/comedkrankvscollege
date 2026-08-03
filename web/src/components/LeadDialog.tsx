"use client";

import { useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { track } from "@vercel/analytics";
import { WhatsAppGlyph } from "./brand/WhatsAppGlyph";
import {
  formatPhone,
  isValidPhone,
  normalizePhone,
  submitLead,
} from "@/lib/leads";
import { waLink, type CtaPlacement } from "@/lib/mindcreed";

/** What the CTA hands the dialog when it opens it. */
export type LeadRequest = {
  placement: CtaPlacement;
  rank?: number;
  collegeName?: string;
  collegeCode?: string;
  matchCount?: number;
};

/**
 * The lead form — one instance for the whole app, opened from any CTA.
 *
 * Written as a continuation of the document rather than a modal dropped on top
 * of it: mono eyebrow, serif statement, and a bordered docket block that reads
 * like a part-filled official form. The rank the student already typed is
 * printed into that docket rather than asked for again, which is the argument
 * the form makes for itself — it is shorter than the WhatsApp message it
 * replaces.
 *
 * The number is the only thing actually requested. Every extra field is a place
 * to abandon, and MindCreed can ask the rest on the call.
 */
export function LeadDialog({
  request,
  open,
  onOpenChange,
  onClosed,
}: {
  request: LeadRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClosed: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const placement = request?.placement ?? "results";

  // The rank field is derived from the request, not copied into state by an
  // effect: one dialog instance serves every CTA, so a copy would need syncing
  // on each open. `rankEdit` is the student's override and stays null until
  // they actually touch the field — which also makes reset a one-liner.
  const [rankEdit, setRankEdit] = useState<string | null>(null);
  const seededRank =
    request?.rank && request.rank > 0 ? String(request.rank) : "";
  const rank = rankEdit ?? seededRank;

  function reset() {
    setPhone("");
    setRankEdit(null);
    setStatus("idle");
    setError(null);
    onClosed();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;

    if (!isValidPhone(phone)) {
      setError("Enter a valid 10-digit mobile number.");
      phoneRef.current?.focus();
      return;
    }

    setError(null);
    setStatus("sending");

    const parsedRank = parseInt(rank, 10);
    const result = await submitLead({
      phone: normalizePhone(phone),
      rank: Number.isFinite(parsedRank) && parsedRank > 0 ? parsedRank : 0,
      placement,
      collegeCode: request?.collegeCode,
      collegeName: request?.collegeName,
      matchCount: request?.matchCount,
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
    });

    if (!result.ok) {
      setStatus("idle");
      setError(result.error);
      return;
    }

    // The event that makes the funnel countable end to end: `lead_open` fired
    // when the dialog opened, this fires only on a captured number.
    track("lead_submit", {
      placement,
      rank: Number.isFinite(parsedRank) && parsedRank > 0 ? parsedRank : 0,
      college: request?.collegeCode ?? "",
    });
    setStatus("done");
  }

  const waHref = waLink({
    placement,
    rank: request?.rank,
    collegeName: request?.collegeName,
    collegeCode: request?.collegeCode,
    matchCount: request?.matchCount,
  });

  return (
    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(isOpen) => {
        // Wait for the exit transition so the content doesn't blank mid-fade.
        if (!isOpen) reset();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="lead-backdrop" />
        <Dialog.Popup
          className="lead-popup"
          initialFocus={(type) => (type === "touch" ? true : phoneRef.current)}
        >
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title
              render={
                <span className="eyebrow">
                  {status === "done" ? "received" : "callback request"}
                </span>
              }
            />
            <Dialog.Close
              aria-label="Close"
              className="lead-close font-mono text-[13px] leading-none"
            >
              ✕
            </Dialog.Close>
          </div>

          {status === "done" ? (
            <Done phone={phone} waHref={waHref} placement={placement} />
          ) : (
            <form onSubmit={onSubmit} noValidate>
              <h2 className="display text-[27px] sm:text-[31px] leading-[1.14] mt-5 max-w-[19ch]">
                Leave your number.{" "}
                <span className="display-italic text-fg-mute">
                  A counsellor calls you back.
                </span>
              </h2>

              <Dialog.Description
                render={
                  <p className="mt-4 text-[14px] text-fg-mute leading-relaxed max-w-[38ch]">
                    {request?.collegeName
                      ? `We'll go through ${request.collegeName} with you — fees, branch, and whether the seat is worth it at your rank.`
                      : "We'll go through the list with you — which of these fit your rank, and what they cost over four years."}
                  </p>
                }
              />

              {/* The docket. Two mono rows in a bordered block, set like a
                  part-filled allotment form: the rank is already printed in,
                  the student only completes the second line. */}
              <div className="lead-docket mt-7">
                <label className="lead-row" htmlFor="lead-rank">
                  <span className="lead-row-label">rank</span>
                  <input
                    id="lead-rank"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="not entered"
                    value={rank}
                    onChange={(e) =>
                      setRankEdit(e.target.value.replace(/\D/g, "").slice(0, 7))
                    }
                    className="lead-input"
                  />
                </label>

                <label className="lead-row" htmlFor="lead-phone">
                  <span className="lead-row-label">mobile</span>
                  <span aria-hidden className="lead-affix">
                    +91
                  </span>
                  <input
                    id="lead-phone"
                    ref={phoneRef}
                    type="tel"
                    inputMode="numeric"
                    enterKeyHint="send"
                    autoComplete="tel-national"
                    spellCheck={false}
                    placeholder="00000 00000"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 12));
                      if (error) setError(null);
                    }}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? "lead-error" : undefined}
                    className="lead-input"
                  />
                </label>
              </div>

              {error && (
                <p
                  id="lead-error"
                  role="alert"
                  className="mt-3 font-mono text-[11px] tracking-wider text-reach"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="cta-brass mt-7 w-full justify-center inline-flex items-center gap-2.5 disabled:opacity-60"
              >
                {status === "sending" ? "Sending…" : "Request a callback"}
              </button>

              <p className="mt-4 font-mono text-[10.5px] leading-relaxed tracking-wider text-fg-dim">
                Goes to MindCreed&rsquo;s counselling team in Bengaluru. Not
                shared onward.
              </p>
            </form>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * Post-capture. The number is recorded, so this is the one moment WhatsApp
 * costs nothing — the student who wants an answer now can have one, and the
 * lead exists either way. Until `/api/leads` actually persists, this thread is
 * also the only durable copy of the enquiry.
 */
function Done({
  phone,
  waHref,
  placement,
}: {
  phone: string;
  waHref: string;
  placement: CtaPlacement;
}) {
  return (
    <div>
      <h2 className="display text-[27px] sm:text-[31px] leading-[1.14] mt-5 max-w-[19ch]">
        Got it.{" "}
        <span className="display-italic text-fg-mute">
          We&rsquo;ll call you on {formatPhone(phone)}.
        </span>
      </h2>

      <p className="mt-4 text-[14px] text-fg-mute leading-relaxed max-w-[38ch]">
        Would rather not wait for the phone to ring? Open the thread and a
        counsellor picks it up there — your rank is already in the first line.
      </p>

      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          track("whatsapp_cta", { placement, rank: 0, college: "" })
        }
        className="cta-brass mt-7 w-full justify-center inline-flex items-center gap-2.5"
      >
        <WhatsAppGlyph size={15} />
        <span>Start the chat now</span>
      </a>

      <Dialog.Close className="lead-dismiss mt-4 w-full text-center font-mono text-[11px] tracking-wider">
        No thanks, I&rsquo;ll wait for the call
      </Dialog.Close>
    </div>
  );
}
