import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as enableAlerts, f as Button } from "./router-DcSwOfsq.mjs";
import { t as Input } from "./input-BPwjQzsl.mjs";
import { t as Label } from "./label-CHikME_b.mjs";
import { t as Panel } from "./stat-rVv6e6iO.mjs";
import { t as useDesk } from "./store-DN5jHrat.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-g4tnslXa.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function isStandalone() {
	if (typeof window === "undefined") return false;
	const mq = window.matchMedia("(display-mode: standalone)").matches;
	const ios = "standalone" in window.navigator && Boolean(window.navigator.standalone);
	return mq || ios;
}
function SettingsPage() {
	const desk = useDesk();
	const [alertMsg, setAlertMsg] = (0, import_react.useState)("");
	const standalone = typeof window !== "undefined" && isStandalone();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium uppercase tracking-[0.18em] text-muted",
					children: "Desk"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl tracking-tight",
					children: "Settings"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-xl text-sm leading-relaxed text-muted",
					children: "Fairline runs in this browser. Bankroll, journal, votes and alerts live on your device — not in the Grok chat. Install it to the home screen and you can close the chat."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl tracking-tight",
						children: "Standalone"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: standalone ? "This copy is on your home screen. Opening the icon loads a live slate without Grok." : "You are inside a browser tab (or the Grok preview). Install to keep the desk after you leave the chat."
					}),
					!standalone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => {
							window.location.href = "/?install=1";
						},
						children: "Install to home screen"
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl tracking-tight",
						children: "Alerts"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "One daily brief when a BET or LEAN appears. Sit stays silent."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: desk.alertsOn ? "default" : "outline",
							onClick: () => {
								enableAlerts().then((ok) => {
									desk.setAlertsOn(ok);
									setAlertMsg(ok ? "Alerts on for this device." : "Permission blocked — enable notifications in the browser.");
								});
							},
							children: desk.alertsOn ? "Alerts on" : "Enable alerts"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: desk.alertLeans ? "default" : "outline",
							onClick: () => desk.setAlertLeans(!desk.alertLeans),
							children: desk.alertLeans ? "LEAN alerts on" : "LEAN alerts off"
						})]
					}),
					alertMsg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-faint",
						children: alertMsg
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl tracking-tight",
					children: "Bankroll & stake"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "bank",
							children: "Bankroll"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "bank",
							type: "number",
							min: 100,
							value: desk.bankroll,
							onChange: (e) => desk.setBankroll(Number(e.target.value) || 0)
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "kelly",
								children: "Kelly fraction"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "kelly",
								type: "number",
								step: .05,
								min: .05,
								max: 1,
								value: desk.kellyFractionUsed,
								onChange: (e) => desk.setKellyFractionUsed(Number(e.target.value) || .25)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-faint",
								children: "Quarter Kelly (0.25) is the desk default. Full Kelly ruins bankrolls."
							})
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl tracking-tight",
					children: "Odds format"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: desk.oddsFormat === "decimal" ? "default" : "outline",
						onClick: () => desk.setOddsFormat("decimal"),
						children: "Decimal"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: desk.oddsFormat === "american" ? "default" : "outline",
						onClick: () => desk.setOddsFormat("american"),
						children: "American"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs leading-relaxed text-faint",
				children: "Educational model, not a bookmaker. Prices can be wrong. BET is a process call, not a promise. Never stake money you cannot lose."
			})
		]
	});
}
//#endregion
export { SettingsPage as component };
