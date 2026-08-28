"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { insertExpenseAt, sortExpensesNewestFirst } from "@/lib/expenses";
import { formatAmount, formatExpenseDate } from "@/lib/format";
import { useLedgerStore } from "@/store/ledger-store";
import type { Expense } from "@/types";

function joinNames(names: string[]): string {
  if (names.length === 0) {
    return "no one";
  }
  if (names.length === 1) {
    return names[0] ?? "Unknown";
  }
  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  }

  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

type ExpenseListProps = {
  onEdit: (expense: Expense) => void;
  onAdd?: () => void;
};

type PendingUndo = {
  expense: Expense;
  index: number;
};

export function ExpenseList({ onEdit, onAdd }: ExpenseListProps) {
  const members = useLedgerStore((state) => state.ledger.members);
  const expenses = useLedgerStore((state) => state.ledger.expenses);
  const isHydrated = useLedgerStore((state) => state.isHydrated);
  const hydrate = useLedgerStore((state) => state.hydrate);
  const deleteExpense = useLedgerStore((state) => state.deleteExpense);
  const replaceExpenses = useLedgerStore((state) => state.replaceExpenses);
  const [pendingUndo, setPendingUndo] = useState<PendingUndo | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  function memberName(memberId: string): string {
    return members.find((member) => member.id === memberId)?.name ?? "Unknown";
  }

  function handleDelete(expense: Expense) {
    const index = expenses.findIndex((item) => item.id === expense.id);
    const error = deleteExpense(expense.id);
    if (!error && index !== -1) {
      setPendingUndo({ expense, index });
    }
  }

  function handleUndo() {
    if (!pendingUndo) {
      return;
    }

    replaceExpenses(
      insertExpenseAt(expenses, pendingUndo.expense, pendingUndo.index),
    );
    setPendingUndo(null);
  }

  const ordered = sortExpensesNewestFirst(expenses);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <CardTitle>Expenses</CardTitle>
          <CardDescription>Newest dates appear first. Tap a row to edit.</CardDescription>
        </div>
        {onAdd ? (
          <Button type="button" className="min-h-11" onClick={onAdd}>
            Add expense
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {pendingUndo ? (
          <div
            role="status"
            className="sticky top-0 z-20 flex flex-col gap-2 rounded-xl bg-foreground px-3 py-3 text-sm text-background shadow-md"
          >
            <p>
              Deleted {pendingUndo.expense.description} (
              {formatAmount(pendingUndo.expense.amount)}).
            </p>
            <button
              type="button"
              className="min-h-11 w-full rounded-lg bg-background px-3 font-medium text-foreground"
              onClick={handleUndo}
            >
              Undo delete
            </button>
            <button
              type="button"
              className="min-h-11 w-full rounded-lg border border-background/40 px-3 font-medium"
              onClick={() => setPendingUndo(null)}
            >
              Dismiss
            </button>
          </div>
        ) : null}

        {isHydrated && ordered.length === 0 && !pendingUndo ? (
          <p className="text-sm text-muted-foreground">
            No expenses yet. Tap Add expense to record the first one.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {ordered.map((expense) => {
              const participantNames = expense.participants.map(memberName);

              return (
                <li key={expense.id}>
                  <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-3">
                    <button
                      type="button"
                      className="flex flex-col gap-2 rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      onClick={() => onEdit(expense)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatExpenseDate(expense.date)}
                          </p>
                        </div>
                        <p className="text-base font-semibold tabular-nums">
                          {formatAmount(expense.amount)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{expense.category}</Badge>
                        <span className="text-sm text-muted-foreground">
                          Paid by {memberName(expense.paidBy)} ·{" "}
                          {joinNames(participantNames)}
                        </span>
                      </div>
                    </button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-11 self-start px-4"
                      onClick={() => handleDelete(expense)}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
