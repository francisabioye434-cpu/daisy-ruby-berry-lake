import { n as cn } from "./utils-C6P-Cf7I.mjs";
import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/day-strip-DcHs97Pj.js
var import_jsx_runtime = require_jsx_runtime();
/** Calendar helpers. Days are Africa/Lagos so the desk matches West Africa kickoff days. */
var TZ = "Africa/Lagos";
function dayKey(iso, from = /* @__PURE__ */ new Date()) {
	const d = iso ? new Date(iso) : from;
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleDateString("en-CA", { timeZone: TZ });
}
function todayKey() {
	return dayKey(void 0, /* @__PURE__ */ new Date());
}
function shiftDay(key, delta) {
	const [y, m, d] = key.split("-").map(Number);
	const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
	dt.setUTCDate(dt.getUTCDate() + delta);
	return dt.toISOString().slice(0, 10);
}
function kickoffHm(iso) {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleTimeString("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
		timeZone: TZ
	});
}
function dayLabel(key, today = todayKey()) {
	if (key === today) return "Today";
	if (key === shiftDay(today, -1)) return "Yesterday";
	if (key === shiftDay(today, 1)) return "Tomorrow";
	const [y, m, d] = key.split("-").map(Number);
	return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString("en-GB", {
		weekday: "short",
		day: "numeric"
	});
}
function dayHeading(key, today = todayKey()) {
	if (key === today) return "Today";
	if (key === shiftDay(today, -1)) return "Yesterday";
	if (key === shiftDay(today, 1)) return "Tomorrow";
	const [y, m, d] = key.split("-").map(Number);
	return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString("en-GB", {
		weekday: "long",
		day: "numeric",
		month: "short"
	});
}
/** Yesterday through six days ahead — a week of desk days. */
function weekStrip(today = todayKey()) {
	return Array.from({ length: 8 }, (_, i) => shiftDay(today, i - 1));
}
function Chip({ active, onClick, children, tone = "accent" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: cn("h-11 shrink-0 rounded-full px-4 text-sm transition-colors duration-150", active && tone === "accent" && "bg-accent text-accent-fg", active && tone === "subtle" && "bg-subtle text-fg shadow-[var(--shadow-border)]", !active && "bg-surface text-muted hover:text-fg"),
		children
	});
}
function DayStrip({ days, value, today, counts, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
		children: days.map((d) => {
			const n = counts[d] || 0;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Chip, {
				active: value === d,
				onClick: () => onChange(d),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "tabular",
					children: dayLabel(d, today)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("ml-1.5 tabular", value === d ? "opacity-70" : "text-faint"),
					children: n
				})]
			}, d);
		})
	});
}
//#endregion
export { dayLabel as a, weekStrip as c, dayKey as i, DayStrip as n, kickoffHm as o, dayHeading as r, todayKey as s, Chip as t };
