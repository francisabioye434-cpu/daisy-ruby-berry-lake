import { createFileRoute, Link } from "@tanstack/react-router";
import { ledgerStats, useLedger, type DeskTicket } from "@/lib/store-ledger";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, Stat } from "@/components/stat";
import { formatOdds, formatPct, formatSignedPct } from "@/lib/utils";

export const Route = createFileRoute("/record")({ component: RecordPage });

function clv(t: DeskTicket): number | null {
  if (!t.closingOdds || t.closingOdds <= 1) return null;
  return t.odds / t.closingOdds - 1;
}

function exportCsv(tickets: DeskTicket[]) {
  const header = "kickoff,league,match,call,selection,odds,close,modelP,ev,result,score";
  const rows = tickets.map((t) =>
    [
      t.kickoffIso,
      t.league,
      t.matchLabel,
      t.word,
      t.selection,
      t.odds,
      t.closingOdds ?? "",
      t.modelP,
      t.ev,
      t.result,
      t.score ?? "",
    ].join(","),
  );
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "fairline-record.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function RecordPage() {
  const tickets = useLedger((s) => s.tickets);
  const sitIds = useLedger((s) => s.sitIds);
  const stats = ledgerStats(tickets, sitIds.length);
  const ordered = [...tickets].sort((a, b) => (b.kickoffIso || "").localeCompare(a.kickoffIso || ""));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Desk record</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">Score the process</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            Every BET and LEAN is frozen before kickoff. Full time cannot rewrite it. Sit is a
            result, not a failure. Mean CLV is the number that says whether the process is real.
          </p>
        </div>
        {tickets.length ? (
          <Button variant="outline" size="sm" onClick={() => exportCsv(tickets)}>
            Export CSV
          </Button>
        ) : null}
      </header>

      <div className="grid grid-cols-2 gap-4 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:grid-cols-4 sm:p-5">
        <Stat
          label="Sit rate"
          value={stats.sitRate != null ? formatPct(stats.sitRate, 0) : "—"}
          hint={`${stats.sits} sits · ${stats.issued} tickets`}
        />
        <Stat
          label="Hit rate"
          value={stats.hit != null ? formatPct(stats.hit, 0) : "—"}
          hint={stats.settled ? `${stats.wins}–${stats.losses} settled` : "waiting on FT"}
          tone={stats.hit == null ? "neutral" : stats.hit >= 0.5 ? "positive" : "negative"}
        />
        <Stat
          label="Mean CLV"
          value={stats.meanClv != null ? formatSignedPct(stats.meanClv) : "—"}
          hint={stats.clvN ? `${stats.beatClose}/${stats.clvN} beat close` : "closes stamp at FT"}
        />
        <Stat label="Open tickets" value={`${stats.open}`} hint="still pre" />
      </div>

      {stats.settled < 12 ? (
        <Panel>
          <p className="text-sm text-muted">
            Thin sample. A weekend of HITs is noise. Trust this page after a few dozen settled
            tickets — and trust CLV before win rate.
          </p>
        </Panel>
      ) : null}

      {ordered.length === 0 ? (
        <Panel>
          <p className="text-sm text-muted">
            No desk tickets yet. Leave the board open on a game week. BET and LEAN calls are
            written here automatically. Matches the desk sat are counted in sit rate, not as
            fake wins.
          </p>
          <Button className="mt-4" asChild>
            <Link to="/">Open the board</Link>
          </Button>
        </Panel>
      ) : (
        <ul className="space-y-2">
          {ordered.map((t) => {
            const c = clv(t);
            return (
              <li key={t.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {t.matchLabel}
                      <span className="ml-2 text-muted">{t.selection}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-faint">
                      {t.league}
                      {t.kickoffIso ? ` · ${t.kickoffIso.slice(0, 16).replace("T", " ")}` : ""} ·{" "}
                      {t.word} @ {formatOdds(t.odds)}
                      {t.score ? ` · FT ${t.score}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={t.word === "BET" ? "positive" : "warn"}>{t.word}</Badge>
                    <Badge
                      tone={t.result === "win" ? "positive" : t.result === "loss" ? "negative" : "neutral"}
                    >
                      {t.result === "open" ? "open" : t.result}
                    </Badge>
                    {c != null ? (
                      <Badge tone={c > 0 ? "positive" : "negative"}>{formatSignedPct(c)} CLV</Badge>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
