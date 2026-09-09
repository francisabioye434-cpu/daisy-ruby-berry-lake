import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/store-ledger-BjKkCpAJ.js
var MAX = 400;
var useLedger = create()(persist((set, get) => ({
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
				const next = {
					...t,
					id,
					capturedAt: prev?.capturedAt ?? Date.now(),
					locked: false,
					result: "open",
					closingOdds: t.odds
				};
				if (prev && prev.odds === next.odds && prev.modelP === next.modelP && prev.word === next.word && prev.ev === next.ev && prev.closingOdds === next.closingOdds) continue;
				tickets = [next, ...tickets.filter((x) => x.id !== id)].slice(0, MAX);
				changed = true;
			}
			const extra = sitIds.filter((id) => !sits.includes(id));
			if (extra.length) {
				sits = [...extra, ...sits].slice(0, 2e3);
				changed = true;
			}
			return changed ? {
				tickets,
				sitIds: sits
			} : s;
		});
	},
	settle: (fixtureId, result, score, close) => {
		set((s) => {
			if (!s.tickets.some((t) => t.fixtureId === fixtureId && t.result === "open")) return s;
			return { tickets: s.tickets.map((t) => {
				if (t.fixtureId !== fixtureId || t.result !== "open") return t;
				return {
					...t,
					locked: true,
					result,
					score,
					closingOdds: close && close > 1 ? close : t.closingOdds ?? t.odds
				};
			}) };
		});
	},
	markSit: (fixtureId) => {
		if (get().sitIds.includes(fixtureId)) return;
		set((s) => ({ sitIds: [fixtureId, ...s.sitIds].slice(0, 2e3) }));
	},
	dismissIntro: () => set({ introDone: true })
}), { name: "fairline-ledger-v1" }));
function ledgerStats(tickets, sitN) {
	const settled = tickets.filter((t) => t.result === "win" || t.result === "loss");
	const wins = settled.filter((t) => t.result === "win").length;
	const clvs = settled.map((t) => t.closingOdds && t.closingOdds > 1 ? t.odds / t.closingOdds - 1 : null).filter((x) => x != null);
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
		sitRate: denom ? sitN / denom : null
	};
}
//#endregion
export { useLedger as n, ledgerStats as t };
