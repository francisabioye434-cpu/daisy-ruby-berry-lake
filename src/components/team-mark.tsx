import { cn } from "@/lib/utils";
import type { Team } from "@/lib/data/teams";

export function TeamMark({
  team,
  size = "md",
}: {
  team: Team;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "size-7 text-[10px]" : size === "lg" ? "size-11 text-sm" : "size-9 text-xs";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-sm font-medium tracking-wide text-fg",
        dim,
      )}
      style={{
        background: `hsl(${team.hue} 18% 18%)`,
        boxShadow: "inset 0 0 0 1px hsl(0 0% 100% / 0.08)",
      }}
      aria-hidden
    >
      {(team.short || team.name || "?").slice(0, 3)}
    </span>
  );
}
