import { afterEach, describe, expect, it } from "vitest";

import type { Expense, Ledger, Member } from "@/types";
import {
  createEmptyLedger,
  LEDGER_STORAGE_KEY,
  loadLedger,
  replaceExpenses,
  replaceMembers,
  saveLedger,
  updateLedgerTitle,
} from "@/lib/ledger-storage";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };

  return {
    getItem(key: string) {
      return key in data ? data[key] : null;
    },
    setItem(key: string, value: string) {
      data[key] = value;
    },
    removeItem(key: string) {
      delete data[key];
    },
  };
}

function sampleMember(id: string, name: string): Member {
  return { id, name };
}

function sampleExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "exp-1",
    amount: 42,
    description: "Dinner",
    category: "Food",
    date: "2026-08-25T00:00:00.000Z",
    paidBy: "m1",
    participants: ["m1", "m2"],
    splitType: "equal",
    ...overrides,
  };
}

describe("createEmptyLedger", () => {
  it("creates an active ledger with no members or expenses", () => {
    const ledger = createEmptyLedger("Japan trip");

    expect(ledger.title).toBe("Japan trip");
    expect(ledger.status).toBe("active");
    expect(ledger.members).toEqual([]);
    expect(ledger.expenses).toEqual([]);
    expect(ledger.id.length).toBeGreaterThan(0);
    expect(Number.isNaN(Date.parse(ledger.createdAt))).toBe(false);
  });
});

describe("loadLedger and saveLedger", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("returns null when storage is unavailable (SSR)", () => {
    expect(loadLedger(null)).toBeNull();
  });

  it("returns null when nothing is stored", () => {
    expect(loadLedger(memoryStorage())).toBeNull();
  });

  it("returns null for corrupt JSON instead of throwing", () => {
    const storage = memoryStorage({ [LEDGER_STORAGE_KEY]: "{not-json" });
    expect(loadLedger(storage)).toBeNull();
  });

  it("round-trips a saved ledger", () => {
    const storage = memoryStorage();
    const ledger = createEmptyLedger("Round trip");

    expect(saveLedger(ledger, storage)).toBe(true);
    expect(loadLedger(storage)).toEqual(ledger);
  });

  it("uses window.localStorage by default in the browser", () => {
    const ledger = createEmptyLedger("Browser storage");

    expect(saveLedger(ledger)).toBe(true);
    expect(loadLedger()).toEqual(ledger);
  });
});

describe("ledger updates", () => {
  it("updates the title without mutating the original ledger", () => {
    const ledger = createEmptyLedger("Old title");
    const next = updateLedgerTitle(ledger, "New title");

    expect(next.title).toBe("New title");
    expect(ledger.title).toBe("Old title");
    expect(next).not.toBe(ledger);
  });

  it("replaces members immutably and drops unknown participants from expenses", () => {
    const alice = sampleMember("m1", "Alice");
    const bob = sampleMember("m2", "Bob");
    const ledger: Ledger = {
      ...createEmptyLedger("Members"),
      members: [alice, bob],
      expenses: [
        sampleExpense({
          customShares: { m1: 20, m2: 22 },
        }),
      ],
    };

    const next = replaceMembers(ledger, [alice]);

    expect(next.members).toEqual([alice]);
    expect(next.expenses[0]?.participants).toEqual(["m1"]);
    expect(next.expenses[0]?.customShares).toEqual({ m1: 20 });
    expect(ledger.members).toHaveLength(2);
    expect(ledger.expenses[0]?.participants).toEqual(["m1", "m2"]);
  });

  it("replaces expenses immutably and clones nested fields", () => {
    const ledger = createEmptyLedger("Expenses");
    const expense = sampleExpense();
    const next = replaceExpenses(ledger, [expense]);

    next.expenses[0]!.participants.push("m3");
    next.expenses[0]!.customShares = { m1: 1 };

    expect(ledger.expenses).toEqual([]);
    expect(expense.participants).toEqual(["m1", "m2"]);
    expect(expense.customShares).toBeUndefined();
  });
});
