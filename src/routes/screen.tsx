import { createFileRoute, Link } from "@tanstack/react-router";
import { priceFixture } from "@/lib/data/fixtures";
import { loadSlate, type Slate } from "@/lib/data/load-slate";
import { arbRows, evRows, holdRows, middleRows } from "@/lib/math/screen";
import { useDesk } from "@/lib/store";
import { effectiveBlend, learnFromBets } from "@/lib/journal-learn";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/day-strip";
import { formatOdds, formatPct, formatSignedPct } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Search = { view?: string };

export const Route = createFileRoute("/screen")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    view: typeof s.view === "string" ? s.view : "ev",
  }),
  loader: () => loadSlate(),
  staleTime: 0,
  pendingMs: 250,
  pendingComponent: () => (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Screen</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Pulling books…</h1>
    </div>
  ),
  component: ScreenPage,
});

const VIEWS = [
  { id: "ev", label: "+EV" },
  { id: "odds", label: "Odds" },
  { id: "arb", label: "Arb" },
  { id: "middles", label: "Middles" },
  { id: "hold", label: "Hold" },
] as const;

function ScreenPage() {
  const slate = Route.useLoaderData() as Slate;
  const view = (Route.useSearch().view || "ev") as (typeof VIEWS)[number]["id"];
  const navigate = Route.useNavigate();
  const homeAdv = useDesk((s) => s.homeAdv);
  const rho = useDesk((s) => s.rho);
  const kellyF = useDesk((s) => s.kellyFractionUsed);
  const fmt = useDesk((s) => s.oddsFormat);
  const bets = useDesk((s) => s.bets);
  const blendW = effectiveBlend(slate.study?.blendW ?? 0.22, learnFromBets(bets).blendDelta);
  const teamMap = new Map(slate.teams.map((t) => [t.id, t]));

  const priced = slate.fixtures.flatMap((f) => {
    if (f.status === "post") return [];
    const home = teamMap.get(f.homeId);
    const away = teamMap.get(f.awayId);
    if (!home || !away) return [];
    return [priceFixture(f, homeAdv, rho, home, away, f.status === "pre" ? blendW : 0)];
  });

  const ev = evRows(priced, kellyF);
  const arbs = arbRows(priced);
  const mids = middleRows(priced);
  const holds = holdRows(priced).slice(0, 40);
  const bookNames = [...new Set(priced.flatMap((p) => (p.fixture.books || []).map((b) => b.book)))].slice(0, 6);
  const nBooks = bookNames.length;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            Screen · {nBooks} books · {priced.length} live markets
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">Shop the number</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Fairline fair vs DraftKings, Bet365 and every other book ESPN is sending. +EV is model vs best
            price. Arb is only when two books actually disagree.
          </p>
        </div>
      </header>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {VIEWS.map((v) => (
          <Chip key={v.id} active={view === v.id} onClick={() => navigate({ search: { view: v.id } })}>
            {v.label}
            <span className="ml-1.5 tabular text-faint">
              {v.id === "ev" ? ev.length : v.id === "arb" ? arbs.length : v.id === "middles" ? mids.length : ""}
            </span>
          </Chip>
        ))}
      </div>

      {view === "ev" ? (
        <EvTable rows={ev} fmt={fmt} />
      ) : view === "odds" ? (
        <OddsTable priced={priced} books={bookNames} fmt={fmt} />
      ) : view === "arb" ? (
        arbs.length ? (
          <ArbTable rows={arbs} fmt={fmt} />
        ) : (
          <p className="text-sm text-muted">No 1X2 arb right now. That is normal — two books have to split.</p>
        )
      ) : view === "middles" ? (
        mids.length ? (
          <MidTable rows={mids} fmt={fmt} />
        ) : (
          <p className="text-sm text-muted">No total-line middle. Need two books with different O/U numbers.</p>
        )
      ) : (
        <HoldTable rows={holds} fmt={fmt} />
      )}
    </div>
  );
}

function EvTable({ rows, fmt }: { rows: ReturnType<typeof evRows>; fmt: "decimal" | "american" }) {
  if (!rows.length) return <p className="text-sm text-muted">No +EV vs the model on the shopped number.</p>;
  return (
    <div className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-[11px] uppercase tracking-wider text-faint">
          <tr className="border-b border-border">
            <th className="px-3 py-2 font-medium">EV</th>
            <th className="px-3 py-2 font-medium">Match</th>
            <th className="px-3 py-2 font-medium">Pick</th>
            <th className="px-3 py-2 font-medium">Fair</th>
            <th className="px-3 py-2 font-medium">Best</th>
            <th className="px-3 py-2 font-medium">Book</th>
            <th className="px-3 py-2 font-medium">Kelly</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 60).map((r) => (
            <tr key={`${r.fixture.id}-${r.market}-${r.book}`} className="border-t border-border">
              <td className={cn("px-3 py-2 font-mono tabular", r.ev >= 0.05 ? "text-positive" : "text-fg")}>
                {formatSignedPct(r.ev)}
              </td>
              <td className="px-3 py-2">
                <Link
                  to="/engine"
                  search={{ home: r.fixture.homeId, away: r.fixture.awayId, league: r.fixture.leagueId, id: r.fixture.id }}
                  className="hover:text-fg"
                >
                  {r.home}–{r.away}
                  <span className="ml-2 text-xs text-faint">{r.fixture.leagueAbbr}</span>
                </Link>
              </td>
              <td className="px-3 py-2">
                {r.market} {r.selection}
              </td>
              <td className="px-3 py-2 font-mono tabular text-faint">{formatOdds(r.fair, 2, fmt)}</td>
              <td className="px-3 py-2 font-mono tabular">{formatOdds(r.odds, 2, fmt)}</td>
              <td className="px-3 py-2 text-xs text-muted">{r.book}</td>
              <td className="px-3 py-2 font-mono tabular text-faint">{formatPct(r.kelly, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OddsTable({
  priced,
  books,
  fmt,
}: {
  priced: ReturnType<typeof priceFixture>[];
  books: string[];
  fmt: "decimal" | "american";
}) {
  const cols = books.length ? books : ["Book"];
  return (
    <div className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="text-[11px] uppercase tracking-wider text-faint">
          <tr className="border-b border-border">
            <th className="px-3 py-2 font-medium">Match</th>
            <th className="px-3 py-2 font-medium">Fair 1X2</th>
            {cols.map((b) => (
              <th key={b} className="px-3 py-2 font-medium">
                {b}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {priced.slice(0, 80).map((p) => {
            const fair = `${formatOdds(1 / p.model.home, 2, fmt)} ${formatOdds(1 / p.model.draw, 2, fmt)} ${formatOdds(1 / p.model.away, 2, fmt)}`;
            const quotes = p.fixture.books?.length ? p.fixture.books : [{ book: "Book", ...p.fixture.book1x2 }];
            return (
              <tr key={p.fixture.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <Link
                    to="/engine"
                    search={{ home: p.home.id, away: p.away.id, league: p.fixture.leagueId, id: p.fixture.id }}
                  >
                    {p.home.short}–{p.away.short}
                    <span className="ml-2 text-xs text-faint">{p.fixture.leagueAbbr}</span>
                    {p.fixture.status === "live" ? <span className="ml-2 text-warn">LIVE</span> : null}
                  </Link>
                </td>
                <td className="px-3 py-2 font-mono text-xs tabular text-faint">{fair}</td>
                {cols.map((name) => {
                  const q = quotes.find((b) => b.book === name) || (cols.length === 1 ? quotes[0] : null);
                  if (!q) return <td key={name} className="px-3 py-2 text-faint">—</td>;
                  const bestH = Math.max(...quotes.map((b) => b.home));
                  return (
                    <td key={name} className="px-3 py-2 font-mono text-xs tabular">
                      <span className={q.home === bestH ? "text-positive" : ""}>{formatOdds(q.home, 2, fmt)}</span>{" "}
                      {formatOdds(q.draw, 2, fmt)} {formatOdds(q.away, 2, fmt)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ArbTable({ rows, fmt }: { rows: ReturnType<typeof arbRows>; fmt: "decimal" | "american" }) {
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.fixture.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">
              {r.home}–{r.away}
              <span className="ml-2 text-xs text-faint">{r.fixture.leagueAbbr}</span>
            </p>
            <Badge tone="positive">{formatPct(r.profit)} arb</Badge>
          </div>
          <p className="mt-2 text-xs text-muted">
            1 {r.homeBook} {formatOdds(r.homeOdds, 2, fmt)} · X {r.drawBook} {formatOdds(r.drawOdds, 2, fmt)} · 2{" "}
            {r.awayBook} {formatOdds(r.awayOdds, 2, fmt)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function MidTable({ rows, fmt }: { rows: ReturnType<typeof middleRows>; fmt: "decimal" | "american" }) {
  return (
    <ul className="space-y-2">
      {rows.map((r, i) => (
        <li key={`${r.fixture.id}-${i}`} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-sm font-medium">
            {r.home}–{r.away}
            <span className="ml-2 text-xs text-faint">{r.fixture.leagueAbbr} · gap {r.gap}</span>
          </p>
          <p className="mt-2 text-xs text-muted">
            Over {r.overLine} {r.overBook} {formatOdds(r.overOdds, 2, fmt)} · Under {r.underLine} {r.underBook}{" "}
            {formatOdds(r.underOdds, 2, fmt)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function HoldTable({
  rows,
  fmt,
}: {
  rows: ReturnType<typeof holdRows>;
  fmt: "decimal" | "american";
}) {
  return (
    <div className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="text-[11px] uppercase tracking-wider text-faint">
          <tr className="border-b border-border">
            <th className="px-3 py-2 font-medium">Hold</th>
            <th className="px-3 py-2 font-medium">Match</th>
            <th className="px-3 py-2 font-medium">Book</th>
            <th className="px-3 py-2 font-medium">1X2</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.fixture.id}-${r.book}-${i}`} className="border-t border-border">
              <td className={cn("px-3 py-2 font-mono tabular", r.hold < 0.05 ? "text-positive" : "")}>
                {formatPct(r.hold)}
              </td>
              <td className="px-3 py-2">
                {r.home}–{r.away}
              </td>
              <td className="px-3 py-2 text-xs text-muted">{r.book}</td>
              <td className="px-3 py-2 font-mono text-xs tabular">
                {formatOdds(r.homeOdds, 2, fmt)} {formatOdds(r.drawOdds, 2, fmt)} {formatOdds(r.awayOdds, 2, fmt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
