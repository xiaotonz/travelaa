"use client";

import { computeBalances } from "@/lib/balances";
import { computeCategoryBreakdown } from "@/lib/category-breakdown";
import { formatAmount } from "@/lib/format";
import { useLedgerStore } from "@/store/ledger-store";

import { CategoryChart } from "@/components/category-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LedgerOverview() {
  const ledger = useLedgerStore((state) => state.ledger);
  const { totals } = computeBalances(ledger);
  const breakdown = computeCategoryBreakdown(ledger.expenses);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Overview</CardTitle>
        <CardDescription>Spend so far on this trip.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted/60 px-3 py-3">
            <p className="text-xs text-muted-foreground">Total spent</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {formatAmount(totals.totalSpent)}
            </p>
          </div>
          <div className="rounded-xl bg-muted/60 px-3 py-3">
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {totals.expenseCount}
            </p>
          </div>
        </div>

        {breakdown.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No expenses yet. Tap Add expense for a category breakdown.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">By category</p>
            <CategoryChart data={breakdown} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
