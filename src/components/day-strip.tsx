import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { dayLabel } from "@/lib/day";

export function Chip({
  active,
  onClick,
  children,
  tone = "accent",
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  tone?: "accent" | "subtle";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 shrink-0 rounded-full px-4 text-sm transition-colors duration-150",
        active && tone === "accent" && "bg-accent text-accent-fg",
        active && tone === "subtle" && "bg-subtle text-fg shadow-[var(--shadow-border)]",
        !active && "bg-surface text-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

export function DayStrip({
  days,
  value,
  today,
  counts,
  onChange,
}: {
  days: string[];
  value: string;
  today: string;
  counts: Record<string, number>;
  onChange: (day: string) => void;
}) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {days.map((d) => {
        const n = counts[d] || 0;
        return (
          <Chip key={d} active={value === d} onClick={() => onChange(d)}>
            <span className="tabular">{dayLabel(d, today)}</span>
            <span className={cn("ml-1.5 tabular", value === d ? "opacity-70" : "text-faint")}>{n}</span>
          </Chip>
        );
      })}
    </div>
  );
}
