import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BetResult = "open" | "win" | "loss" | "void";

export interface JournalBet {
  id: string;
  createdAt: number;
  fixtureId?: string;
  matchLabel: string;
  market: string;
  selection: string;
  side?: string;
  odds: number;
  modelP: number;
  stake: number;
  closingOdds?: number;
  result: BetResult;
  autoSettled?: boolean;
  vote?: "take" | "sit";
}

interface DeskState {
  bankroll: number;
  kellyFractionUsed: number;
  homeAdv: number;
  rho: number;
  bets: JournalBet[];
  alertsOn: boolean;
  alertLeans: boolean;
  oddsFormat: "decimal" | "american";
  setBankroll: (n: number) => void;
  setKellyFractionUsed: (n: number) => void;
  setHomeAdv: (n: number) => void;
  setRho: (n: number) => void;
  addBet: (bet: Omit<JournalBet, "id" | "createdAt" | "result">) => void;
  updateBet: (id: string, patch: Partial<JournalBet>) => void;
  removeBet: (id: string) => void;
  clearBets: () => void;
  setAlertsOn: (v: boolean) => void;
  setAlertLeans: (v: boolean) => void;
  setOddsFormat: (v: "decimal" | "american") => void;
  voteBet: (id: string, vote: "take" | "sit") => void;
}

export const useDesk = create<DeskState>()(
  persist(
    (set) => ({
      bankroll: 10_000,
      kellyFractionUsed: 0.25,
      homeAdv: 1.32,
      rho: -0.08,
      bets: [],
      alertsOn: false,
      alertLeans: true,
      oddsFormat: "decimal",
      setBankroll: (bankroll) => set({ bankroll }),
      setKellyFractionUsed: (kellyFractionUsed) => set({ kellyFractionUsed }),
      setHomeAdv: (homeAdv) => set({ homeAdv }),
      setRho: (rho) => set({ rho }),
      addBet: (bet) =>
        set((s) => {
          if (
            bet.fixtureId &&
            s.bets.some((b) => b.fixtureId === bet.fixtureId && b.side === bet.side && b.result === "open")
          ) {
            return s;
          }
          return {
            bets: [
              {
                ...bet,
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                createdAt: Date.now(),
                result: "open",
              },
              ...s.bets,
            ],
          };
        }),
      updateBet: (id, patch) =>
        set((s) => ({
          bets: s.bets.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),
      removeBet: (id) => set((s) => ({ bets: s.bets.filter((b) => b.id !== id) })),
      clearBets: () => set({ bets: [] }),
      setAlertsOn: (alertsOn) => set({ alertsOn }),
      setAlertLeans: (alertLeans) => set({ alertLeans }),
      setOddsFormat: (oddsFormat) => set({ oddsFormat }),
      voteBet: (id, vote) =>
        set((s) => ({
          bets: s.bets.map((b) => (b.id === id ? { ...b, vote } : b)),
        })),
    }),
    { name: "fairline-desk-v1" },
  ),
);
