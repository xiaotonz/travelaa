import { describe, expect, it } from "vitest";

import { computeBalances } from "@/lib/balances";
import { createEmptyLedger } from "@/lib/ledger-storage";
import type { Expense, Ledger, Member } from "@/types";

const members: Member[] = [
  { id: "alice", name: "Alice" },
  { id: "bob", name: "Bob" },
  { id: "carol", name: "Carol" },
];

function expense(partial: Partial<Expense> & Pick<Expense, "id" | "amount" | "paidBy" | "participants" | "splitType">): Expense {
  return {
    description: partial.description ?? partial.id,
    category: "Food",
    date: "2026-08-25T00:00:00.000Z",
    ...partial,
  };
}

function ledger(expenses: Expense[]): Ledger {
  return {
    ...createEmptyLedger("Trip"),
    members,
    expenses,
  };
}

function balanceById(
  balances: ReturnType<typeof computeBalances>["balances"],
  memberId: string,
) {
  return balances.find((item) => item.memberId === memberId);
}

describe("computeBalances", () => {
  it("returns zeros for members when there are no expenses", () => {
    const summary = computeBalances(ledger([]));

    expect(summary.totals).toEqual({ totalSpent: 0, expenseCount: 0 });
    expect(summary.balances).toEqual([
      { memberId: "alice", paid: 0, owed: 0, net: 0 },
      { memberId: "bob", paid: 0, owed: 0, net: 0 },
      { memberId: "carol", paid: 0, owed: 0, net: 0 },
    ]);
  });

  it("splits an equal expense across participants", () => {
    const summary = computeBalances(
      ledger([
        expense({
          id: "dinner",
          amount: 90,
          paidBy: "alice",
          participants: ["alice", "bob", "carol"],
          splitType: "equal",
        }),
      ]),
    );

    expect(summary.totals).toEqual({ totalSpent: 90, expenseCount: 1 });
    expect(balanceById(summary.balances, "alice")).toEqual({
      memberId: "alice",
      paid: 90,
      owed: 30,
      net: 60,
    });
    expect(balanceById(summary.balances, "bob")).toEqual({
      memberId: "bob",
      paid: 0,
      owed: 30,
      net: -30,
    });
    expect(balanceById(summary.balances, "carol")).toEqual({
      memberId: "carol",
      paid: 0,
      owed: 30,
      net: -30,
    });
  });

  it("uses custom shares for should-pay amounts", () => {
    const summary = computeBalances(
      ledger([
        expense({
          id: "hotel",
          amount: 100,
          paidBy: "bob",
          participants: ["alice", "bob"],
          splitType: "custom",
          customShares: { alice: 70, bob: 30 },
        }),
      ]),
    );

    expect(balanceById(summary.balances, "alice")).toEqual({
      memberId: "alice",
      paid: 0,
      owed: 70,
      net: -70,
    });
    expect(balanceById(summary.balances, "bob")).toEqual({
      memberId: "bob",
      paid: 100,
      owed: 30,
      net: 70,
    });
    expect(balanceById(summary.balances, "carol")).toEqual({
      memberId: "carol",
      paid: 0,
      owed: 0,
      net: 0,
    });
  });

  it("accumulates paid and owed across multiple expenses", () => {
    const summary = computeBalances(
      ledger([
        expense({
          id: "taxi",
          amount: 40,
          paidBy: "alice",
          participants: ["alice", "bob"],
          splitType: "equal",
        }),
        expense({
          id: "snacks",
          amount: 10,
          paidBy: "carol",
          participants: ["bob", "carol"],
          splitType: "custom",
          customShares: { bob: 6, carol: 4 },
        }),
      ]),
    );

    expect(summary.totals).toEqual({ totalSpent: 50, expenseCount: 2 });
    expect(balanceById(summary.balances, "alice")).toEqual({
      memberId: "alice",
      paid: 40,
      owed: 20,
      net: 20,
    });
    expect(balanceById(summary.balances, "bob")).toEqual({
      memberId: "bob",
      paid: 0,
      owed: 26,
      net: -26,
    });
    expect(balanceById(summary.balances, "carol")).toEqual({
      memberId: "carol",
      paid: 10,
      owed: 4,
      net: 6,
    });

    const netSum = summary.balances.reduce((sum, item) => sum + item.net, 0);
    expect(netSum).toBeCloseTo(0);
  });
});
