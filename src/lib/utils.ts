import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { americanFromDecimal } from "@/lib/math/odds";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatOdds(n: number, digits = 2, format: "decimal" | "american" = "decimal"): string {
  if (!Number.isFinite(n) || n <= 1) return "—";
  if (format === "american") return americanFromDecimal(n);
  return n.toFixed(digits);
}

export function formatPct(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(digits)}%`;
}

export function formatSignedPct(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  const pct = n * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(digits)}%`;
}

export function formatUnits(n: number, digits = 0): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function hueFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 360;
}

export function formatKickoff(iso: string, fallback = ""): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback || iso;
  return (
    d.toLocaleString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Lagos",
    }) + " WAT"
  );
}
