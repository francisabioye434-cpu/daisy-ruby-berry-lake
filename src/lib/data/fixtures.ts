import { liveMarketsFromScore, pOver, priceMatch, remainingFraction } from "@/lib/math/dixon-coles";
import { applyFacts, ticketSideRisk } from "@/lib/math/facts-adjust";
import type { MatchProfile } from "@/lib/math/bet-metrics";
import { blendThreeWay, marketFromOdds } from "@/lib/math/market-study";
import type { MatchFacts } from "./facts";
import { getTeam, type Team } from "./teams";

export interface BookQuote {
  book: string;
  home: number;
  draw: number;
  away: number;
  over?: number;
  under?: number;
  line?: number;
}

export interface Book1x2 {
  home: number;
  draw: number;
  away: number;
}

export interface BookTotals {
  over25: number;
  under25: number;
  bttsYes: number;
  bttsNo: number;
}

export interface Fixture {
  id: string;
  kickoff: string;
  kickoffIso?: string;
  venue: string;
  leagueId?: string;
  leagueName?: string;
  leagueAbbr?: string;
  homeId: string;
  awayId: string;
  book1x2: Book1x2;
  bookTotals: BookTotals;
  overLine?: number;
  bookSource?: "market" | "model";
  bookLabel?: string;
  books?: BookQuote[];
  status?: "pre" | "live" | "post";
  score?: { home: number; away: number };
  clock?: string;
  period?: number;
  elapsedMin?: number;
  phase?: "ht" | "h1" | "h2";
  week?: number;
  weekLabel?: string;
  seasonLabel?: string;
  note?: string;
  facts?: MatchFacts;
  bookOpen?: Book1x2;
  profile?: MatchProfile;
  settled?: {
    home: { attack: number; defense: number };
    away: { attack: number; defense: number };
    asOf: string;
  };
}

export const FIXTURES: Fixture[] = [
  {
    id: "mw5-ars-tot",
    kickoff: "Sat 12:30",
    venue: "Emirates",
    homeId: "ars",
    awayId: "tot",
    book1x2: { home: 1.62, draw: 4.6, away: 5.6 },
    bookTotals: { over25: 1.48, under25: 2.65, bttsYes: 1.58, bttsNo: 2.38 },
    note: "North London. Slight plus on the home price versus the model.",
  },
  {
    id: "mw5-mci-liv",
    kickoff: "Sat 17:30",
    venue: "Etihad",
    homeId: "mci",
    awayId: "liv",
    book1x2: { home: 2.05, draw: 3.6, away: 3.5 },
    bookTotals: { over25: 1.55, under25: 2.45, bttsYes: 1.52, bttsNo: 2.5 },
  },
  {
    id: "mw5-che-new",
    kickoff: "Sun 14:00",
    venue: "Stamford Bridge",
    homeId: "che",
    awayId: "new",
    book1x2: { home: 2.15, draw: 3.4, away: 3.4 },
    bookTotals: { over25: 1.72, under25: 2.1, bttsYes: 1.7, bttsNo: 2.15 },
  },
];

export interface PricedSelection {
  market: "1x2" | "totals" | "btts";
  selection: string;
  label: string;
  modelP: number;
  rawP?: number;
  odds: number;
  sideRisk?: number;
}

export interface PricedFixture {
  fixture: Fixture;
  home: Team;
  away: Team;
  lambdaHome: number;
  lambdaAway: number;
  model: ReturnType<typeof priceMatch>["markets"];
  selections: PricedSelection[];
  homeRisk: number;
  awayRisk: number;
  factsNotes: string[];
}

export function pickUpcoming(list: Fixture[]): Fixture | undefined {
  const live = list.filter((f) => f.status === "live");
  if (live.length) {
    return live.slice().sort((a, b) => (b.elapsedMin || 0) - (a.elapsedMin || 0))[0];
  }
  const pre = list.filter((f) => f.status === "pre" || !f.status);
  if (pre.length) {
    return pre.slice().sort((a, b) => (a.kickoffIso || "").localeCompare(b.kickoffIso || ""))[0];
  }
  return list.slice().sort((a, b) => (b.kickoffIso || "").localeCompare(a.kickoffIso || ""))[0];
}

export function priceFixture(
  fixture: Fixture,
  homeAdv = 1.32,
  rho = -0.08,
  homeTeam?: Team,
  awayTeam?: Team,
  marketWeight = 0,
): PricedFixture {
  const home = homeTeam ?? getTeam(fixture.homeId);
  const away = awayTeam ?? getTeam(fixture.awayId);
  const frozen = fixture.settled && (fixture.status === "post" || fixture.status === "live");
  const homeIn = frozen
    ? { ...home, attack: fixture.settled!.home.attack, defense: fixture.settled!.home.defense }
    : home;
  const awayIn = frozen
    ? { ...away, attack: fixture.settled!.away.attack, defense: fixture.settled!.away.defense }
    : away;
  const adj = applyFacts(homeIn, awayIn, fixture.facts, homeAdv);
  if (frozen) {
    adj.notes.unshift(`Frozen ${fixture.settled!.asOf} — this score is not in the ratings`);
  }
  const priced = priceMatch(adj.home, adj.away, { homeAdv: adj.homeAdv, rho });
  let m = priced.markets;
  const line = fixture.overLine ?? 2.5;
  let overP = Math.abs(line - 2.5) < 0.01 ? m.over25 : pOver(priced.matrix, line);
  let lambdaHome = priced.lambdaHome;
  let lambdaAway = priced.lambdaAway;
  const inPlay = fixture.status === "live" && fixture.score;
  if (inPlay && fixture.score) {
    const frac = remainingFraction(fixture.elapsedMin, fixture.phase);
    const live = liveMarketsFromScore(priced.lambdaHome, priced.lambdaAway, rho, fixture.score, frac, line);
    m = live.markets;
    overP = m.over25;
    lambdaHome = live.remHome;
    lambdaAway = live.remAway;
    adj.notes.unshift(
      `In-play ${fixture.clock || ""} · remaining xG ${live.remHome.toFixed(2)}–${live.remAway.toFixed(2)}`,
    );
  } else if (!frozen && marketWeight > 0 && fixture.bookSource === "market") {
    const book = marketFromOdds(fixture.book1x2);
    if (book) {
      const mixed = blendThreeWay({ home: m.home, draw: m.draw, away: m.away }, book, marketWeight);
      m = { ...m, home: mixed.home, draw: mixed.draw, away: mixed.away };
      adj.notes.push(`Market study ${Math.round(marketWeight * 100)}% toward close`);
    }
  }
  const selections: PricedSelection[] = [
    {
      market: "1x2",
      selection: "home",
      label: `${home.short} win`,
      modelP: m.home,
      odds: fixture.book1x2.home,
      sideRisk: ticketSideRisk(adj, "home"),
    },
    {
      market: "1x2",
      selection: "draw",
      label: "Draw",
      modelP: m.draw,
      odds: fixture.book1x2.draw,
      sideRisk: ticketSideRisk(adj, "draw"),
    },
    {
      market: "1x2",
      selection: "away",
      label: `${away.short} win`,
      modelP: m.away,
      odds: fixture.book1x2.away,
      sideRisk: ticketSideRisk(adj, "away"),
    },
    {
      market: "totals",
      selection: "over",
      label: `Over ${line}`,
      modelP: overP,
      odds: fixture.bookTotals.over25,
      sideRisk: ticketSideRisk(adj, "over"),
    },
    {
      market: "totals",
      selection: "under",
      label: `Under ${line}`,
      modelP: 1 - overP,
      odds: fixture.bookTotals.under25,
      sideRisk: ticketSideRisk(adj, "under"),
    },
    {
      market: "btts",
      selection: "yes",
      label: "BTTS yes",
      modelP: m.bttsYes,
      odds: fixture.bookTotals.bttsYes,
      sideRisk: ticketSideRisk(adj, "yes"),
    },
    {
      market: "btts",
      selection: "no",
      label: "BTTS no",
      modelP: m.bttsNo,
      odds: fixture.bookTotals.bttsNo,
      sideRisk: ticketSideRisk(adj, "no"),
    },
  ];
  return {
    fixture,
    home,
    away,
    lambdaHome,
    lambdaAway,
    model: m,
    selections,
    homeRisk: adj.homeRisk,
    awayRisk: adj.awayRisk,
    factsNotes: adj.notes,
  };
}
