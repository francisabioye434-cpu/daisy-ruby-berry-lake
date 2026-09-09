import { n as cn } from "./utils-C6P-Cf7I.mjs";
import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/badge-BTMFsW3e.js
var import_jsx_runtime = require_jsx_runtime();
function Badge({ className, tone = "neutral", children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular", tone === "neutral" && "bg-subtle text-muted", tone === "positive" && "bg-positive/15 text-positive", tone === "negative" && "bg-negative/15 text-negative", tone === "warn" && "bg-warn/15 text-warn", className),
		children
	});
}
//#endregion
export { Badge as t };
