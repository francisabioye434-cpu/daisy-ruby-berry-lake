import { ledgerStats, type DeskTicket } from "@/lib/store-ledger";
import type { JournalBet } from "@/lib/store";
import { learnFromBets } from "@/lib/journal-learn";

export function deskIq(tickets: DeskTicket[], sits: number, bets: JournalBet[]) {
  const stats = ledgerStats(tickets, sits);
  const learn = learnFromBets(bets);
  const sample = Math.min(1, (stats.settled + stats.sits) / 40);
  const clv = stats.meanClv == null ? 0.4 : Math.max(0, Math.min(1, 0.5 + stats.meanClv * 4));
  const discipline = stats.sitRate == null ? 0.5 : Math.min(1, stats.sitRate);
  const votes = Math.min(1, bets.filter((b) => b.vote).length / 20);
  const score = 0.35 * sample + 0.3 * clv + 0.2 * discipline + 0.15 * votes;
  return {
    score,
    sample,
    clv,
    discipline,
    votes,
    blend: learn.blendDelta,
    note:
      sample < 0.4
        ? "IQ rises as the record fills. Sitting is intelligence, not a miss."
        : stats.meanClv != null && stats.meanClv > 0
          ? "Process is beating the close. Keep the same gates."
          : "Read CLV before win rate. The desk learns from closes, not luck.",
  };
}
