import type { BookQuote, Fixture, PricedFixture } from "@/lib/data/fixtures";
import { expectedValue, impliedProb } from "@/lib/math/odds";

export function overround(q: Pick<BookQuote, "home" | "draw" | "away">): number {
  const s = impliedProb(q.home) + impliedProb(q.draw) + impliedProb(q.away);
  return s > 0 ? s - 1 : 0;
}

export function bestQuote(books: BookQuote[]): BookQuote | null {
  if (!books.length) return null;
  return {
    book: "Best",
    home: Math.max(...books.map((b) => b.home)),
    draw: Math.max(...books.map((b) => b.draw)),
    away: Math.max(...books.map((b) => b.away)),
  };
}

export function arbPct(books: BookQuote[]): number | null {
  const best = bestQuote(books);
  if (!best) return null;
  const sum = impliedProb(best.home) + impliedProb(best.draw) + impliedProb(best.away);
  if (sum <= 0 || sum >= 1) return null;
  return 1 - sum;
}

export interface EvRow {
  fixture: Fixture;
  home: string;
  away: string;
  market: "1" | "X" | "2";
  selection: string;
  fair: number;
  book: string;
  odds: number;
  ev: number;
  juice: number;
  kelly: number;
}

export function evRows(
  priced: PricedFixture[],
  kellyF: number,
): EvRow[] {
  const rows: EvRow[] = [];
  for (const p of priced) {
    if (p.fixture.status === "post") continue;
    const books = p.fixture.books?.filter((b) => b.home > 1.01 && b.draw > 1.01 && b.away > 1.01) || [];
    const quotes = books.length ? books : [{ book: p.fixture.bookLabel || "Book", ...p.fixture.book1x2 }];
    const fair = { home: 1 / p.model.home, draw: 1 / p.model.draw, away: 1 / p.model.away };
    const sides: { market: EvRow["market"]; selection: string; fair: number; key: "home" | "draw" | "away" }[] = [
      { market: "1", selection: p.home.short, fair: fair.home, key: "home" },
      { market: "X", selection: "Draw", fair: fair.draw, key: "draw" },
      { market: "2", selection: p.away.short, fair: fair.away, key: "away" },
    ];
    for (const side of sides) {
      let top: { book: string; odds: number } | null = null;
      for (const q of quotes) {
        const odds = q[side.key];
        if (!(odds > 1.01)) continue;
        if (!top || odds > top.odds) top = { book: q.book, odds };
      }
      if (!top || top.odds < 1.25 || top.odds > 6.5) continue;
      const pTrue = side.key === "home" ? p.model.home : side.key === "draw" ? p.model.draw : p.model.away;
      const ev = expectedValue(pTrue, top.odds);
      if (ev < 0.03 || ev > 0.28) continue;
      const b = top.odds - 1;
      const q = 1 - pTrue;
      const full = (b * pTrue - q) / b;
      rows.push({
        fixture: p.fixture,
        home: p.home.short,
        away: p.away.short,
        market: side.market,
        selection: side.selection,
        fair: side.fair,
        book: top.book,
        odds: top.odds,
        ev,
        juice: overround(quotes[0]!),
        kelly: Math.max(0, full * kellyF),
      });
    }
  }
  rows.sort((a, b) => b.ev - a.ev);
  return rows;
}

export interface ArbRow {
  fixture: Fixture;
  home: string;
  away: string;
  homeBook: string;
  drawBook: string;
  awayBook: string;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  profit: number;
}

export function arbRows(priced: PricedFixture[]): ArbRow[] {
  const out: ArbRow[] = [];
  for (const p of priced) {
    const books = p.fixture.books || [];
    if (books.length < 2) continue;
    const profit = arbPct(books);
    if (profit == null || profit < 0.002) continue;
    const h = books.reduce((a, b) => (b.home > a.home ? b : a));
    const d = books.reduce((a, b) => (b.draw > a.draw ? b : a));
    const a = books.reduce((a, b) => (b.away > a.away ? b : a));
    out.push({
      fixture: p.fixture,
      home: p.home.short,
      away: p.away.short,
      homeBook: h.book,
      drawBook: d.book,
      awayBook: a.book,
      homeOdds: h.home,
      drawOdds: d.draw,
      awayOdds: a.away,
      profit,
    });
  }
  out.sort((a, b) => b.profit - a.profit);
  return out;
}

export interface MiddleRow {
  fixture: Fixture;
  home: string;
  away: string;
  overBook: string;
  underBook: string;
  overLine: number;
  underLine: number;
  gap: number;
  overOdds: number;
  underOdds: number;
}

export function middleRows(priced: PricedFixture[]): MiddleRow[] {
  const out: MiddleRow[] = [];
  for (const p of priced) {
    const books = (p.fixture.books || []).filter((b) => b.line && b.over && b.under);
    if (books.length < 2) continue;
    for (let i = 0; i < books.length; i++) {
      for (let j = 0; j < books.length; j++) {
        if (i === j) continue;
        const over = books[i]!;
        const under = books[j]!;
        const gap = (under.line || 0) - (over.line || 0);
        if (gap < 0.5) continue;
        out.push({
          fixture: p.fixture,
          home: p.home.short,
          away: p.away.short,
          overBook: over.book,
          underBook: under.book,
          overLine: over.line!,
          underLine: under.line!,
          gap,
          overOdds: over.over!,
          underOdds: under.under!,
        });
      }
    }
  }
  out.sort((a, b) => b.gap - a.gap);
  return out;
}

export function holdRows(priced: PricedFixture[]) {
  return priced
    .filter((p) => p.fixture.status !== "post")
    .flatMap((p) =>
      (p.fixture.books || [ { book: p.fixture.bookLabel || "Book", ...p.fixture.book1x2 } ]).map((b) => ({
        fixture: p.fixture,
        home: p.home.short,
        away: p.away.short,
        book: b.book,
        hold: overround(b),
        homeOdds: b.home,
        drawOdds: b.draw,
        awayOdds: b.away,
      })),
    )
    .sort((a, b) => a.hold - b.hold);
}
