import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DashHeader } from "@/components/dashboard/DashHeader";

export const metadata: Metadata = {
  // Absolute, so the root layout's public-SEO title template stays off the
  // staff pages.
  title: { absolute: "Leads — MindCreed" },
  robots: { index: false, follow: false, nocache: true },
};

/**
 * The gate.
 *
 * Every route under /dashboard renders inside this layout, so this one check
 * covers all of them — and because it is a server component, the guard runs
 * before any lead data is fetched, let alone sent. There is no client-side
 * redirect anywhere in the dashboard: a page that ships the rows and then
 * hides them has already leaked them.
 *
 * Deliberately not middleware. The session HMAC uses node:crypto, and Next's
 * middleware/proxy layer is a different runtime with different constraints —
 * putting the check where the data is fetched keeps the two impossible to
 * separate by accident. The API routes under /api/dashboard repeat the check
 * for the same reason: a layout cannot protect a route handler.
 */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");

  return (
    <div className="bg-paper flex min-h-dvh flex-col">
      <DashHeader session={session} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
