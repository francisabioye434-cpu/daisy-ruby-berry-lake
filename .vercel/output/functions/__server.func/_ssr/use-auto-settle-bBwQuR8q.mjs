import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { t as useDesk } from "./store-DN5jHrat.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-auto-settle-bBwQuR8q.js
var import_react = /* @__PURE__ */ __toESM(require_react());
function sideOf(bet) {
	if (bet.side) return bet.side;
	const sel = bet.selection.toLowerCase();
	if (bet.market.toLowerCase() === "totals") return sel.includes("under") ? "under" : "over";
	if (bet.market.toLowerCase() === "btts") return sel.includes("no") ? "no" : "yes";
	if (sel.includes("draw")) return "draw";
	const home = bet.matchLabel.split(/\s+v\s+/i)[0]?.trim().toLowerCase() || "";
	if (home && sel.includes(home.toLowerCase())) return "home";
	return "away";
}
function closingPrice(bet, fx) {
	const side = sideOf(bet);
	if (side === "home") return fx.book1x2.home > 1.01 ? fx.book1x2.home : void 0;
	if (side === "draw") return fx.book1x2.draw > 1.01 ? fx.book1x2.draw : void 0;
	if (side === "away") return fx.book1x2.away > 1.01 ? fx.book1x2.away : void 0;
	if (side === "over") return fx.bookTotals.over25 > 1.01 ? fx.bookTotals.over25 : void 0;
	if (side === "under") return fx.bookTotals.under25 > 1.01 ? fx.bookTotals.under25 : void 0;
	if (side === "yes") return fx.bookTotals.bttsYes > 1.01 ? fx.bookTotals.bttsYes : void 0;
	if (side === "no") return fx.bookTotals.bttsNo > 1.01 ? fx.bookTotals.bttsNo : void 0;
}
function won(bet, fx) {
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
function matchFixture(bet, fixtures) {
	if (!bet.fixtureId) return void 0;
	return fixtures.find((f) => f.id === bet.fixtureId);
}
function settlementPatch(bet, fixtures) {
	const fx = matchFixture(bet, fixtures);
	if (!fx || fx.status !== "post" || !fx.score) return null;
	const hit = won(bet, fx);
	if (hit == null) return null;
	const close = closingPrice(bet, fx);
	const result = hit ? "win" : "loss";
	const patch = {};
	if (bet.result === "open") {
		patch.result = result;
		patch.autoSettled = true;
	}
	if (close && !bet.closingOdds) patch.closingOdds = Math.round(close * 100) / 100;
	if (Object.keys(patch).length === 0) return null;
	return patch;
}
/** When a logged match goes FT, mark win/loss and stamp the close if the book still has a number. */
function useAutoSettle(fixtures) {
	const bets = useDesk((s) => s.bets);
	const updateBet = useDesk((s) => s.updateBet);
	(0, import_react.useEffect)(() => {
		if (!fixtures?.length) return;
		for (const bet of bets) {
			const patch = settlementPatch(bet, fixtures);
			if (patch) updateBet(bet.id, patch);
		}
	}, [
		fixtures,
		bets,
		updateBet
	]);
}
//#endregion
export { useAutoSettle as t };
