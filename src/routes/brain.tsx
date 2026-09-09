import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { deskIq } from "@/lib/math/iq";
import { useDesk } from "@/lib/store";
import { ledgerStats, useLedger } from "@/lib/store-ledger";
import { runDeskBrief } from "@/lib/data/desk-brain";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { Stat } from "@/components/stat";
import { Button } from "@/components/ui/button";
import { formatPct, formatSignedPct } from "@/lib/utils";

export const Route = createFileRoute("/brain")({ component: BrainPage });

function BrainPage() {
  const bets = useDesk((s) => s.bets);
  const tickets = useLedger((s) => s.tickets);
  const sits = useLedger((s) => s.sitIds).length;
  const iq = deskIq(tickets, sits, bets);
  const stats = ledgerStats(tickets, sits);
  const [brief, setBrief] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function runBrief() {
    setBusy(true);
    setErr("");
    const snapshot = [
      `IQ ${Math.round(iq.score * 100)} sample=${iq.sample.toFixed(2)} clv=${iq.clv.toFixed(2)} sit=${iq.discipline.toFixed(2)} votes=${iq.votes.toFixed(2)}`,
      `Record settled=${stats.settled} wins=${stats.wins} losses=${stats.losses} sitRate=${stats.sitRate} meanClv=${stats.meanClv}`,
      `Journal open=${bets.filter((b) => b.result === "open").length} votes=${bets.filter((b) => b.vote).length}`,
      `Recent tickets: ${tickets
        .slice(0, 12)
        .map((t) => `${t.word} ${t.selection} ev=${(t.ev * 100).toFixed(1)} result=${t.result}`)
        .join("; ")}`,
    ].join("\n");
    try {
      const out = await runDeskBrief({ data: { snapshot } });
      if (!out.ok) setErr(out.error);
      else setBrief(out.text);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Brief failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Desk IQ</p>
        <h1 className="mt-2 font-display text-6xl tracking-tight tabular">{Math.round(iq.score * 100)}</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{iq.note}</p>
      </header>

      <div className="grid grid-cols-2 gap-4 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:grid-cols-4">
        <Stat label="Sample" value={formatPct(iq.sample, 0)} hint="40 settled/sits = full" />
        <Stat label="CLV mind" value={formatPct(iq.clv, 0)} hint={stats.meanClv != null ? formatSignedPct(stats.meanClv) : "waiting"} />
        <Stat label="Sit IQ" value={formatPct(iq.discipline, 0)} hint="sitting is the product" />
        <Stat label="Your votes" value={formatPct(iq.votes, 0)} hint="take / sit on tickets" />
      </div>

      <SignedIn>
        <div className="space-y-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-sm text-muted">
            Run a desk brief. It reads your frozen record — not the live scoreboard — and tells you
            what the process is actually doing.
          </p>
          <Button onClick={() => void runBrief()} disabled={busy}>
            {busy ? "Reading the record…" : "Run desk brief"}
          </Button>
          {err ? <p className="text-sm text-negative">{err}</p> : null}
          {brief ? <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{brief}</p> : null}
        </div>
      </SignedIn>
      <SignedOut>
        <p className="text-sm text-muted">
          Sign in to run the desk brief. The score above still updates from this device’s record.
        </p>
      </SignedOut>

      <p className="text-sm text-muted">
        There is no 100% hit rate. IQ is process: sit rate, beating the close, and your votes. The
        model does not rewrite yesterday to look clever.
      </p>

      <p className="text-sm">
        <Link to="/record" className="text-muted hover:text-fg">
          Open the record
        </Link>
        {" · "}
        <Link to="/login" className="text-muted hover:text-fg">
          Sign in
        </Link>
      </p>
    </div>
  );
}