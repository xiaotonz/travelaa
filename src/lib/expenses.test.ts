import { describe, expect, it } from "vitest";

import { createEmptyLedger } from "@/lib/ledger-storage";
import {
  addExpense,
  customShareProgress,
  deleteExpense,
  insertExpenseAt,
  sortExpensesNewestFirst,
  toDateInputValue,
  updateExpense,
  type ExpenseDraft,
} from "@/lib/expenses";
import type { Expense, Ledger, Member } from "@/types";

const members: Member[] = [
  { id: "m1", name: "Alice" },
  { id: "m2", name: "Bob" },
];

function ledgerWithMembers(expenses: Expense[] = []): Ledger {
  return {
    ...createEmptyLedger("Trip"),
    members,
    expenses,
  };
}

function validDraft(overrides: Partial<ExpenseDraft> = {}): ExpenseDraft {
  return {
    amount: 40,
    description: "Dinner",
    category: "Food",
    date: "2026-08-20",
    paidBy: "m1",
    participants: ["m1", "m2"],
    splitType: "equal",
    ...overrides,
  };
}

describe("addExpense", () => {
  it("rejects an expense when the ledger has no members", () => {
    expect(addExpense(createEmptyLedger(), validDraft())).toEqual({
      ok: false,
      error: "Add at least one member before recording an expense.",
    });
  });

  it("rejects a missing or non-positive amount", () => {
    expect(addExpense(ledgerWithMembers(), validDraft({ amount: 0 }))).toEqual({
      ok: false,
      error: "Enter a positive amount.",
    });
    expect(addExpense(ledgerWithMembers(), validDraft({ amount: "" }))).toEqual({
      ok: false,
      error: "Enter a positive amount.",
    });
  });

  it("rejects a blank description", () => {
    expect(addExpense(ledgerWithMembers(), validDraft({ description: "  " }))).toEqual({
      ok: false,
      error: "Enter a description.",
    });
  });

  it("rejects a missing payer or empty participants", () => {
    expect(addExpense(ledgerWithMembers(), validDraft({ paidBy: "" }))).toEqual({
      ok: false,
      error: "Choose who paid.",
    });
    expect(
      addExpense(ledgerWithMembers(), validDraft({ participants: [] })),
    ).toEqual({
      ok: false,
      error: "Select at least one participant.",
    });
  });

  it("rejects custom shares that do not sum to the amount", () => {
    expect(
      addExpense(
        ledgerWithMembers(),
        validDraft({
          splitType: "custom",
          customShares: { m1: 10, m2: 10 },
        }),
      ),
    ).toEqual({
      ok: false,
      error: "Custom shares must add up to the expense amount.",
    });
  });

  it("accepts custom shares within a one-cent tolerance", () => {
    const result = addExpense(
      ledgerWithMembers(),
      validDraft({
        amount: 10,
        splitType: "custom",
        customShares: { m1: 5.004, m2: 5.004 },
      }),
      "exp-custom",
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.expenses[0]?.customShares).toEqual({
        m1: 5.004,
        m2: 5.004,
      });
    }
  });

  it("appends a valid equal-split expense", () => {
    const result = addExpense(ledgerWithMembers(), validDraft(), "exp-1");

    expect(result).toEqual({
      ok: true,
      expenses: [
        {
          id: "exp-1",
          amount: 40,
          description: "Dinner",
          category: "Food",
          date: "2026-08-20T00:00:00.000Z",
          paidBy: "m1",
          participants: ["m1", "m2"],
          splitType: "equal",
        },
      ],
    });
  });
});

describe("updateExpense", () => {
  it("replaces an existing expense in place and keeps the same id", () => {
    const existing: Expense = {
      id: "exp-1",
      amount: 12,
      description: "Coffee",
      category: "Food",
      date: "2026-08-20T00:00:00.000Z",
      paidBy: "m1",
      participants: ["m1"],
      splitType: "equal",
    };
    const later: Expense = {
      ...existing,
      id: "exp-2",
      description: "Taxi",
      amount: 36,
      category: "Transport",
    };
    const result = updateExpense(
      ledgerWithMembers([existing, later]),
      "exp-1",
      validDraft({
        amount: 48,
        description: "Hotel",
        category: "Accommodation",
        date: "2026-08-21",
        paidBy: "m2",
        participants: ["m1", "m2"],
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.expenses.map((item) => item.id)).toEqual(["exp-1", "exp-2"]);
      expect(result.expenses[0]).toMatchObject({
        id: "exp-1",
        amount: 48,
        description: "Hotel",
        category: "Accommodation",
        paidBy: "m2",
        participants: ["m1", "m2"],
      });
    }
  });

  it("rejects an unknown expense id", () => {
    expect(updateExpense(ledgerWithMembers(), "missing", validDraft())).toEqual({
      ok: false,
      error: "Expense not found.",
    });
  });
});

describe("customShareProgress", () => {
  it("reports assigned, remaining, and whether shares are within tolerance", () => {
    expect(
      customShareProgress(96, { m1: "40", m2: "40" }, ["m1", "m2", "m3"]),
    ).toEqual({
      assigned: 80,
      target: 96,
      remaining: 16,
      balanced: false,
    });
    expect(
      customShareProgress(10, { m1: "5.004", m2: "5.004" }, ["m1", "m2"]),
    ).toMatchObject({
      assigned: 10.008,
      target: 10,
      balanced: true,
    });
  });
});

describe("toDateInputValue", () => {
  it("turns a stored ISO date into a yyyy-mm-dd input value", () => {
    expect(toDateInputValue("2026-08-28T00:00:00.000Z")).toBe("2026-08-28");
    expect(toDateInputValue("2026-08-28")).toBe("2026-08-28");
  });
});

describe("insertExpenseAt", () => {
  it("puts a deleted expense back at its original index", () => {
    const first: Expense = {
      id: "exp-1",
      amount: 12,
      description: "Coffee",
      category: "Food",
      date: "2026-08-20T00:00:00.000Z",
      paidBy: "m1",
      participants: ["m1"],
      splitType: "equal",
    };
    const second: Expense = { ...first, id: "exp-2", description: "Taxi" };

    expect(insertExpenseAt([second], first, 0).map((item) => item.id)).toEqual([
      "exp-1",
      "exp-2",
    ]);
  });
});

describe("deleteExpense", () => {
  it("removes an expense by id", () => {
    const existing: Expense = {
      id: "exp-1",
      amount: 12,
      description: "Coffee",
      category: "Food",
      date: "2026-08-20T00:00:00.000Z",
      paidBy: "m1",
      participants: ["m1"],
      splitType: "equal",
    };

    expect(deleteExpense(ledgerWithMembers([existing]), "exp-1")).toEqual({
      ok: true,
      expenses: [],
    });
  });
});

describe("sortExpensesNewestFirst", () => {
  it("orders by date descending and keeps later additions first on a tie", () => {
    const older: Expense = {
      id: "older",
      amount: 1,
      description: "Older",
      category: "Food",
      date: "2026-08-01T00:00:00.000Z",
      paidBy: "m1",
      participants: ["m1"],
      splitType: "equal",
    };
    const newer: Expense = {
      ...older,
      id: "newer",
      description: "Newer",
      date: "2026-08-20T00:00:00.000Z",
    };
    const sameDayLater: Expense = {
      ...newer,
      id: "same-day-later",
      description: "Same day later",
    };

    expect(
      sortExpensesNewestFirst([older, newer, sameDayLater]).map((item) => item.id),
    ).toEqual(["same-day-later", "newer", "older"]);
  });
});
