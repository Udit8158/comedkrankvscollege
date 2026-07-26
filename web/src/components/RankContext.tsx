"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Shares the rank the student has entered with chrome that sits outside the
 * predictor — currently the header CTA, which lives in the root layout.
 *
 * The point is lead quality: a tap on the header's WhatsApp link should open a
 * thread that already says "my COMEDK rank is 34,500" rather than a blank
 * "hi", so MindCreed never has to ask. The predictor publishes its rank here as
 * the student types; college pages publish the `?rank=` they were opened with
 * via <RankSync>.
 */

type RankCtx = { rank: number; setRank: (n: number) => void };

const Ctx = createContext<RankCtx>({ rank: 0, setRank: () => {} });

export function RankProvider({ children }: { children: React.ReactNode }) {
  const [rank, setRank] = useState(0);
  const value = useMemo(() => ({ rank, setRank }), [rank]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRank(): RankCtx {
  return useContext(Ctx);
}

/**
 * Publishes a server-known rank into the context. Rendered by the college page,
 * which reads `?rank=` on the server and has no other way to reach the header.
 */
export function RankSync({ rank }: { rank?: number }) {
  const { setRank } = useRank();
  useEffect(() => {
    if (typeof rank === "number" && rank > 0) setRank(rank);
  }, [rank, setRank]);
  return null;
}
