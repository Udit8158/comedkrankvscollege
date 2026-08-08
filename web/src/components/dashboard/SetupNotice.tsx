/**
 * Shown when the dashboard is reachable but DATABASE_URL is not set.
 *
 * Signed in and staring at an error stack is the worst version of this moment,
 * and "no leads yet" would be a lie that costs an hour of looking for a bug in
 * the form. So the page says what is missing and what to do about it — the
 * unconfigured state is a state, not a failure.
 */
export function SetupNotice() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-24 pt-16 sm:px-8">
      <p className="eyebrow">not connected</p>

      <h1 className="display mt-4 text-[30px] leading-[1.14] sm:text-[36px]">
        The dashboard has no database yet.
      </h1>

      <p className="mt-5 max-w-[48ch] text-[14px] leading-relaxed text-fg-mute">
        Sign-in works, so the access list is configured correctly. What is
        missing is <code className="font-mono text-[13px] text-fg">DATABASE_URL</code>{" "}
        — the Neon connection string. Until it is set, callback requests are
        still accepted and written to the function log, but nothing is stored
        and nothing can be listed here.
      </p>

      <ol className="mt-9 space-y-6">
        <Step n={1} title="Create a Neon project">
          At <span className="text-fg">neon.tech</span>, or through the Vercel
          dashboard&rsquo;s Storage tab, which wires the env var in for you.
        </Step>
        <Step n={2} title="Set DATABASE_URL">
          Copy the pooled connection string into the project&rsquo;s environment
          — <code className="font-mono text-[12.5px] text-fg">web/.env.local</code>{" "}
          locally, and Vercel&rsquo;s environment variables for the deployment.
        </Step>
        <Step n={3} title="Create the tables">
          Run <code className="font-mono text-[12.5px] text-fg">node scripts/db-migrate.mjs</code>{" "}
          from the <code className="font-mono text-[12.5px] text-fg">web/</code>{" "}
          directory. It is idempotent — safe to re-run any time.
        </Step>
      </ol>

      <p className="mt-10 border-l border-[color:var(--accent-line)] pl-4 text-[13px] leading-relaxed text-fg-mute">
        Leads captured before the database existed are not lost — they are in
        the function logs, one JSON object per{" "}
        <code className="font-mono text-[12px] text-fg">[lead]</code> line, and
        can be replayed as inserts.
      </p>
    </div>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-5">
      <span className="mt-[2px] font-mono text-[12px] tabular-nums text-accent">
        {String(n).padStart(2, "0")}
      </span>
      <div>
        <p className="text-[14px] text-fg">{title}</p>
        <p className="mt-1.5 max-w-[46ch] text-[13.5px] leading-relaxed text-fg-mute">
          {children}
        </p>
      </div>
    </li>
  );
}
