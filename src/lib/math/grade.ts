import type { DeskCall } from "./call";

export type ResultSide = "home" | "draw" | "away";
export type ResultGrade = "hit" | "miss" | "sat";

export function actual1x2(score: { home: number; away: number }): ResultSide {
  if (score.home > score.away) return "home";
  if (score.home < score.away) return "away";
  return "draw";
}

export function gradeCall(
  call: DeskCall,
  score: { home: number; away: number } | undefined,
  side?: string,
): ResultGrade {
  if (!score) return "sat";
  if (call.action === "pass") return "sat";
  const actual = actual1x2(score);
  const picked = side === "home" || side === "draw" || side === "away" ? side : null;
  if (!picked) return "sat";
  return picked === actual ? "hit" : "miss";
}

export function scoreline(score: { home: number; away: number }): string {
  return `${score.home}–${score.away}`;
}
