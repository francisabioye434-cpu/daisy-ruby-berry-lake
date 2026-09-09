//#region node_modules/.nitro/vite/services/ssr/assets/kelly-WQ0YQtcf.js
/**
* Kelly fraction of bankroll for a binary bet at decimal odds.
* f* = (b p − q) / b,  b = d − 1,  q = 1 − p
* Negative means no bet.
*/
function kellyFraction(p, decimalOdds) {
	const b = decimalOdds - 1;
	if (!Number.isFinite(p) || !Number.isFinite(b) || b <= 0) return 0;
	const q = 1 - p;
	return (b * p - q) / b;
}
function fractionalKelly(p, decimalOdds, fraction = .5) {
	return Math.max(0, kellyFraction(p, decimalOdds) * fraction);
}
//#endregion
export { kellyFraction as n, fractionalKelly as t };
