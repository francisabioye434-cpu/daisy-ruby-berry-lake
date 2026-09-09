import { cn } from "@/lib/utils";
import { formatPct } from "@/lib/utils";
import type { ScoreMatrix } from "@/lib/math/dixon-coles";

export function ScoreMatrixGrid({
  matrix,
  maxShow = 5,
}: {
  matrix: ScoreMatrix;
  maxShow?: number;
}) {
  let peak = 0;
  for (let h = 0; h <= maxShow; h++) {
    for (let a = 0; a <= maxShow; a++) {
      peak = Math.max(peak, matrix.joint[h][a]);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[20rem] border-separate border-spacing-1 text-center">
        <thead>
          <tr>
            <th className="w-8 pb-1 text-[10px] font-medium uppercase tracking-wider text-faint">
              H\A
            </th>
            {Array.from({ length: maxShow + 1 }, (_, a) => (
              <th key={a} className="pb-1 text-[10px] font-medium text-muted tabular">
                {a}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxShow + 1 }, (_, h) => (
            <tr key={h}>
              <th className="pr-1 text-[10px] font-medium text-muted tabular">{h}</th>
              {Array.from({ length: maxShow + 1 }, (_, a) => {
                const p = matrix.joint[h][a];
                const t = peak > 0 ? p / peak : 0;
                const isMode = p === peak && p > 0;
                return (
                  <td key={a}>
                    <div
                      className={cn(
                        "flex h-10 items-center justify-center rounded-xs text-[11px] tabular sm:h-11 sm:text-xs",
                        isMode ? "text-accent-fg" : t > 0.45 ? "text-fg" : "text-muted",
                      )}
                      style={{
                        background: isMode
                          ? "var(--color-accent)"
                          : `color-mix(in oklab, var(--color-fg) ${Math.round(t * 28)}%, var(--color-subtle))`,
                      }}
                      title={`${h}–${a} · ${formatPct(p, 2)}`}
                    >
                      {formatPct(p, 1).replace("%", "")}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-faint">
        Cell = probability of that scoreline (%). Highlight is the mode.
      </p>
    </div>
  );
}
