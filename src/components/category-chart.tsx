import { formatAmount } from "@/lib/format";
import type { CategoryTotal } from "@/lib/category-breakdown";

const TRAVEL_CHART_COLORS = [
  "#3f6f64",
  "#c46b3a",
  "#d4a24c",
  "#4b7c9b",
  "#8b5e3c",
  "#6b7280",
  "#9a4d4d",
];

type CategoryChartProps = {
  data: CategoryTotal[];
};

export function CategoryChart({ data }: CategoryChartProps) {
  const maxAmount = data[0]?.amount ?? 0;

  return (
    <ul className="flex flex-col gap-3">
      {data.map((entry, index) => {
        const width =
          maxAmount > 0 ? Math.max((entry.amount / maxAmount) * 100, 4) : 0;

        return (
          <li key={entry.category} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium">{entry.category}</span>
              <span className="text-sm tabular-nums text-muted-foreground">
                {formatAmount(entry.amount)} · {entry.percent}%
              </span>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-muted"
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${width}%`,
                  backgroundColor:
                    TRAVEL_CHART_COLORS[index % TRAVEL_CHART_COLORS.length],
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
