import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { MindCreedLockup } from "@/components/brand/MindCreedMark";
import { GoogleGlyph } from "@/components/brand/GoogleGlyph";

export const metadata: Metadata = {
  // `absolute` escapes the root template, which appends the tool's SEO tail
  // ("COMEDK 2026 Cutoffs & Placements") to every title. Correct for the public
  // pages, nonsense on a staff sign-in.
  title: { absolute: "Sign in — MindCreed" },
  // The dashboard is staff-only; it has no business in an index.
  robots: { index: false, follow: false },
};

/** Every way sign-in can end badly, in words a counsellor can act on.
 *  Deliberately specific: "access denied" alone produces a phone call. */
const ERRORS: Record<string, string> = {
  denied:
    "That Google account isn't on the dashboard's access list. Sign in with the address MindCreed set up, or ask for yours to be added.",
  cancelled: "Sign-in was cancelled. Nothing happened — try again when ready.",
  unverified:
    "That Google account's email address isn't verified, so we can't accept it.",
  state:
    "The sign-in link expired or was opened in a different browser. Start again from this page.",
  handshake:
    "The sign-in link expired or was opened in a different browser. Start again from this page.",
  exchange:
    "Google couldn't complete the sign-in. Try again — if it keeps failing, the OAuth configuration needs a look.",
  config:
    "Google sign-in isn't configured on this deployment yet. GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are missing.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; "signed-out"?: string; next?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;

  // Already in — no reason to show a door that's open.
  if (session) redirect(params.next ?? "/dashboard");

  const error = params.error ? ERRORS[params.error] : undefined;
  const signedOut = params["signed-out"] === "1";
  const next = params.next?.startsWith("/") ? params.next : "/dashboard";

  return (
    <main className="bg-paper flex min-h-dvh flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-[26rem]">
        <MindCreedLockup size={20} nameClass="text-[13px]" />

        <p className="eyebrow mt-10">dashboard</p>

        <h1 className="display mt-4 text-[32px] leading-[1.12] sm:text-[38px]">
          Leads, in one place.{" "}
          <span className="display-italic text-fg-mute">Staff only.</span>
        </h1>

        <p className="mt-5 max-w-[36ch] text-[14px] leading-relaxed text-fg-mute">
          Sign in with the Google account MindCreed added to the access list.
          Nobody else can get in, whatever they sign in with.
        </p>

        {signedOut && (
          <p className="mt-6 border-l border-[color:var(--accent-line)] pl-3 font-mono text-[11px] leading-relaxed tracking-wider text-fg-mute">
            Signed out.
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-6 border-l border-reach pl-3 text-[13px] leading-relaxed text-fg-mute"
          >
            {error}
          </p>
        )}

        {/* A plain link, not a fetch: the OAuth handshake is a full-page
            navigation by design, and treating it as one keeps the back button
            and the browser's own sign-in affordances working. */}
        <a
          href={`/api/auth/google?next=${encodeURIComponent(next)}`}
          className="cta-brass mt-9 inline-flex w-full items-center justify-center gap-2.5"
        >
          <GoogleGlyph size={15} />
          <span>Continue with Google</span>
        </a>

        <p className="mt-6 font-mono text-[10.5px] leading-relaxed tracking-wider text-fg-dim">
          We ask Google for your name and email address only. No access to
          Gmail, Drive or anything else is requested.
        </p>

        <div className="rule mt-12 pt-5">
          <Link href="/" className="cta-quiet">
            ← Back to the rank tool
          </Link>
        </div>
      </div>
    </main>
  );
}
