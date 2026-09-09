import { useEffect } from "react";
import type { PricedFixture } from "@/lib/data/fixtures";
import { alreadyAlerted, briefSentToday, markAlerted, markBriefSent, pushNotice } from "@/lib/alerts";
import { bestCall, scoreTicket } from "@/lib/math/call";
import { fractionalKelly } from "@/lib/math/kelly";
import { actual1x2, scoreline } from "@/lib/math/grade";
import { useDesk } from "@/lib/store";
import { useLedger } from "@/lib/store-ledger";

function closeFor(row: PricedFixture, side: string): number | undefined {
  const b = row.fixture.book1x2;
  if (side === "home" && b.home > 1.01) return b.home;
  if (side === "draw" && b.draw > 1.01) return b.draw;
  if (side === "away" && b.away > 1.01) return b.away;
  return undefined;
}

function meta(row: PricedFixture, sel: PricedFixture["selections"][number]) {
  return {
    market: sel.market,
    source: row.fixture.bookSource,
    sideRisk: sel.sideRisk,
    factsNote: row.factsNotes[0],
    profile: row.fixture.profile,
    side: sel.selection,
  };
}

function alertOnce(id: string, title: string, body: string) {
  if (alreadyAlerted(id)) return;
  markAlerted(id);
  pushNotice(title, body, id);
}

/** Snapshot BET while pre. Alert BET + LEAN once per day. Last look is the close. */
export function useDeskLedger(live: PricedFixture[], finished: PricedFixture[], kellyF: number) {
  const syncLive = useLedger((s) => s.syncLive);
  const settle = useLedger((s) => s.settle);
  const addBet = useDesk((s) => s.addBet);
  const bankroll = useDesk((s) => s.bankroll);
  const alertsOn = useDesk((s) => s.alertsOn);
  const alertLeans = useDesk((s) => s.alertLeans);
  const liveKey = live.map((r) => `${r.fixture.id}:${r.fixture.book1x2.home}`).join("|");
  const doneKey = finished.map((r) => `${r.fixture.id}:${r.fixture.score?.home}-${r.fixture.score?.away}`).join("|");

  useEffect(() => {
    const calls: Parameters<typeof syncLive>[0] = [];
    const sits: string[] = [];
    const possibles: { id: string; word: "BET" | "LEAN"; label: string; ev: number }[] = [];

    for (const row of live) {
      if (row.fixture.status !== "pre") continue;
      const tickets = row.selections
        .filter((sel) => sel.market === "1x2")
        .map((sel) => ({
          ...scoreTicket(sel.label, sel.modelP, sel.odds, kellyF, meta(row, sel)),
          side: sel.selection,
        }));
      const call = bestCall(tickets);
      const label = `${row.home.short} v ${row.away.short} · ${call.selection}`;
      if (call.action === "pass") {
        sits.push(row.fixture.id);
        continue;
      }
      possibles.push({
        id: `${row.fixture.id}:${call.selection}`,
        word: call.action === "bet" ? "BET" : "LEAN",
        label,
        ev: call.ev,
      });
      if (call.action !== "bet") continue;
      const side = tickets.find((t) => t.selection === call.selection)?.side || "";
      calls.push({
        fixtureId: row.fixture.id,
        matchLabel: `${row.home.short} v ${row.away.short}`,
        league: row.fixture.leagueAbbr || row.fixture.leagueName || "",
        kickoffIso: row.fixture.kickoffIso || "",
        selection: call.selection,
        side,
        market: "1x2",
        word: "BET",
        odds: call.odds,
        modelP: call.modelP,
        ev: call.ev,
      });
      addBet({
        fixtureId: row.fixture.id,
        matchLabel: `${row.home.short} v ${row.away.short}`,
        market: "1X2",
        selection: call.selection,
        side,
        odds: call.odds,
        modelP: call.modelP,
        stake: Math.round(bankroll * fractionalKelly(call.modelP, call.odds, kellyF) * 100) / 100,
      });
    }
    syncLive(calls, sits);

    if (!alertsOn || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const bets = possibles.filter((p) => p.word === "BET");
    const leans = possibles.filter((p) => p.word === "LEAN");
    if (!briefSentToday() && possibles.length) {
      pushNotice(
        "Fairline today",
        `${bets.length} BET · ${leans.length} possible · sit the rest`,
        "fairline-brief",
      );
      markBriefSent();
    }
    for (const p of bets) {
      alertOnce(p.id, "Fairline BET", `${p.label} · EV ${(p.ev * 100).toFixed(1)}%`);
    }
    if (alertLeans) {
      for (const p of leans.slice(0, 6)) {
        alertOnce(p.id, "Fairline possible", `${p.label} · LEAN ${(p.ev * 100).toFixed(1)}%`);
      }
    }
  }, [liveKey, kellyF, syncLive, live, addBet, bankroll, alertsOn, alertLeans]);

  useEffect(() => {
    const desk = useDesk.getState();
    for (const row of finished) {
      if (row.fixture.status !== "post" || !row.fixture.score) continue;
      const actual = actual1x2(row.fixture.score);
      const open = useLedger.getState().tickets.filter((t) => t.fixtureId === row.fixture.id && t.result === "open");
      for (const t of open) {
        const close = t.closingOdds || closeFor(row, t.side) || t.odds;
        const won = t.side === actual;
        settle(row.fixture.id, won ? "win" : "loss", scoreline(row.fixture.score), close);
        for (const b of desk.bets) {
          if (b.fixtureId === row.fixture.id && b.result === "open") {
            desk.updateBet(b.id, {
              result: b.side && b.side !== t.side ? b.result : won ? "win" : "loss",
              closingOdds: close,
              autoSettled: true,
            });
          }
        }
      }
    }
  }, [doneKey, finished, settle]);
}
