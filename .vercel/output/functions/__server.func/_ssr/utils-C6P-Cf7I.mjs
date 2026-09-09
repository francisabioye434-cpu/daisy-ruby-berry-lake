import { n as clsx } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/utils-C6P-Cf7I.js
/** Convert decimal odds to implied probability (with vig still in). */
function impliedProb(decimalOdds) {
	if (!Number.isFinite(decimalOdds) || decimalOdds <= 1) return 0;
	return 1 / decimalOdds;
}
/** Fair decimal odds from a true probability. */
function fairOdds(p) {
	if (!Number.isFinite(p) || p <= 0) return Infinity;
	if (p >= 1) return 1;
	return 1 / p;
}
/**
* Expected value per 1 unit staked.
* EV = p * d - 1
*/
function expectedValue(p, decimalOdds) {
	if (!Number.isFinite(p) || !Number.isFinite(decimalOdds)) return 0;
	return p * decimalOdds - 1;
}
function americanFromDecimal(d) {
	if (!Number.isFinite(d) || d <= 1) return "—";
	if (d >= 2) return `+${Math.round((d - 1) * 100)}`;
	return `${Math.round(-100 / (d - 1))}`;
}
/** Decimal odds from American, e.g. +235 → 3.35, −160 → 1.625. */
function decimalFromAmerican(raw) {
	if (raw == null) return NaN;
	const n = typeof raw === "number" ? raw : Number(String(raw).replace("+", "").trim());
	if (!Number.isFinite(n) || n === 0) return NaN;
	return n > 0 ? 1 + n / 100 : 1 + 100 / Math.abs(n);
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function formatOdds(n, digits = 2, format = "decimal") {
	if (!Number.isFinite(n) || n <= 1) return "—";
	if (format === "american") return americanFromDecimal(n);
	return n.toFixed(digits);
}
function formatPct(n, digits = 1) {
	if (!Number.isFinite(n)) return "—";
	return `${(n * 100).toFixed(digits)}%`;
}
function formatSignedPct(n, digits = 1) {
	if (!Number.isFinite(n)) return "—";
	const pct = n * 100;
	return `${pct > 0 ? "+" : ""}${pct.toFixed(digits)}%`;
}
function formatUnits(n, digits = 0) {
	if (!Number.isFinite(n)) return "—";
	return n.toLocaleString(void 0, {
		maximumFractionDigits: digits,
		minimumFractionDigits: digits
	});
}
function clamp(n, min, max) {
	return Math.min(max, Math.max(min, n));
}
function hueFromId(id) {
	let h = 0;
	for (let i = 0; i < id.length; i++) h = h * 31 + id.charCodeAt(i) >>> 0;
	return h % 360;
}
function formatKickoff(iso, fallback = "") {
	if (!iso) return fallback;
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return fallback || iso;
	return d.toLocaleString("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
		timeZone: "Africa/Lagos"
	}) + " WAT";
}
//#endregion
export { fairOdds as a, formatPct as c, hueFromId as d, impliedProb as f, expectedValue as i, formatSignedPct as l, cn as n, formatKickoff as o, decimalFromAmerican as r, formatOdds as s, clamp as t, formatUnits as u };
