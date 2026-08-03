"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import { LeadDialog, type LeadRequest } from "./LeadDialog";

/**
 * Holds the single lead-form instance for the whole app.
 *
 * One dialog, opened from anywhere. The alternative — a <LeadDialog> next to
 * each CTA — would mount five copies of the same form and five copies of its
 * state, and the header's copy would sit inside a sticky, backdrop-blurred
 * element whose stacking context the popup would have to escape.
 *
 * The CTA passes its context in at open time (which placement, which rank,
 * which college), so the form knows what it is capturing without any prop
 * drilling through the layout.
 */

type LeadCtx = { openLead: (req: LeadRequest) => void };

const Ctx = createContext<LeadCtx>({ openLead: () => {} });

export function LeadProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<LeadRequest | null>(null);
  const [open, setOpen] = useState(false);

  const openLead = useCallback((req: LeadRequest) => {
    setRequest(req);
    setOpen(true);
    // Top of the funnel. Paired with `lead_submit` this gives the open→capture
    // rate per placement, which is what tells MindCreed where the tool is
    // actually earning conversations.
    track("lead_open", {
      placement: req.placement,
      rank: req.rank && req.rank > 0 ? req.rank : 0,
      college: req.collegeCode ?? "",
    });
  }, []);

  const value = useMemo(() => ({ openLead }), [openLead]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <LeadDialog
        request={request}
        open={open}
        onOpenChange={setOpen}
        onClosed={() => setRequest(null)}
      />
    </Ctx.Provider>
  );
}

export function useLead(): LeadCtx {
  return useContext(Ctx);
}
