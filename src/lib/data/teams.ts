export interface Team {
  id: string;
  name: string;
  short: string;
  /** Attack vs average defence, neutral venue. League mean ≈ 1.25. */
  attack: number;
  /** Opponent attack multiplier. Lower is stronger. Mean ≈ 1.00. */
  defense: number;
  /** 0–360 hue for a quiet crest tint. */
  hue: number;
}

export const TEAMS: Team[] = [
  { id: "mci", name: "Manchester City", short: "MCI", attack: 2.12, defense: 0.72, hue: 196 },
  { id: "ars", name: "Arsenal", short: "ARS", attack: 2.02, defense: 0.74, hue: 358 },
  { id: "liv", name: "Liverpool", short: "LIV", attack: 1.98, defense: 0.78, hue: 352 },
  { id: "che", name: "Chelsea", short: "CHE", attack: 1.76, defense: 0.86, hue: 214 },
  { id: "tot", name: "Tottenham", short: "TOT", attack: 1.68, defense: 0.94, hue: 220 },
  { id: "new", name: "Newcastle", short: "NEW", attack: 1.62, defense: 0.88, hue: 0 },
  { id: "avl", name: "Aston Villa", short: "AVL", attack: 1.58, defense: 0.9, hue: 168 },
  { id: "bha", name: "Brighton", short: "BHA", attack: 1.52, defense: 0.96, hue: 210 },
  { id: "mun", name: "Manchester United", short: "MUN", attack: 1.48, defense: 0.98, hue: 356 },
  { id: "ful", name: "Fulham", short: "FUL", attack: 1.36, defense: 1.02, hue: 220 },
  { id: "whu", name: "West Ham", short: "WHU", attack: 1.28, defense: 1.08, hue: 14 },
  { id: "cry", name: "Crystal Palace", short: "CRY", attack: 1.3, defense: 0.97, hue: 250 },
  { id: "eve", name: "Everton", short: "EVE", attack: 1.18, defense: 0.95, hue: 214 },
  { id: "bre", name: "Brentford", short: "BRE", attack: 1.34, defense: 1.06, hue: 12 },
  { id: "bou", name: "Bournemouth", short: "BOU", attack: 1.4, defense: 1.1, hue: 354 },
  { id: "nfo", name: "Nottm Forest", short: "NFO", attack: 1.22, defense: 0.99, hue: 8 },
  { id: "wol", name: "Wolves", short: "WOL", attack: 1.12, defense: 1.12, hue: 48 },
  { id: "lee", name: "Leeds", short: "LEE", attack: 1.26, defense: 1.14, hue: 220 },
  { id: "sun", name: "Sunderland", short: "SUN", attack: 1.08, defense: 1.16, hue: 354 },
  { id: "bur", name: "Burnley", short: "BUR", attack: 0.98, defense: 1.18, hue: 6 },
];

export const TEAM_BY_ID: Record<string, Team> = Object.fromEntries(TEAMS.map((t) => [t.id, t]));

export function getTeam(id: string): Team {
  const t = TEAM_BY_ID[id];
  if (t) return t;
  const short = id.replace(/\W/g, "").slice(0, 3).toUpperCase() || "???";
  let hue = 0;
  for (let i = 0; i < id.length; i++) hue = (hue * 31 + id.charCodeAt(i)) >>> 0;
  return { id, name: id, short, attack: 1.25, defense: 1, hue: hue % 360 };
}
