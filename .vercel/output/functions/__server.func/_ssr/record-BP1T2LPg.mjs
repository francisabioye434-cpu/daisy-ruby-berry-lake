import { c as formatPct, l as formatSignedPct, s as formatOdds } from "./utils-C6P-Cf7I.mjs";
import { b as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as Button } from "./router-DcSwOfsq.mjs";
import { n as Stat, t as Panel } from "./stat-rVv6e6iO.mjs";
import { t as Badge } from "./badge-BTMFsW3e.mjs";
import { n as useLedger, t as ledgerStats } from "./store-ledger-BjKkCpAJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/record-BP1T2LPg.js
var import_jsx_runtime = require_jsx_runtime();
function clv(t) {
	if (!t.closingOdds || t.closingOdds <= 1) return null;
	return t.odds / t.closingOdds - 1;
}
function exportCsv(tickets) {
	const header = "kickoff,league,match,call,selection,odds,close,modelP,ev,result,score";
	const rows = tickets.map((t) => [
		t.kickoffIso,
		t.league,
		t.matchLabel,
		t.word,
		t.selection,
		t.odds,
		t.closingOdds ?? "",
		t.modelP,
		t.ev,
		t.result,
		t.score ?? ""
	].join(","));
	const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "fairline-record.csv";
	a.click();
	URL.revokeObjectURL(url);
}
function RecordPage() {
	const tickets = useLedger((s) => s.tickets);
	const sitIds = useLedger((s) => s.sitIds);
	const stats = ledgerStats(tickets, sitIds.length);
	const ordered = [...tickets].sort((a, b) => (b.kickoffIso || "").localeCompare(a.kickoffIso || ""));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium uppercase tracking-[0.18em] text-muted",
						children: "Desk record"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-display text-4xl tracking-tight",
						children: "Score the process"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-xl text-sm leading-relaxed text-muted",
						children: "Every BET and LEAN is frozen before kickoff. Full time cannot rewrite it. Sit is a result, not a failure. Mean CLV is the number that says whether the process is real."
					})
				] }), tickets.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					size: "sm",
					onClick: () => exportCsv(tickets),
					children: "Export CSV"
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-4 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:grid-cols-4 sm:p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Sit rate",
						value: stats.sitRate != null ? formatPct(stats.sitRate, 0) : "—",
						hint: `${stats.sits} sits · ${stats.issued} tickets`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Hit rate",
						value: stats.hit != null ? formatPct(stats.hit, 0) : "—",
						hint: stats.settled ? `${stats.wins}–${stats.losses} settled` : "waiting on FT",
						tone: stats.hit == null ? "neutral" : stats.hit >= .5 ? "positive" : "negative"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Mean CLV",
						value: stats.meanClv != null ? formatSignedPct(stats.meanClv) : "—",
						hint: stats.clvN ? `${stats.beatClose}/${stats.clvN} beat close` : "closes stamp at FT"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Open tickets",
						value: `${stats.open}`,
						hint: "still pre"
					})
				]
			}),
			stats.settled < 12 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Thin sample. A weekend of HITs is noise. Trust this page after a few dozen settled tickets — and trust CLV before win rate."
			}) }) : null,
			ordered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No desk tickets yet. Leave the board open on a game week. BET and LEAN calls are written here automatically. Matches the desk sat are counted in sit rate, not as fake wins."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-4",
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					children: "Open the board"
				})
			})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-2",
				children: ordered.map((t) => {
					const c = clv(t);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm font-medium",
									children: [t.matchLabel, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "ml-2 text-muted",
										children: t.selection
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-0.5 text-xs text-faint",
									children: [
										t.league,
										t.kickoffIso ? ` · ${t.kickoffIso.slice(0, 16).replace("T", " ")}` : "",
										" ·",
										" ",
										t.word,
										" @ ",
										formatOdds(t.odds),
										t.score ? ` · FT ${t.score}` : ""
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: t.word === "BET" ? "positive" : "warn",
										children: t.word
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: t.result === "win" ? "positive" : t.result === "loss" ? "negative" : "neutral",
										children: t.result === "open" ? "open" : t.result
									}),
									c != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
										tone: c > 0 ? "positive" : "negative",
										children: [formatSignedPct(c), " CLV"]
									}) : null
								]
							})]
						})
					}, t.id);
				})
			})
		]
	});
}
//#endregion
export { RecordPage as component };
