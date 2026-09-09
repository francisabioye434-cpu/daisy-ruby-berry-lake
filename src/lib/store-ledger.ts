import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BetResult } from "./store";

export interface DeskTicket {
  id: string;
  fixtureId: string;
  matchLabel: string;
  league: string;
  kickoffIso: string;
  selection: string;
  side: string;
  market: string;
  word: "BET" | "LEAN";
  odds: number;
  modelP: number;
  ev: number;
  capturedAt: number;
  locked: boolean;
  closingOdds?: number;
  result: BetResult;
  score?: string;
}

interface LedgerState {
  tickets: DeskTicket[];
  sitIds: string[];
  introDone: boolean;
  upsertLive: (t: Omit<DeskTicket, "id" | "capturedAt" | "locked" | "result">) => void;
  syncLive: (
    live: Omit<DeskTicket, "id" | "capturedAt" | "locked" | "result">[],
    sitIds: string[],
  ) => void;
  settle: (fixtureId: string, result: BetResult, score: string, close?: number) => void;
  markSit: (fixtureId: string) => void;
  dismissIntro: () => void;
}

const MAX = 400;

export const useLedger = create<LedgerState>()(
  persist(
    (set, get) => ({
      tickets: [],
      sitIds: [],
      introDone: false,
      upsertLive: (t) => {
        get().syncLive([t], []);
      },
      syncLive: (live, sitIds) => {
        set((s) => {
          let tickets = s.tickets;
          let sits = s.sitIds;
          let changed = false;
          for (const t of live) {
            const id = `${t.fixtureId}:${t.market}:${t.side}`;
            const prev = tickets.find((x) => x.id === id);
            if (prev?.locked) continue;
            const next: DeskTicket = {
              ...t,
              id,
              capturedAt: prev?.capturedAt ?? Date.now(),
              locked: false,
              result: "open",
              closingOdds: t.odds,
            };
            const same =
              prev &&
              prev.odds === next.odds &&
              prev.modelP === next.modelP &&
              prev.word === next.word &&
              prev.ev === next.ev &&
              prev.closingOdds === next.closingOdds;
            if (same) continue;
            tickets = [next, ...tickets.filter((x) => x.id !== id)].slice(0, MAX);
            changed = true;
          }
          const extra = sitIds.filter((id) => !sits.includes(id));
          if (extra.length) {
            sits = [...extra, ...sits].slice(0, 2000);
            changed = true;
          }
          return changed ? { tickets, sitIds: sits } : s;
        });
      },
      settle: (fixtureId, result, score, close) => {
        set((s) => {
          if (!s.tickets.some((t) => t.fixtureId === fixtureId && t.result === "open")) return s;
          return {
            tickets: s.tickets.map((t) => {
              if (t.fixtureId !== fixtureId || t.result !== "open") return t;
              return {
                ...t,
                locked: true,
                result,
                score,
                closingOdds: close && close > 1 ? close : t.closingOdds ?? t.odds,
              };
            }),
          };
        });
      },
      markSit: (fixtureId) => {
        if (get().sitIds.includes(fixtureId)) return;
        set((s) => ({ sitIds: [fixtureId, ...s.sitIds].slice(0, 2000) }));
      },
      dismissIntro: () => set({ introDone: true }),
    }),
    { name: "fairline-ledger-v1" },
  ),
);

export function ledgerStats(tickets: DeskTicket[], sitN: number) {
  const settled = tickets.filter((t) => t.result === "win" || t.result === "loss");
  const wins = settled.filter((t) => t.result === "win").length;
  const clvs = settled
    .map((t) => (t.closingOdds && t.closingOdds > 1 ? t.odds / t.closingOdds - 1 : null))
    .filter((x): x is number => x != null);
  const meanClv = clvs.length ? clvs.reduce((a, b) => a + b, 0) / clvs.length : null;
  const issued = tickets.length;
  const denom = sitN + issued;
  return {
    issued,
    open: tickets.filter((t) => t.result === "open").length,
    settled: settled.length,
    wins,
    losses: settled.length - wins,
    hit: settled.length ? wins / settled.length : null,
    meanClv,
    beatClose: clvs.filter((x) => x > 0).length,
    clvN: clvs.length,
    sits: sitN,
    sitRate: denom ? sitN / denom : null,
  };
}
