export interface Matchweek {
  week: number;
  start: string;
  end: string;
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * ESPN soccer calendars are match dates, not numbered rounds.
 * Cluster dates separated by more than 3 days into matchweeks.
 */
export function clusterMatchweeks(calendar: string[]): Matchweek[] {
  const days = [...new Set(calendar.map(dayKey).filter((d) => d.length === 10))].sort();
  if (days.length === 0) return [];
  const groups: string[][] = [];
  let cur: string[] = [];
  for (const d of days) {
    if (cur.length === 0) {
      cur = [d];
      continue;
    }
    const prev = Date.parse(`${cur[cur.length - 1]}T12:00:00Z`);
    const next = Date.parse(`${d}T12:00:00Z`);
    const gap = (next - prev) / 86_400_000;
    if (gap <= 3.25) cur.push(d);
    else {
      groups.push(cur);
      cur = [d];
    }
  }
  if (cur.length) groups.push(cur);
  return groups.map((dates, i) => ({
    week: i + 1,
    start: dates[0]!,
    end: dates[dates.length - 1]!,
  }));
}

export function weekForDate(weeks: Matchweek[], iso: string): Matchweek | undefined {
  const day = dayKey(iso);
  if (!day) return undefined;
  return weeks.find((w) => day >= w.start && day <= w.end);
}

/** First week that still has a day today-or-later. If `hasUpcoming` is passed, skip spent rounds. */
export function currentMatchweek(
  weeks: Matchweek[],
  now = new Date(),
  hasUpcoming?: (week: Matchweek) => boolean,
): Matchweek | undefined {
  if (weeks.length === 0) return undefined;
  const today = now.toISOString().slice(0, 10);
  const start = weeks.findIndex((w) => w.end >= today);
  const from = start < 0 ? weeks.length - 1 : start;
  for (let i = from; i < weeks.length; i++) {
    const w = weeks[i]!;
    if (!hasUpcoming || hasUpcoming(w)) return w;
  }
  return weeks[from];
}

export function weekLabel(week?: number): string {
  if (!week || week < 1) return "—";
  return `MW ${week}`;
}
