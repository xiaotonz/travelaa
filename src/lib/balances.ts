import type { Expense, Ledger } from "@/types";

export type MemberBalance = {
  memberId: string;
  paid: number;
  owed: number;
  net: number;
};

export type LedgerTotals = {
  totalSpent: number;
  expenseCount: number;
};

export type BalanceSummary = {
  balances: MemberBalance[];
  totals: LedgerTotals;
};

export function computeMemberShare(expense: Expense, memberId: string): number {
  if (!expense.participants.includes(memberId)) {
    return 0;
  }

  if (expense.splitType === "custom") {
    return expense.customShares?.[memberId] ?? 0;
  }

  if (expense.participants.length === 0) {
    return 0;
  }

  return expense.amount / expense.participants.length;
}

export function computeBalances(ledger: Ledger): BalanceSummary {
  const balances = ledger.members.map((member) => {
    let paid = 0;
    let owed = 0;

    for (const expense of ledger.expenses) {
      if (expense.paidBy === member.id) {
        paid += expense.amount;
      }
      owed += computeMemberShare(expense, member.id);
    }

    return {
      memberId: member.id,
      paid,
      owed,
      net: paid - owed,
    };
  });

  return {
    balances,
    totals: {
      totalSpent: ledger.expenses.reduce((sum, expense) => sum + expense.amount, 0),
      expenseCount: ledger.expenses.length,
    },
  };
}
