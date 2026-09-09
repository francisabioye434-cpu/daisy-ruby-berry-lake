import { i as __toESM } from "../_runtime.mjs";
import { n as cn } from "./utils-C6P-Cf7I.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/input-BPwjQzsl.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Input = import_react.forwardRef(({ className, type, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-11 w-full rounded-md bg-subtle px-3 text-sm text-fg tabular shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 placeholder:text-faint hover:shadow-[var(--shadow-border-hover)] focus-visible:outline-none focus-visible:shadow-[0_0_0_1px_var(--color-accent)] disabled:opacity-40", className),
		ref,
		...props
	});
});
Input.displayName = "Input";
//#endregion
export { Input as t };
