//#region node_modules/.nitro/vite/services/ssr/assets/devig-yQ-VDeWP.js
/**
* Remove the bookmaker margin from a mutually exclusive market.
* Multiplicative (proportional) is the standard teaching method:
* fair_i = implied_i / sum(implied).
* Additive subtracts the overround equally — can go negative on longshots,
* so we floor at 0 and renormalize.
*/
function devig(odds, method = "multiplicative") {
	const implied = odds.map((o) => o > 1 ? 1 / o : 0);
	const sum = implied.reduce((a, b) => a + b, 0);
	const overround = sum - 1;
	let fair;
	if (method === "additive") {
		const n = implied.length || 1;
		fair = implied.map((p) => p - overround / n);
		const floor = fair.map((p) => Math.max(0, p));
		const s = floor.reduce((a, b) => a + b, 0);
		fair = s > 0 ? floor.map((p) => p / s) : floor;
	} else fair = sum > 0 ? implied.map((p) => p / sum) : implied;
	return {
		fair,
		implied,
		overround,
		method
	};
}
function overround(odds) {
	return odds.reduce((s, o) => s + (o > 1 ? 1 / o : 0), 0) - 1;
}
//#endregion
export { overround as n, devig as t };
