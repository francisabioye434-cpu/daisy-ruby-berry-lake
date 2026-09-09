import { createFileRoute, Link } from "@tanstack/react-router";
import { expectedValue } from "@/lib/math/odds";
import { loadSlate, type Slate } from "@/lib/data/load-slate";
import { enableAlerts } from "@/lib/alerts";
import { useDesk, type JournalBet } from "@/lib/store";
import { useAutoSettle } from "@/lib/use-auto-settle";
import { learnFromBets } from "@/lib/journal-learn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel, Stat } from "@/components/stat";
import { formatOdds, formatPct, formatSignedPct, formatUnits } from "@/lib/utils";

export const Route = createFileRoute("/journal")({
  loader: () => loadSlate(),
  staleTime: 0,
  component: Journal,
});

function clv(bet: JournalBet): number | null {
  if (!bet.closingOdds || bet.closingOdds <= 1) return null;
  return bet.odds / bet.closingOdds - 1;
}

function pnl(bet: JournalBet): number {
  if (bet.result === "win") return bet.stake * (bet.odds - 1);
  if (bet.result === "loss") return -bet.stake;
  return 0;
}

function Journal() {
  const slate = Route.useLoaderData() as Slate;
  const bets = useDesk((s) => s.bets);
  useAutoSettle(slate.fixtures);
  const learn = learnFromBets(bets);
  const bankroll = useDesk((s) => s.bankroll);
  const kellyF = useDesk((s) => s.kellyFractionUsed);
  const setBankroll = useDesk((s) => s.setBankroll);
  const setKellyFractionUsed = useDesk((s) => s.setKellyFractionUsed);
  const updateBet = useDesk((s) => s.updateBet);
  const removeBet = useDesk((s) => s.removeBet);
  const clearBets = useDesk((s) => s.clearBets);
  const alertsOn = useDesk((s) => s.alertsOn);
  const alertLeans = useDesk((s) => s.alertLeans);
  const setAlertsOn = useDesk((s) => s.setAlertsOn);
  const setAlertLeans = useDesk((s) => s.setAlertLeans);
  const voteBet = useDesk((s) => s.voteBet);

  const settled = bets.filter((b) => b.result === "win" || b.result === "loss");
  const profit = settled.reduce((s, b) => s + pnl(b), 0);
  const staked = settled.reduce((s, b) => s + b.stake, 0);
  const clvs = bets.map(clv).filter((x): x is number => x !== null);
  const meanClv = clvs.length ? clvs.reduce((a, b) => a + b, 0) / clvs.length : 0;
  const beatClose = clvs.filter((x) => x > 0).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Closing line journal</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">Process, not last week</h1>
        </div>
        <Button variant="outline" asChild>
          <Link to="/engine">Price a match</Link>
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-4 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:grid-cols-4 sm:p-5">
        <Stat label="Open tickets" value={`${bets.filter((b) => b.result === "open").length}`} />
        <Stat
          label="Settled P/L"
          value={`${profit >= 0 ? "+" : ""}${formatUnits(profit, 0)}`}
          tone={profit > 0 ? "positive" : profit < 0 ? "negative" : "neutral"}
          hint={staked ? `${formatSignedPct(profit / staked)} on staked` : "no settles yet"}
        />
        <Stat
          label="Mean CLV"
          value={clvs.length ? formatSignedPct(meanClv) : "—"}
          hint={clvs.length ? `${beatClose}/${clvs.length} beat close` : "auto-fills at FT"}
        />
        <Stat label="Bankroll" value={formatUnits(bankroll, 0)} hint="units" />
      </div>

      <Panel>
        <h2 className="font-display text-xl tracking-tight">What is working</h2>
        <p className="mt-2 text-sm text-muted">{learn.note}</p>
        <p className="mt-2 text-xs text-faint">
          Blend nudge {learn.blendDelta >= 0 ? "+" : ""}
          {Math.round(learn.blendDelta * 100)} pts toward the book. Wins with a bad close are luck —
          they do not teach the model to chase that side.
        </p>
      </Panel>

      <Panel>
        <h2 className="font-display text-xl tracking-tight">Desk settings</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="br">Bankroll (units)</Label>
            <Input
              id="br"
              type="number"
              min={100}
              step={100}
              value={bankroll}
              onChange={(e) => setBankroll(Number(e.target.value))}
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label>Kelly fraction used</Label>
              <span className="font-mono text-xs tabular">{formatPct(kellyF, 0)}</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={kellyF}
              onChange={(e) => setKellyFractionUsed(Number(e.target.value))}
              className="mt-2 h-11 w-full accent-accent"
            />
            <p className="mt-1 text-xs text-faint">Quarter is 0.25. Full is 1.00.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={alertsOn ? "default" : "outline"}
            onClick={() => {
              void enableAlerts().then((ok) => setAlertsOn(ok || alertsOn));
            }}
          >
            {alertsOn ? "Daily alerts on" : "Turn on daily alerts"}
          </Button>
          <Button size="sm" variant={alertLeans ? "default" : "outline"} onClick={() => setAlertLeans(!alertLeans)}>
            {alertLeans ? "LEAN pings on" : "LEAN pings off"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-faint">
          One ping per possible ticket per day. Install the app — the desk, journal and record live
          on this device. Grok is not required after install.
        </p>
      </Panel>

      {bets.length === 0 ? (
        <Panel>
          <p className="text-sm text-muted">
            Empty blotter. BET calls on the board are written here automatically. After full time
            the desk marks win/loss and stamps the last pre-match price as the close. Learning
            uses that close, not last weekend’s winners.
          </p>
        </Panel>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-tight">Blotter</h2>
            <Button size="sm" variant="ghost" onClick={clearBets}>
              Clear
            </Button>
          </div>
          <ul className="space-y-2">
            {bets.map((bet) => (
              <BetRow key={bet.id} bet={bet} onChange={updateBet} onRemove={removeBet} onVote={voteBet} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function BetRow({
  bet,
  onChange,
  onRemove,
  onVote,
}: {
  bet: JournalBet;
  onChange: (id: string, patch: Partial<JournalBet>) => void;
  onRemove: (id: string) => void;
  onVote: (id: string, vote: "take" | "sit") => void;
}) {
  const ev = expectedValue(bet.modelP, bet.odds);
  const c = clv(bet);
  const profit = pnl(bet);

  return (
    <li className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {bet.matchLabel}
            <span className="ml-2 text-muted">{bet.selection}</span>
          </p>
          <p className="mt-0.5 text-xs text-faint">
            {bet.market} · {formatOdds(bet.odds)} · model {formatPct(bet.modelP)} · stake{" "}
            {formatUnits(bet.stake, 1)} u · EV {formatSignedPct(ev)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            tone={
              bet.result === "win" ? "positive" : bet.result === "loss" ? "negative" : "neutral"
            }
          >
            {bet.result}
            {bet.result !== "open" ? ` ${profit >= 0 ? "+" : ""}${formatUnits(profit, 1)}` : ""}
            {bet.autoSettled ? " · auto" : ""}
          </Badge>
          {c !== null ? (
            <Badge tone={c > 0 ? "positive" : "negative"}>{formatSignedPct(c)} CLV</Badge>
          ) : null}
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[8rem_1fr]">
        <div className="space-y-1">
          <Label htmlFor={`cl-${bet.id}`}>Close</Label>
          <Input
            id={`cl-${bet.id}`}
            type="number"
            min={1.01}
            step={0.01}
            placeholder="odds"
            value={bet.closingOdds ?? ""}
            onChange={(e) =>
              onChange(bet.id, {
                closingOdds: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
          />
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {(["open", "win", "loss", "void"] as const).map((r) => (
            <Button
              key={r}
              size="sm"
              variant={bet.result === r ? "default" : "outline"}
              onClick={() => onChange(bet.id, { result: r })}
            >
              {r}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => onRemove(bet.id)}>
            Remove
          </Button>
          <Button size="sm" variant={bet.vote === "take" ? "default" : "outline"} onClick={() => onVote(bet.id, "take")}>
            I take
          </Button>
          <Button size="sm" variant={bet.vote === "sit" ? "default" : "outline"} onClick={() => onVote(bet.id, "sit")}>
            I sit
          </Button>
        </div>
      </div>
    </li>
  );
}
