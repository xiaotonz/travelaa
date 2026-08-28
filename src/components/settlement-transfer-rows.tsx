import { formatAmount } from "@/lib/format";
import type { Transfer } from "@/lib/settlement";

type SettlementTransferRowsProps = {
  transfers: Transfer[];
  names: Record<string, string>;
};

export function SettlementTransferRows({
  transfers,
  names,
}: SettlementTransferRowsProps) {
  if (transfers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Everyone is already settled. No transfers needed.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {transfers.map((transfer) => {
        const fromName = names[transfer.from] ?? "Unknown";
        const toName = names[transfer.to] ?? "Unknown";

        return (
          <li
            key={`${transfer.from}-${transfer.to}-${transfer.amount}`}
            className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5"
          >
            <span className="inline-flex min-h-8 items-center rounded-full bg-background px-2.5 text-sm font-medium">
              {fromName}
            </span>
            <span className="text-sm text-muted-foreground">pays</span>
            <span className="inline-flex min-h-8 items-center rounded-full bg-foreground px-2.5 text-sm font-semibold text-background tabular-nums">
              {formatAmount(transfer.amount)}
            </span>
            <span className="text-sm text-muted-foreground" aria-hidden="true">
              →
            </span>
            <span className="inline-flex min-h-8 items-center rounded-full bg-background px-2.5 text-sm font-medium">
              {toName}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
