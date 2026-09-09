import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/store-DN5jHrat.js
var useDesk = create()(persist((set) => ({
	bankroll: 1e4,
	kellyFractionUsed: .25,
	homeAdv: 1.32,
	rho: -.08,
	bets: [],
	alertsOn: false,
	alertLeans: true,
	oddsFormat: "decimal",
	setBankroll: (bankroll) => set({ bankroll }),
	setKellyFractionUsed: (kellyFractionUsed) => set({ kellyFractionUsed }),
	setHomeAdv: (homeAdv) => set({ homeAdv }),
	setRho: (rho) => set({ rho }),
	addBet: (bet) => set((s) => {
		if (bet.fixtureId && s.bets.some((b) => b.fixtureId === bet.fixtureId && b.side === bet.side && b.result === "open")) return s;
		return { bets: [{
			...bet,
			id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
			createdAt: Date.now(),
			result: "open"
		}, ...s.bets] };
	}),
	updateBet: (id, patch) => set((s) => ({ bets: s.bets.map((b) => b.id === id ? {
		...b,
		...patch
	} : b) })),
	removeBet: (id) => set((s) => ({ bets: s.bets.filter((b) => b.id !== id) })),
	clearBets: () => set({ bets: [] }),
	setAlertsOn: (alertsOn) => set({ alertsOn }),
	setAlertLeans: (alertLeans) => set({ alertLeans }),
	setOddsFormat: (oddsFormat) => set({ oddsFormat }),
	voteBet: (id, vote) => set((s) => ({ bets: s.bets.map((b) => b.id === id ? {
		...b,
		vote
	} : b) }))
}), { name: "fairline-desk-v1" }));
//#endregion
export { useDesk as t };
