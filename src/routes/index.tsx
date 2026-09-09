import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowUpRight } from "lucide-react";
import { priceFixture, type PricedFixture } from "@/lib/data/fixtures";
import { REGIONS, type LeagueRegion } from "@/lib/data/leagues";
import { loadSlate, type Slate } from "@/lib/data/load-slate";
import { bestCall, scoreTicket, type DeskCall } from "@/lib/math/call";
import { gradeCall, scoreline } from "@/lib/math/grade";
import { Badge } from "@/components/ui/badge";
import { useDesk } from "@/lib/store";
import { useAutoSettle } from "@/lib/use-auto-settle";
import { useDeskLedger } from "@/lib/use-desk-ledger";
import { ledgerStats, useLedger } from "@/lib/store-ledger";
import { enableAlerts } from "@/lib/alerts";
import { effectiveBlend, learnFromBets } from "@/lib/journal-learn";
import { TeamMark } from "@/components/team-mark";
import { CallBadge } from "@/components/desk-call";
import { FactChip } from "@/components/match-facts";
import { GateChip } from "@/components/bet-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel, Stat } from "@/components/stat";
import { formatOdds, formatPct, formatSignedPct } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { dayHeading, dayKey, dayLabel, kickoffHm, todayKey, weekStrip } from "@/lib/day";
import { remainingFraction } from "@/lib/math/dixon-coles";
import { Chip, DayStrip } from "@/components/day-strip";

type Search = { league?: string; region?: string; week?: string; day?: string; q?: string; call?: string };

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    league: typeof s.league === "string" ? s.league : "all",
    region: typeof s.region === "string" ? s.region : "all",
    week: typeof s.week === "string" ? s.week : undefined,
    day: typeof s.day === "string" ? s.day : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
    call: typeof s.call === "string" ? s.call : undefined,
  }),
  loader: () => loadSlate(),
  staleTime: 0,
  pendingMs: 250,
  pendingComponent: BoardPending,
  component: Board,
});

function BoardPending() {
  return (
    <div className="space-y-4">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Worldwide desk</p>
      <h1 className="font-display text-4xl tracking-tight">Pulling the slate…</h1>
      <p className="text-sm text-muted">Detecting each league’s game week, then the XI and injury sheet.</p>
    </div>
  );
}

function Board() {
  const slate = Route.useLoaderData() as Slate;
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const homeAdv = useDesk((s) => s.homeAdv);
  const rho = useDesk((s) => s.rho);
  const kellyF = useDesk((s) => s.kellyFractionUsed);
  const bets = useDesk((s) => s.bets);
  const ledgerTickets = useLedger((s) => s.tickets);
  const sitIds = useLedger((s) => s.sitIds);
  const introDone = useLedger((s) => s.introDone);
  const dismissIntro = useLedger((s) => s.dismissIntro);
  const setAlertsOn = useDesk((s) => s.setAlertsOn);
  useAutoSettle(slate.fixtures);
  const blendW = effectiveBlend(
    slate.study?.blendW ?? 0.22,
    (learnFromBets(bets).blendDelta + learnFromBets(ledgerTickets).blendDelta) / 2,
  );

  const leagueId = search.league || "all";
  const region = (search.region || "all") as "all" | LeagueRegion;
  const query = (search.q || "").trim().toLowerCase();
  const callView = search.call === "bet" || search.call === "lean" ? search.call : "all";
  const today = todayKey();
  const days = weekStrip(today);
  const day = search.day && days.includes(search.day) ? search.day : today;
  const dayIsPast = day < today;

  const teamMap = useMemo(() => new Map(slate.teams.map((t) => [t.id, t])), [slate.teams]);
  const regionLeagues = slate.leagues.filter((l) => region === "all" || l.region === region);

  const pricedAll = useMemo(
    () =>
      slate.fixtures.flatMap((f) => {
        const home = teamMap.get(f.homeId);
        const away = teamMap.get(f.awayId);
        if (!home || !away) return [];
        return [priceFixture(f, homeAdv, rho, home, away, f.status === "pre" ? blendW : 0)];
      }),
    [slate.fixtures, teamMap, homeAdv, rho, blendW],
  );

  const resultPricedAll = pricedAll.filter((r) => r.fixture.status === "post" || r.fixture.status === "live");
  const liveAll = pricedAll.filter((r) => r.fixture.status === "pre");

  const ticketMeta = (row: (typeof pricedAll)[number], sel: (typeof pricedAll)[number]["selections"][number]) => ({
    market: sel.market,
    source: row.fixture.bookSource,
    sideRisk: sel.sideRisk,
    factsNote: row.factsNotes[0],
    profile: row.fixture.profile,
    side: sel.selection,
    live: row.fixture.status === "live",
    remainingFrac: remainingFraction(row.fixture.elapsedMin, row.fixture.phase),
    clock: row.fixture.clock,
  });

  useDeskLedger(liveAll, resultPricedAll, kellyF);

  const inRegion = (league?: string) => !league || region === "all" || regionLeagues.some((l) => l.id === league);

  const dayCounts: Record<string, number> = Object.fromEntries(days.map((d) => [d, 0]));
  for (const row of pricedAll) {
    if (leagueId !== "all" && row.fixture.leagueId !== leagueId) continue;
    if (!inRegion(row.fixture.leagueId)) continue;
    const k = dayKey(row.fixture.kickoffIso);
    if (k in dayCounts) dayCounts[k] += 1;
  }

  const inPlay = pricedAll
    .filter((row) => {
      if (row.fixture.status !== "live") return false;
      if (leagueId !== "all" && row.fixture.leagueId !== leagueId) return false;
      if (!inRegion(row.fixture.leagueId)) return false;
      if (query) {
        const blob = `${row.home.name} ${row.away.name} ${row.home.short} ${row.away.short} ${row.fixture.leagueName}`.toLowerCase();
        if (!blob.includes(query)) return false;
      }
      return true;
    })
    .sort((a, b) => (b.fixture.elapsedMin || 0) - (a.fixture.elapsedMin || 0));

  const priced = pricedAll
    .filter((row) => {
      if (leagueId !== "all" && row.fixture.leagueId !== leagueId) return false;
      if (!inRegion(row.fixture.leagueId)) return false;
      if (query) {
        const blob = `${row.home.name} ${row.away.name} ${row.home.short} ${row.away.short} ${row.fixture.leagueName}`.toLowerCase();
        if (!blob.includes(query)) return false;
      }
      return dayKey(row.fixture.kickoffIso) === day;
    })
    .slice()
    .sort((a, b) => (a.fixture.kickoffIso || "").localeCompare(b.fixture.kickoffIso || ""));

  function ticketsOf(rows: typeof priced) {
    const list = rows.flatMap((row) =>
      row.selections
        .map((sel) => {
          const scored = scoreTicket(sel.label, sel.modelP, sel.odds, kellyF, ticketMeta(row, sel));
          return { row, sel, ...scored };
        })
        .filter((x) => {
          if (x.call.action === "pass") return false;
          if (callView === "bet") return x.call.action === "bet";
          if (callView === "lean") return x.call.action === "lean";
          return true;
        }),
    );
    list.sort((a, b) => (a.call.action === "bet" && b.call.action !== "bet" ? -1 : b.ev - a.ev));
    return list;
  }

  const inPlayTickets = ticketsOf(inPlay);
  const liveTickets = ticketsOf(priced.filter((r) => r.fixture.status === "pre"));
  const betCalls = liveTickets.filter((e) => e.call.action === "bet");
  const rec = ledgerStats(ledgerTickets, sitIds.length);

  const leagueCards = regionLeagues
    .map((l) => {
      const rows = priced.filter((p) => p.fixture.leagueId === l.id);
      const liveN = inPlay.filter((p) => p.fixture.leagueId === l.id).length;
      return { ...l, matchCount: rows.length + liveN };
    })
    .filter((l) => l.matchCount > 0);

  const selectedLeague = slate.leagues.find((l) => l.id === leagueId);

  const kickoffGroups = (() => {
    const map = new Map<string, typeof priced>();
    for (const row of priced) {
      const key =
        row.fixture.status === "post"
          ? "FT"
          : kickoffHm(row.fixture.kickoffIso) || row.fixture.kickoff || "TBD";
      const list = map.get(key) || [];
      list.push(row);
      map.set(key, list);
    }
    const order = (k: string) => (k === "FT" ? "9" : k);
    return [...map.entries()].sort((a, b) => order(a[0]).localeCompare(order(b[0])));
  })();

  function setFilter(next: Search) {
    navigate({
      search: {
        league: next.league ?? leagueId,
        region: next.region ?? region,
        day: next.day ?? day,
        q: "q" in next ? next.q : query || undefined,
        call: "call" in next ? next.call : callView !== "all" ? callView : undefined,
        week: undefined,
      },
    });
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            {slate.source === "espn" ? "Live desk" : "Demo"} · {slate.leagues.length} leagues ·{" "}
            {new Date(slate.asOf).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} UTC
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">{dayHeading(day, today)}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            {inPlay.length ? `${inPlay.length} in-play · ` : ""}
            {priced.length} on {dayLabel(day, today)}
            {selectedLeague ? ` · ${selectedLeague.name}` : region !== "all" ? ` · ${region}` : " · all leagues"}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:min-w-80 sm:p-4">
          <Stat label="Sit rate" value={rec.sitRate != null ? formatPct(rec.sitRate, 0) : "—"} />
          <Stat
            label="Tickets"
            value={`${betCalls.length + inPlayTickets.filter((e) => e.call.action === "bet").length}`}
            hint={inPlay.length ? `${inPlay.length} live` : `${liveTickets.length - betCalls.length} lean`}
            tone={betCalls.length || inPlayTickets.some((e) => e.call.action === "bet") ? "positive" : "neutral"}
          />
          <Stat
            label="Hit"
            value={rec.hit != null ? formatPct(rec.hit, 0) : "—"}
            tone={rec.hit == null ? "neutral" : rec.hit >= 0.5 ? "positive" : "negative"}
          />
        </div>
      </section>

      <section className="sticky top-14 z-20 -mx-4 space-y-2 bg-bg/90 px-4 py-3 backdrop-blur-md sm:top-16">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-faint">Matchday</p>
        <DayStrip days={days} value={day} today={today} counts={dayCounts} onChange={(d) => setFilter({ day: d })} />
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {REGIONS.map((r) => (
            <Chip
              key={r.id}
              active={region === r.id && leagueId === "all"}
              onClick={() => setFilter({ league: "all", region: r.id })}
            >
              {r.label}
            </Chip>
          ))}
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Chip
            active={leagueId === "all"}
            tone="subtle"
            onClick={() => setFilter({ league: "all", region })}
          >
            All
            <span className="ml-1.5 tabular text-faint">{priced.length}</span>
          </Chip>
          {leagueCards.map((l) => (
            <Chip
              key={l.id}
              active={leagueId === l.id}
              tone="subtle"
              onClick={() => setFilter({ league: l.id, region: l.region })}
            >
              {l.abbr}
              <span className="ml-1.5 tabular text-faint">{l.matchCount}</span>
            </Chip>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={search.q || ""}
            placeholder="Search team or league"
            onChange={(e) => setFilter({ q: e.target.value || undefined })}
            className="h-11 sm:max-w-xs"
          />
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Chip active={callView === "all"} tone="subtle" onClick={() => setFilter({ call: undefined })}>
              All calls
            </Chip>
            <Chip active={callView === "bet"} tone="subtle" onClick={() => setFilter({ call: "bet" })}>
              BET
            </Chip>
            <Chip active={callView === "lean"} tone="subtle" onClick={() => setFilter({ call: "lean" })}>
              LEAN
            </Chip>
          </div>
        </div>
      </section>

      {day === today && inPlay.length ? (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-3xl tracking-tight text-warn">In-play</h2>
            <p className="text-xs text-faint">{inPlay.length} live · remaining xG</p>
          </div>
          {inPlayTickets.length ? (
            <ul className="space-y-2">
              {inPlayTickets.slice(0, 16).map(({ row, sel, ev, kelly, call }) => (
                <li key={`live-${row.fixture.id}-${sel.selection}`}>
                  <TicketLine row={row} sel={sel} ev={ev} kelly={kelly} call={call} live />
                </li>
              ))}
            </ul>
          ) : null}
          <ul className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
            {inPlay.map((row) => (
              <GameLine key={row.fixture.id} row={row} kellyF={kellyF} ticketMeta={ticketMeta} live />
            ))}
          </ul>
        </section>
      ) : day !== today && inPlay.length ? (
        <button
          type="button"
          className="text-left text-xs text-warn hover:text-fg"
          onClick={() => setFilter({ day: today })}
        >
          {inPlay.length} live now — jump to today
        </button>
      ) : null}

      {slate.study?.n ? (
        <p className="text-xs text-faint">
          Market study · blend {Math.round(blendW * 100)}% to close · {slate.study.note}
        </p>
      ) : null}

      {!dayIsPast ? (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-2xl tracking-tight">Tickets</h2>
            <Link to="/record" className="text-xs text-muted hover:text-fg">
              Record
              <ArrowUpRight className="ml-1 inline size-3" />
            </Link>
          </div>
          {liveTickets.length === 0 ? (
            <p className="text-sm text-muted">
              {callView === "bet"
                ? "No BET on this filter. Sitting is the product."
                : "No ticket clears the desk on this filter."}
            </p>
          ) : (
            <ul className="space-y-2">
              {liveTickets.slice(0, 12).map(({ row, sel, ev, kelly, call }) => (
                <li key={`${row.fixture.id}-${sel.market}-${sel.selection}`}>
                  <TicketLine row={row} sel={sel} ev={ev} kelly={kelly} call={call} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {priced.length === 0 ? (
        <Panel>
          <p className="text-sm text-muted">No matches on this day for that filter. Pick another date.</p>
        </Panel>
      ) : (
        <section className="space-y-6">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-2xl tracking-tight">{dayIsPast ? "Results" : "Slate"}</h2>
            <p className="text-xs text-faint">{priced.length} games · grouped by kickoff</p>
          </div>
          {kickoffGroups.map(([when, rows]) => (
            <div key={when} className="space-y-2">
              <p
                className={cn(
                  "text-xs font-medium uppercase tracking-[0.16em]",
                  when === "LIVE" ? "text-warn" : "text-faint",
                )}
              >
                {when === "FT" ? "Full time" : when}
              </p>
              <ul className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
                {rows.map((row) => {
                  const matchCall = bestCall(
                    row.selections.map((sel) => ({
                      ...scoreTicket(sel.label, sel.modelP, sel.odds, kellyF, ticketMeta(row, sel)),
                      ...ticketMeta(row, sel),
                    })),
                  );
                  const called = row.selections.find((s) => s.label === matchCall.selection);
                  const grade =
                    row.fixture.status === "post" ? gradeCall(matchCall, row.fixture.score, called?.selection) : null;
                  const ft = row.fixture.score ? scoreline(row.fixture.score) : null;
                  return (
                    <li key={row.fixture.id} className="border-t border-border first:border-t-0">
                      <Link
                        to="/engine"
                        search={{
                          home: row.home.id,
                          away: row.away.id,
                          league: row.fixture.leagueId,
                          id: row.fixture.id,
                        }}
                        className="flex items-center gap-3 px-3 py-3 transition-colors duration-150 hover:bg-subtle/60 sm:px-4"
                      >
                        <div className="flex gap-1">
                          <TeamMark team={row.home} size="sm" />
                          <TeamMark team={row.away} size="sm" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {row.home.short}
                            {ft ? ` ${ft} ` : " – "}
                            {row.away.short}
                            {row.fixture.status === "live" ? (
                              <span className="ml-2 text-warn">LIVE {row.fixture.clock || ""}</span>
                            ) : null}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-faint">
                            {row.fixture.leagueAbbr}
                            {row.fixture.weekLabel ? ` · ${row.fixture.weekLabel}` : ""}
                            {" · "}
                            <FactChip facts={row.fixture.facts} />
                            <GateChip profile={row.fixture.profile} />
                          </p>
                        </div>
                        <div className="hidden items-center gap-4 sm:flex">
                          <OddsMini label="1" book={row.fixture.book1x2.home} fair={1 / row.model.home} />
                          <OddsMini label="X" book={row.fixture.book1x2.draw} fair={1 / row.model.draw} />
                          <OddsMini label="2" book={row.fixture.book1x2.away} fair={1 / row.model.away} />
                        </div>
                        {grade ? (
                          <Badge tone={grade === "hit" ? "positive" : grade === "miss" ? "negative" : "neutral"}>
                            {grade === "hit" ? "HIT" : grade === "miss" ? "MISS" : "SAT"}
                          </Badge>
                        ) : (
                          <CallBadge action={matchCall.action} />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function TicketLine({
  row,
  sel,
  ev,
  kelly,
  call,
  live,
}: {
  row: PricedFixture;
  sel: PricedFixture["selections"][number];
  ev: number;
  kelly: number;
  call: DeskCall;
  live?: boolean;
}) {
  const fmt = useDesk((s) => s.oddsFormat);
  return (
    <Link
      to="/engine"
      search={{
        home: row.home.id,
        away: row.away.id,
        league: row.fixture.leagueId,
        id: row.fixture.id,
      }}
      className="flex items-center gap-3 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)] sm:p-4"
    >
      <div className="flex items-center gap-2">
        <TeamMark team={row.home} size="sm" />
        <TeamMark team={row.away} size="sm" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {row.home.short}–{row.away.short}
          <span className="ml-2 text-muted">{sel.label}</span>
        </p>
        <p className="mt-0.5 truncate text-xs text-faint">
          {live ? `LIVE ${row.fixture.clock || ""} · ` : ""}
          {row.fixture.leagueAbbr} · {kickoffHm(row.fixture.kickoffIso) || row.fixture.kickoff} · {formatOdds(sel.odds, 2, fmt)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <CallBadge action={call.action} />
        <span className="whitespace-nowrap text-xs text-faint tabular">
          {formatSignedPct(ev)} · {formatPct(kelly, 1)}
        </span>
      </div>
    </Link>
  );
}

function GameLine({
  row,
  kellyF,
  ticketMeta,
  live,
}: {
  row: PricedFixture;
  kellyF: number;
  ticketMeta: (row: PricedFixture, sel: PricedFixture["selections"][number]) => Parameters<typeof scoreTicket>[4];
  live?: boolean;
}) {
  const matchCall = bestCall(
    row.selections.map((sel) => ({
      ...scoreTicket(sel.label, sel.modelP, sel.odds, kellyF, ticketMeta(row, sel)),
      ...ticketMeta(row, sel),
    })),
  );
  const called = row.selections.find((s) => s.label === matchCall.selection);
  const grade = row.fixture.status === "post" ? gradeCall(matchCall, row.fixture.score, called?.selection) : null;
  const ft = row.fixture.score ? scoreline(row.fixture.score) : null;
  return (
    <li className="border-t border-border first:border-t-0">
      <Link
        to="/engine"
        search={{
          home: row.home.id,
          away: row.away.id,
          league: row.fixture.leagueId,
          id: row.fixture.id,
        }}
        className="flex items-center gap-3 px-3 py-3 transition-colors duration-150 hover:bg-subtle/60 sm:px-4"
      >
        <div className="flex gap-1">
          <TeamMark team={row.home} size="sm" />
          <TeamMark team={row.away} size="sm" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {row.home.short}
            {ft ? ` ${ft} ` : " – "}
            {row.away.short}
            {live ? <span className="ml-2 text-warn">LIVE {row.fixture.clock || ""}</span> : null}
          </p>
          <p className="mt-0.5 truncate text-xs text-faint">
            {row.fixture.leagueAbbr}
            {row.fixture.weekLabel ? ` · ${row.fixture.weekLabel}` : ""}
            {!live && row.fixture.status === "pre" ? ` · KO ${kickoffHm(row.fixture.kickoffIso)} ${koLabel(row.fixture.kickoffIso)}` : ""}
            {" · "}
            <FactChip facts={row.fixture.facts} />
            <GateChip profile={row.fixture.profile} />
          </p>
        </div>
        <div className="hidden items-center gap-4 sm:flex">
          <OddsMini label="1" book={row.fixture.book1x2.home} fair={1 / row.model.home} />
          <OddsMini label="X" book={row.fixture.book1x2.draw} fair={1 / row.model.draw} />
          <OddsMini label="2" book={row.fixture.book1x2.away} fair={1 / row.model.away} />
        </div>
        {grade ? (
          <Badge tone={grade === "hit" ? "positive" : grade === "miss" ? "negative" : "neutral"}>
            {grade === "hit" ? "HIT" : grade === "miss" ? "MISS" : "SAT"}
          </Badge>
        ) : (
          <CallBadge action={matchCall.action} />
        )}
      </Link>
    </li>
  );
}

function OddsMini({ label, book, fair }: { label: string; book: number; fair: number }) {
  const fmt = useDesk((s) => s.oddsFormat);
  const better = book > fair * 1.02;
  return (
    <div className="w-14 text-right">
      <p className="text-xs text-faint">{label}</p>
      <p className={cn("text-sm tabular", better && "text-positive")}>{formatOdds(book, 2, fmt)}</p>
    </div>
  );
}

function koLabel(iso?: string): string {
  if (!iso) return "";
  const ms = Date.parse(iso) - Date.now();
  if (!Number.isFinite(ms) || ms < 0 || ms > 48 * 3_600_000) return "";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h >= 1 ? `in ${h}h ${m}m` : `in ${m}m`;
}
