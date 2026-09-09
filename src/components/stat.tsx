import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wider text-faint">{label}</p>
      <p
        className={cn(
          "mt-1 truncate font-mono text-lg leading-none tabular sm:text-2xl",
          tone === "positive" && "text-positive",
          tone === "negative" && "text-negative",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}
