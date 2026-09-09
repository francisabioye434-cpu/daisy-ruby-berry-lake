import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { pickUpcoming } from "@/lib/data/fixtures";
import { loadSlate, type Slate } from "@/lib/data/load-slate";
import { liveMarketsFromScore, pOver, priceMatch, remainingFraction } from "@/lib/math/dixon-coles";
import { applyFacts, ticketSideRisk } from "@/lib/math/facts-adjust";
import { fairOdds } from "@/lib/math/odds";
import { bestCall, scoreTicket } from "@/lib/math/call";
import { blendThreeWay, marketFromOdds } from "@/lib/math/market-study";
import { overround } from "@/lib/math/devig";
import { useDesk } from "@/lib/store";
import { useLedger } from "@/lib/store-ledger";
import { useAutoSettle } from "@/lib/use-auto-settle";
import { effectiveBlend, learnFromBets } from "@/lib/journal-learn";
import { TeamMark } from "@/components/team-mark";
import { ScoreMatrixGrid } from "@/components/score-matrix";
import { CallBadge, DeskCallCard } from "@/components/desk-call";
import { MatchFactsCard } from "@/components/match-facts";
import { BetSheet } from "@/components/bet-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel, Stat } from "@/components/stat";
import { formatOdds, formatPct, formatUnits } from "@/lib/utils";

type Search = { home?: string; away?: string; league?: string; id?: string };

function asId(v: unknown): string | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "string") {
    const t = v.replace(/^"|"$/g, "").trim();
    return t || undefined;
  }
  return undefined;
}

export const Route = createFileRoute("/engine")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    home: asId(s.home),
    away: asId(s.away),
    league: asId(s.league),
    id: asId(s.id),
  }),
  loader: () => loadSlate(),
  staleTime: 0,
  pendingMs: 250,
  pendingComponent: () => (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Dixon–Coles engine</p>
      <h1 className="font-display text-4xl tracking-tight">Loading matches…</h1>
    </div>
  ),
  component: Engine,
});

function Engine() {
  const slate = Route.useLoaderData() as Slate;
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const desk = useDesk();
  useAutoSettle(slate.fixtures);
  const ledgerTickets = useLedger((s) => s.tickets);
  const blendW = effectiveBlend(
    slate.study?.blendW ?? 0.22,
    (learnFromBets(desk.bets).blendDelta + learnFromBets(ledgerTickets).blendDelta) / 2,
  );

  const teamMap = useMemo(() => new Map(slate.teams.map((t) => [t.id, t])), [slate.teams]);
  const byLeague = search.league
    ? slate.fixtures.filter((f) => f.leagueId === search.league)
    : slate.fixtures;

  const fixture =
    slate.fixtures.find((f) => f.id === search.id) ||
    byLeague.find((f) => f.homeId === search.home && f.awayId === search.away) ||
    pickUpcoming(byLeague) ||
    pickUpcoming(slate.fixtures);

  const home = (fixture && teamMap.get(fixture.homeId)) || slate.teams[0];
  const away =
    (fixture && teamMap.get(fixture.awayId)) ||
    slate.teams.find((t) => t.id !== home?.id) ||
    slate.teams[1];

  const leagueId = fixture?.leagueId || search.league || slate.leagues[0]?.id;
  const leagueFixtures = slate.fixtures
    .filter((f) => f.leagueId === leagueId)
    .slice()
    .sort((a, b) => {
      const rank = (s?: string) => (s === "live" ? 0 : s === "pre" || !s ? 1 : 2);
      const r = rank(a.status) - rank(b.status);
      if (r) return r;
      return (a.kickoffIso || "").localeCompare(b.kickoffIso || "");
    });

  const [oddsH, setOddsH] = useState(fixture?.book1x2.home ?? 2.1);
  const [oddsD, setOddsD] = useState(fixture?.book1x2.draw ?? 3.4);
  const [oddsA, setOddsA] = useState(fixture?.book1x2.away ?? 3.5);

  useEffect(() => {
    if (!fixture) return;
    setOddsH(fixture.book1x2.home);
    setOddsD(fixture.book1x2.draw);
    setOddsA(fixture.book1x2.away);
  }, [fixture?.id, fixture?.book1x2.home, fixture?.book1x2.draw, fixture?.book1x2.away]);

  const adj = useMemo(() => {
    if (!home || !away) return null;
    const frozen = fixture?.settled && (fixture.status === "post" || fixture.status === "live");
    const homeIn = frozen
      ? { ...home, attack: fixture.settled!.home.attack, defense: fixture.settled!.home.defense }
      : home;
    const awayIn = frozen
      ? { ...away, attack: fixture.settled!.away.attack, defense: fixture.settled!.away.defense }
      : away;
    const out = applyFacts(homeIn, awayIn, fixture?.facts, desk.homeAdv);
    if (frozen) out.notes.unshift(`Frozen ${fixture.settled!.asOf} — this score is not in the ratings`);
    return out;
  }, [home, away, fixture, desk.homeAdv]);

  const priced = useMemo(() => {
    if (!home || !away || !adj || !fixture) return null;
    const raw = priceMatch(adj.home, adj.away, { homeAdv: adj.homeAdv, rho: desk.rho });
    if (fixture.status === "live" && fixture.score) {
      const frac = remainingFraction(fixture.elapsedMin, fixture.phase);
      const live = liveMarketsFromScore(raw.lambdaHome, raw.lambdaAway, desk.rho, fixture.score, frac, fixture.overLine ?? 2.5);
      return { ...raw, lambdaHome: live.remHome, lambdaAway: live.remAway, markets: { ...raw.markets, ...live.markets } };
    }
    const frozen = fixture.status === "post";
    const w = frozen ? 0 : blendW;
    if (w > 0 && fixture.bookSource === "market") {
      const mkt = marketFromOdds(fixture.book1x2);
      if (mkt) {
        const mixed = blendThreeWay(
          { home: raw.markets.home, draw: raw.markets.draw, away: raw.markets.away },
          mkt,
          w,
        );
        return { ...raw, markets: { ...raw.markets, ...mixed } };
      }
    }
    return raw;
  }, [home, away, adj, desk.rho, fixture, blendW]);

  if (!home || !away || !priced || !fixture || !adj) {
    return (
      <Panel>
        <p className="text-sm text-muted">No upcoming matches on the slate.</p>
      </Panel>
    );
  }

  const line = fixture.overLine ?? 2.5;
  const overP =
    fixture.status === "live" || Math.abs(line - 2.5) < 0.01 ? priced.markets.over25 : pOver(priced.matrix, line);
  const factsNote = adj.notes[0];
  const openBets = desk.bets.filter((b) => b.result === "open");
  const heat = desk.bankroll > 0 ? openBets.reduce((s, b) => s + b.stake, 0) / desk.bankroll : 0;
  const correlated = openBets.some(
    (b) => b.fixtureId === fixture.id || b.matchLabel.includes(home.short) || b.matchLabel.includes(away.short),
  );
  const gateMeta = {
    profile: fixture.profile,
    heat,
    correlated,
    live: fixture.status === "live",
    remainingFrac: remainingFraction(fixture.elapsedMin, fixture.phase),
    clock: fixture.clock,
  };

  const oneXtwo = [
    { key: "H", label: `${home.short} win`, p: priced.markets.home, odds: oddsH, market: "1x2" as const, sel: "home" },
    { key: "X", label: "Draw", p: priced.markets.draw, odds: oddsD, market: "1x2" as const, sel: "draw" },
    { key: "A", label: `${away.short} win`, p: priced.markets.away, odds: oddsA, market: "1x2" as const, sel: "away" },
  ].map((t) => {
    const meta = {
      market: t.market,
      source: fixture.bookSource,
      sideRisk: ticketSideRisk(adj, t.sel),
      factsNote,
      side: t.sel,
      ...gateMeta,
    };
    return { ...t, ...scoreTicket(t.label, t.p, t.odds, desk.kellyFractionUsed, meta), ...meta };
  });

  const extras = [
    { key: "O", label: `Over ${line}`, p: overP, odds: fixture.bookTotals.over25, market: "totals" as const, sel: "over" },
    { key: "U", label: `Under ${line}`, p: 1 - overP, odds: fixture.bookTotals.under25, market: "totals" as const, sel: "under" },
    { key: "Y", label: "BTTS yes", p: priced.markets.bttsYes, odds: fixture.bookTotals.bttsYes, market: "btts" as const, sel: "yes" },
    { key: "N", label: "BTTS no", p: priced.markets.bttsNo, odds: fixture.bookTotals.bttsNo, market: "btts" as const, sel: "no" },
  ].map((t) => {
    const meta = {
      market: t.market,
      source: t.market === "btts" ? ("model" as const) : fixture.bookSource,
      sideRisk: ticketSideRisk(adj, t.sel),
      factsNote,
      side: t.sel,
      ...gateMeta,
    };
    return { ...t, ...scoreTicket(t.label, t.p, t.odds, desk.kellyFractionUsed, meta), ...meta };
  });

  const allTickets = [...oneXtwo, ...extras];
  const matchCall = bestCall(allTickets);
  const calledTicket = allTickets.find((t) => t.selection === matchCall.selection && t.odds === matchCall.odds);
  const vig = overround([oddsH, oddsD, oddsA]);

  function go(next: Search) {
    navigate({ search: { ...search, ...next } });
  }

  function addTicket(t: (typeof allTickets)[number]) {
    if (!fixture || t.ev <= 0) return;
    desk.addBet({
      fixtureId: fixture.id,
      matchLabel: `${home.short} v ${away.short}`,
      market: t.key === "O" || t.key === "U" ? "totals" : t.key === "Y" || t.key === "N" ? "btts" : "1X2",
      selection: t.label,
      odds: t.odds,
      modelP: t.p,
      stake: Math.round(desk.bankroll * t.kelly * 100) / 100,
      side: t.sel,
    });
  }

  const outN = (fixture.facts?.home.unavailable.length || 0) + (fixture.facts?.away.unavailable.length || 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Dixon–Coles engine</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">Match lab</h1>
        </div>
        <p className="max-w-sm text-sm text-muted">
          Lineups, injuries, rest, form, luck, steam, table and bankroll all have to clear before a BET.
          Confirmed XIs are pulled again every couple of minutes. The book is studied on settled
          games; Dixon–Coles is never dropped.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="league">League</Label>
          <div className="relative">
            <select
              id="league"
              value={leagueId}
              onChange={(e) => {
                const id = e.target.value;
                const first = pickUpcoming(slate.fixtures.filter((f) => f.leagueId === id));
                go({
                  league: id,
                  id: first?.id,
                  home: first?.homeId,
                  away: first?.awayId,
                });
              }}
              className="flex h-11 w-full appearance-none rounded-md bg-subtle py-0 pl-3 pr-8 text-sm text-fg shadow-[var(--shadow-border)]"
            >
              {slate.leagues.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.matchCount})
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint">
              <ChevronDown className="size-4" />
            </span>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="match">Match</Label>
          <div className="relative">
            <select
              id="match"
              value={fixture.id}
              onChange={(e) => {
                const fx = slate.fixtures.find((f) => f.id === e.target.value);
                if (!fx) return;
                go({ id: fx.id, home: fx.homeId, away: fx.awayId, league: fx.leagueId });
              }}
              className="flex h-11 w-full appearance-none rounded-md bg-subtle py-0 pl-3 pr-8 text-sm text-fg shadow-[var(--shadow-border)]"
            >
              {leagueFixtures.map((f) => {
                const h = teamMap.get(f.homeId);
                const a = teamMap.get(f.awayId);
                const ft = f.score
                  ? `${f.status === "live" ? "LIVE" : "FT"} ${f.score.home}–${f.score.away}${f.clock ? ` ${f.clock}` : ""}`
                  : f.kickoff;
                return (
                  <option key={f.id} value={f.id}>
                    {h?.short ?? "?"} v {a?.short ?? "?"} · {ft}
                  </option>
                );
              })}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint">
              <ChevronDown className="size-4" />
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
        <TeamMark team={home} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl tracking-tight sm:text-2xl">
            {home.name} <span className="text-faint">v</span> {away.name}
          </p>
          <p className="text-xs text-faint">
            {fixture.leagueName}
            {fixture.weekLabel ? ` · ${fixture.weekLabel}` : ""}
            {fixture.seasonLabel ? ` · ${fixture.seasonLabel}` : ""} · {fixture.kickoff}
            {fixture.score
              ? ` · ${fixture.status === "live" ? "LIVE" : "FT"} ${fixture.score.home}–${fixture.score.away}`
              : ""}{" "}
            · λ {priced.lambdaHome.toFixed(2)} – {priced.lambdaAway.toFixed(2)} ·{" "}
            {fixture.bookSource === "market" ? fixture.bookLabel : "model book"}
            {outN ? ` · ${outN} out` : ""}
          </p>
        </div>
        <TeamMark team={away} size="lg" />
      </div>

      <DeskCallCard
        call={matchCall}
        bankroll={desk.bankroll}
        onLog={calledTicket && matchCall.action !== "pass" ? () => addTicket(calledTicket) : undefined}
      />

      {calledTicket ? (
        <BetSheet ticket={calledTicket} profile={fixture.profile} heat={heat} correlated={correlated} />
      ) : null}

      <MatchFactsCard facts={fixture.facts} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Home" value={formatPct(priced.markets.home)} hint={`fair ${formatOdds(fairOdds(priced.markets.home))}`} />
        <Stat label="Draw" value={formatPct(priced.markets.draw)} hint={`fair ${formatOdds(fairOdds(priced.markets.draw))}`} />
        <Stat label="Away" value={formatPct(priced.markets.away)} hint={`fair ${formatOdds(fairOdds(priced.markets.away))}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Panel>
          <h2 className="font-display text-xl tracking-tight">Scoreline grid</h2>
          <p className="mb-3 mt-1 text-sm text-muted">Poisson × Dixon–Coles τ, after the fact sheet.</p>
          <ScoreMatrixGrid matrix={priced.matrix} />
        </Panel>

        <div className="space-y-4">
          <Panel>
            <h2 className="font-display text-xl tracking-tight">Derived markets</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row k={`Over ${line}`} v={formatPct(overP)} />
              <Row k={`Under ${line}`} v={formatPct(1 - overP)} />
              <Row k="BTTS yes" v={formatPct(priced.markets.bttsYes)} />
              <Row k="BTTS no" v={formatPct(priced.markets.bttsNo)} />
            </dl>
          </Panel>
          <Panel>
            <h2 className="font-display text-xl tracking-tight">Model knobs</h2>
            <div className="mt-4 space-y-4">
              <Knob
                label="Home advantage"
                value={desk.homeAdv}
                min={1}
                max={1.6}
                step={0.01}
                display={desk.homeAdv.toFixed(2)}
                onChange={desk.setHomeAdv}
              />
              <Knob
                label="Dixon–Coles ρ"
                value={desk.rho}
                min={-0.2}
                max={0.05}
                step={0.01}
                display={desk.rho.toFixed(2)}
                onChange={desk.setRho}
              />
            </div>
            <p className="mt-3 text-xs text-faint">
              Attack/defence start from the table, then shift for XI, injuries, rest and weather.
            </p>
          </Panel>
        </div>
      </div>

      <Panel>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-xl tracking-tight">Book vs model</h2>
            <p className="mt-1 text-sm text-muted">
              Overround {formatPct(vig)} · stake uses {formatPct(desk.kellyFractionUsed, 0)} Kelly on{" "}
              {formatUnits(desk.bankroll)} u
            </p>
          </div>
          <Link to="/devig" className="text-sm text-muted underline-offset-4 hover:text-fg hover:underline">
            Open the devig desk
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Home odds", value: oddsH, set: setOddsH },
            { label: "Draw odds", value: oddsD, set: setOddsD },
            { label: "Away odds", value: oddsA, set: setOddsA },
          ].map((f) => (
            <div key={f.label} className="space-y-1.5">
              <Label htmlFor={f.label}>{f.label}</Label>
              <Input
                id={f.label}
                type="number"
                inputMode="decimal"
                min={1.01}
                step={0.01}
                value={Number.isFinite(f.value) ? f.value : ""}
                onChange={(e) => f.set(Number(e.target.value))}
              />
            </div>
          ))}
        </div>
        <ul className="mt-4 divide-y divide-border">
          {allTickets.map((t) => (
            <li key={t.key} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {t.key} · {t.label}
                </p>
                <p className="text-xs text-faint">
                  model {formatPct(t.p)} · fair {formatOdds(t.fair)} · book {formatOdds(t.odds)}
                  {t.sideRisk ? ` · risk ${formatPct(t.sideRisk)}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <CallBadge action={t.call.action} />
                <span className="text-xs text-muted tabular">stake {formatPct(t.kelly, 1)}</span>
                <Button
                  size="sm"
                  variant={t.call.action === "pass" ? "outline" : "default"}
                  disabled={t.ev <= 0}
                  onClick={() => addTicket(t)}
                >
                  Journal
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{k}</dt>
      <dd className="tabular">{v}</dd>
    </div>
  );
}

function Knob({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <span className="font-mono text-xs tabular text-fg">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-11 w-full accent-accent"
      />
    </div>
  );
}
