import type { Fixture } from "@/lib/data/fixtures";
import type { JournalBet } from "@/lib/store";

function sideOf(bet: JournalBet): string {
  if (bet.side) return bet.side;
  const sel = bet.selection.toLowerCase();
  if (bet.market.toLowerCase() === "totals") return sel.includes("under") ? "under" : "over";
  if (bet.market.toLowerCase() === "btts") return sel.includes("no") ? "no" : "yes";
  if (sel.includes("draw")) return "draw";
  const home = bet.matchLabel.split(/\s+v\s+/i)[0]?.trim().toLowerCase() || "";
  if (home && sel.includes(home.toLowerCase())) return "home";
  return "away";
}

function closingPrice(bet: JournalBet, fx: Fixture): number | undefined {
  const side = sideOf(bet);
  if (side === "home") return fx.book1x2.home > 1.01 ? fx.book1x2.home : undefined;
  if (side === "draw") return fx.book1x2.draw > 1.01 ? fx.book1x2.draw : undefined;
  if (side === "away") return fx.book1x2.away > 1.01 ? fx.book1x2.away : undefined;
  if (side === "over") return fx.bookTotals.over25 > 1.01 ? fx.bookTotals.over25 : undefined;
  if (side === "under") return fx.bookTotals.under25 > 1.01 ? fx.bookTotals.under25 : undefined;
  if (side === "yes") return fx.bookTotals.bttsYes > 1.01 ? fx.bookTotals.bttsYes : undefined;
  if (side === "no") return fx.bookTotals.bttsNo > 1.01 ? fx.bookTotals.bttsNo : undefined;
  return undefined;
}

function won(bet: JournalBet, fx: Fixture): boolean | null {
  if (!fx.score) return null;
  const side = sideOf(bet);
  const hg = fx.score.home;
  const ag = fx.score.away;
  if (side === "home") return hg > ag;
  if (side === "away") return ag > hg;
  if (side === "draw") return hg === ag;
  const line = fx.overLine ?? 2.5;
  if (side === "over") return hg + ag > line;
  if (side === "under") return hg + ag < line;
  if (side === "yes") return hg > 0 && ag > 0;
  if (side === "no") return hg === 0 || ag === 0;
  return null;
}

function matchFixture(bet: JournalBet, fixtures: Fixture[]): Fixture | undefined {
  if (!bet.fixtureId) return undefined;
  return fixtures.find((f) => f.id === bet.fixtureId);
}

export function settlementPatch(
  bet: JournalBet,
  fixtures: Fixture[],
): Partial<JournalBet> | null {
  const fx = matchFixture(bet, fixtures);
  if (!fx || fx.status !== "post" || !fx.score) return null;
  const hit = won(bet, fx);
  if (hit == null) return null;
  const close = closingPrice(bet, fx);
  const result = hit ? "win" : "loss";
  const patch: Partial<JournalBet> = {};
  if (bet.result === "open") {
    patch.result = result;
    patch.autoSettled = true;
  }
  if (close && !bet.closingOdds) patch.closingOdds = Math.round(close * 100) / 100;
  if (Object.keys(patch).length === 0) return null;
  return patch;
}
