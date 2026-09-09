import { n as cn } from "./utils-C6P-Cf7I.mjs";
import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/stat-rVv6e6iO.js
var import_jsx_runtime = require_jsx_runtime();
function Stat({ label, value, hint, tone = "neutral" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] font-medium uppercase tracking-wider text-faint",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: cn("mt-1 truncate font-mono text-lg leading-none tabular sm:text-2xl", tone === "positive" && "text-positive", tone === "negative" && "text-negative"),
				children: value
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1.5 text-xs text-muted",
				children: hint
			}) : null
		]
	});
}
function Panel({ children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: cn("rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5", className),
		children
	});
}
//#endregion
export { Stat as n, Panel as t };
