//#region node_modules/.nitro/vite/services/ssr/assets/journal-learn-B2yLdh4z.js
function clvOf(bet) {
	if (!bet.closingOdds || bet.closingOdds <= 1 || bet.odds <= 1) return null;
	return bet.odds / bet.closingOdds - 1;
}
/**
* Learn from the blotter without chasing winners.
* Positive CLV → trust Dixon–Coles a bit more (less blend to the book).
* Negative CLV → listen to the close more. Wins with bad CLV are luck, not skill.
*/
function learnFromBets(bets) {
	const settled = bets.filter((b) => b.result === "win" || b.result === "loss");
	const wins = settled.filter((b) => b.result === "win").length;
	const losses = settled.filter((b) => b.result === "loss").length;
	const clvs = settled.map(clvOf).filter((x) => x != null);
	const meanClv = clvs.length ? clvs.reduce((a, b) => a + b, 0) / clvs.length : null;
	const beatClose = clvs.filter((x) => x > 0).length;
	const luckyWins = settled.filter((b) => b.result === "win" && (clvOf(b) ?? 0) < 0).length;
	const processHits = settled.filter((b) => b.result === "win" && (clvOf(b) ?? 1) > 0).length;
	const sits = bets.filter((b) => b.vote === "sit").length;
	const takes = bets.filter((b) => b.vote === "take").length;
	let blendDelta = 0;
	if (clvs.length >= 5 && meanClv != null) blendDelta = Math.max(-.12, Math.min(.15, -meanClv * 1.4));
	if (sits + takes >= 3) blendDelta += Math.max(-.08, Math.min(.08, (sits - takes) * .015));
	let note = "Mark take or sit on tickets. The desk learns from you, not from Grok.";
	if (clvs.length >= 5 && meanClv != null) {
		if (meanClv > .015) note = `Beating the close (${(meanClv * 100).toFixed(1)}% CLV). Model keeps more weight. ${processHits} wins also beat the close.`;
		else if (meanClv < -.015) note = `Losing to the close (${(meanClv * 100).toFixed(1)}% CLV). Desk leans more on the book. ${luckyWins} wins were lucky vs the close.`;
		else note = `CLV is flat. Keep the current blend. ${wins}–${losses} on paper.`;
	} else if (settled.length) note = `${wins} wins / ${losses} losses on paper. Need closing prices on ≥5 tickets before the blend moves.`;
	if (sits + takes >= 3) note += sits > takes ? ` You sit more than you take — desk gets tighter.` : ` You take more than you sit — desk stays willing.`;
	return {
		n: settled.length,
		wins,
		losses,
		meanClv,
		beatClose,
		blendDelta,
		note
	};
}
function effectiveBlend(studyW, delta) {
	return Math.max(.1, Math.min(.6, studyW + delta));
}
//#endregion
export { learnFromBets as n, effectiveBlend as t };
