"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { coerceStatus, updateLead } from "@/lib/leads-store";

/**
 * The two edits the dashboard allows: move a lead along the pipeline, and leave
 * a note for whoever picks it up next.
 *
 * Both re-check the session. A server action is a POST endpoint with a
 * generated URL — the dashboard layout's guard does not cover it, and treating
 * "it's only reachable from a protected page" as authorisation is how these
 * get exploited. Every action here starts with the same three lines.
 *
 * Nothing else about a lead is editable. The captured context — rank,
 * placement, college, the number itself — is evidence of what the student
 * actually did, and a dashboard that lets you rewrite it is a dashboard whose
 * numbers you can't cite.
 */

async function actor(): Promise<string> {
  const session = await getSession();
  if (!session) throw new Error("Not signed in.");
  return session.email;
}

export type ActionResult = { ok: boolean; error?: string };

export async function setLeadStatus(
  id: string,
  status: string,
): Promise<ActionResult> {
  try {
    const email = await actor();
    const next = coerceStatus(status);
    if (!next) return { ok: false, error: "Unknown status." };

    await updateLead(id, { status: next }, email);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    console.error("[dashboard] setLeadStatus failed", err);
    return { ok: false, error: "Could not save. Try again." };
  }
}

export async function setLeadNote(
  id: string,
  note: string,
): Promise<ActionResult> {
  try {
    const email = await actor();
    await updateLead(id, { note }, email);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    console.error("[dashboard] setLeadNote failed", err);
    return { ok: false, error: "Could not save. Try again." };
  }
}
