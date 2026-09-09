import { useEffect } from "react";
import type { Fixture } from "@/lib/data/fixtures";
import { settlementPatch } from "@/lib/settle-journal";
import { useDesk } from "@/lib/store";

/** When a logged match goes FT, mark win/loss and stamp the close if the book still has a number. */
export function useAutoSettle(fixtures: Fixture[] | undefined) {
  const bets = useDesk((s) => s.bets);
  const updateBet = useDesk((s) => s.updateBet);

  useEffect(() => {
    if (!fixtures?.length) return;
    for (const bet of bets) {
      const patch = settlementPatch(bet, fixtures);
      if (patch) updateBet(bet.id, patch);
    }
  }, [fixtures, bets, updateBet]);
}
