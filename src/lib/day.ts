/** Calendar helpers. Days are Africa/Lagos so the desk matches West Africa kickoff days. */

const TZ = "Africa/Lagos";

export function dayKey(iso?: string, from = new Date()): string {
  const d = iso ? new Date(iso) : from;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

export function todayKey(): string {
  return dayKey(undefined, new Date());
}

export function shiftDay(key: string, delta: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

export function kickoffHm(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

export function dayLabel(key: string, today = todayKey()): string {
  if (key === today) return "Today";
  if (key === shiftDay(today, -1)) return "Yesterday";
  if (key === shiftDay(today, 1)) return "Tomorrow";
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
}

export function dayHeading(key: string, today = todayKey()): string {
  if (key === today) return "Today";
  if (key === shiftDay(today, -1)) return "Yesterday";
  if (key === shiftDay(today, 1)) return "Tomorrow";
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return dt.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}

/** Yesterday through six days ahead — a week of desk days. */
export function weekStrip(today = todayKey()): string[] {
  return Array.from({ length: 8 }, (_, i) => shiftDay(today, i - 1));
}
