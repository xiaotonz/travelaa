import { describe, expect, it } from "vitest";

import { computeBalances, type MemberBalance } from "@/lib/balances";
import { createEmptyLedger } from "@/lib/ledger-storage";
import { settleBalances, type Transfer } from "@/lib/settlement";
import type { Expense, Ledger, Member } from "@/types";

const members: Member[] = [
  { id: "alice", name: "Alice" },
  { id: "bob", name: "Bob" },
  { id: "carol", name: "Carol" },
  { id: "dave", name: "Dave" },
];

function ledger(expenses: Expense[]): Ledger {
  return {
    ...createEmptyLedger("Trip"),
    members,
    expenses,
  };
}

function applyTransfers(
  balances: MemberBalance[],
  transfers: Transfer[],
): Record<string, number> {
  const nets = Object.fromEntries(
    balances.map((item) => [item.memberId, item.net]),
  );

  for (const transfer of transfers) {
    nets[transfer.from] = (nets[transfer.from] ?? 0) + transfer.amount;
    nets[transfer.to] = (nets[transfer.to] ?? 0) - transfer.amount;
  }

  return nets;
}

describe("settleBalances", () => {
  it("returns no transfers when everyone is already even", () => {
    const plan = settleBalances([
      { memberId: "alice", paid: 0, owed: 0, net: 0 },
      { memberId: "bob", paid: 0, owed: 0, net: 0 },
    ]);

    expect(plan.before).toEqual([]);
    expect(plan.after).toEqual([]);
    expect(plan.reducedFrom).toBe(0);
    expect(plan.reducedTo).toBe(0);
  });

  it("builds a naive before-path and a greedy after-path that clears nets", () => {
    const summary = computeBalances(
      ledger([
        {
          id: "cabin",
          amount: 80,
          description: "Cabin",
          category: "Accommodation",
          date: "2026-08-01T00:00:00.000Z",
          paidBy: "alice",
          participants: ["alice", "carol"],
          splitType: "equal",
        },
        {
          id: "train",
          amount: 60,
          description: "Train",
          category: "Transport",
          date: "2026-08-02T00:00:00.000Z",
          paidBy: "bob",
          participants: ["bob", "dave"],
          splitType: "equal",
        },
      ]),
    );

    const netSum = summary.balances.reduce((sum, item) => sum + item.net, 0);
    expect(netSum).toBeCloseTo(0);

    const plan = settleBalances(summary.balances);

    expect(plan.before.length).toBeGreaterThan(0);
    expect(plan.after.length).toBeGreaterThan(0);
    expect(plan.after.length).toBeLessThanOrEqual(plan.before.length);
    expect(plan.reducedFrom).toBe(plan.before.length);
    expect(plan.reducedTo).toBe(plan.after.length);

    const remaining = applyTransfers(summary.balances, plan.after);
    for (const net of Object.values(remaining)) {
      expect(net).toBeCloseTo(0, 2);
    }
  });

  it("reduces transfer count on a four-person proportional-before example", () => {
    const balances: MemberBalance[] = [
      { memberId: "alice", paid: 50, owed: 0, net: 50 },
      { memberId: "bob", paid: 30, owed: 0, net: 30 },
      { memberId: "carol", paid: 0, owed: 40, net: -40 },
      { memberId: "dave", paid: 0, owed: 40, net: -40 },
    ];

    const plan = settleBalances(balances);

    expect(plan.before).toHaveLength(4);
    expect(plan.after.length).toBeLessThanOrEqual(3);
    expect(plan.after.length).toBeLessThanOrEqual(plan.before.length);

    const remaining = applyTransfers(balances, plan.after);
    for (const net of Object.values(remaining)) {
      expect(net).toBeCloseTo(0, 2);
    }
  });
});
