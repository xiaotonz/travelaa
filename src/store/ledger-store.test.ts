import { describe, expect, it } from "vitest";

import { LEDGER_STORAGE_KEY } from "@/lib/ledger-storage";
import { createLedgerStore } from "@/store/ledger-store";
import type { Member } from "@/types";

describe("createLedgerStore", () => {
  it("starts with an empty in-memory ledger and hydrates from storage", () => {
    const stored = {
      id: "ledger-1",
      title: "Stored trip",
      createdAt: "2026-08-25T00:00:00.000Z",
      members: [] as Member[],
      expenses: [],
      status: "active" as const,
    };
    const storage = {
      getItem: () => JSON.stringify(stored),
      setItem: () => undefined,
      removeItem: () => undefined,
    };

    const store = createLedgerStore(storage);

    expect(store.getState().isHydrated).toBe(false);
    expect(store.getState().ledger.members).toEqual([]);

    store.getState().hydrate();

    expect(store.getState().isHydrated).toBe(true);
    expect(store.getState().ledger).toEqual(stored);

    store.getState().setTitle("Changed after hydrate");
    store.getState().hydrate();
    expect(store.getState().ledger.title).toBe("Changed after hydrate");
  });

  it("persists title, members, and expenses through the store", () => {
    const data: Record<string, string> = {};
    const storage = {
      getItem: (key: string) => data[key] ?? null,
      setItem: (key: string, value: string) => {
        data[key] = value;
      },
      removeItem: (key: string) => {
        delete data[key];
      },
    };
    const store = createLedgerStore(storage);
    const members: Member[] = [{ id: "m1", name: "Alice" }];

    store.getState().setTitle("Kyoto");
    store.getState().replaceMembers(members);
    store.getState().replaceExpenses([]);

    expect(store.getState().ledger.title).toBe("Kyoto");
    expect(store.getState().ledger.members).toEqual(members);
    expect(data[LEDGER_STORAGE_KEY]).toContain("Kyoto");
  });

  it("adds a member and persists the ledger", () => {
    const data: Record<string, string> = {};
    const storage = {
      getItem: (key: string) => data[key] ?? null,
      setItem: (key: string, value: string) => {
        data[key] = value;
      },
      removeItem: (key: string) => {
        delete data[key];
      },
    };
    const store = createLedgerStore(storage);

    expect(store.getState().addMember("  Alice  ")).toBeNull();
    expect(store.getState().ledger.members).toEqual([
      expect.objectContaining({ name: "Alice" }),
    ]);
    expect(data[LEDGER_STORAGE_KEY]).toContain("Alice");
  });

  it("does not persist a rejected member name", () => {
    const data: Record<string, string> = {};
    const storage = {
      getItem: (key: string) => data[key] ?? null,
      setItem: (key: string, value: string) => {
        data[key] = value;
      },
      removeItem: (key: string) => {
        delete data[key];
      },
    };
    const store = createLedgerStore(storage);

    expect(store.getState().addMember("   ")).toBe("Enter a member name.");
    expect(store.getState().ledger.members).toEqual([]);
    expect(data[LEDGER_STORAGE_KEY]).toBeUndefined();
  });

  it("adds and deletes an expense through the store", () => {
    const data: Record<string, string> = {};
    const storage = {
      getItem: (key: string) => data[key] ?? null,
      setItem: (key: string, value: string) => {
        data[key] = value;
      },
      removeItem: (key: string) => {
        delete data[key];
      },
    };
    const store = createLedgerStore(storage);

    store.getState().addMember("Alice");
    const payerId = store.getState().ledger.members[0]!.id;

    expect(
      store.getState().addExpense({
        amount: 25,
        description: "Museum",
        category: "Ticket",
        date: "2026-08-21",
        paidBy: payerId,
        participants: [payerId],
        splitType: "equal",
      }),
    ).toBeNull();
    expect(store.getState().ledger.expenses).toHaveLength(1);
    expect(data[LEDGER_STORAGE_KEY]).toContain("Museum");

    const expenseId = store.getState().ledger.expenses[0]!.id;
    expect(
      store.getState().updateExpense(expenseId, {
        amount: 30,
        description: "Museum tickets",
        category: "Ticket",
        date: "2026-08-21",
        paidBy: payerId,
        participants: [payerId],
        splitType: "equal",
      }),
    ).toBeNull();
    expect(store.getState().ledger.expenses[0]).toMatchObject({
      id: expenseId,
      description: "Museum tickets",
      amount: 30,
    });
    expect(data[LEDGER_STORAGE_KEY]).toContain("Museum tickets");

    expect(store.getState().deleteExpense(expenseId)).toBeNull();
    expect(store.getState().ledger.expenses).toEqual([]);
    expect(data[LEDGER_STORAGE_KEY]).not.toContain("Museum tickets");

    expect(store.getState().restoreDeletedExpense()).toBeNull();
    expect(store.getState().ledger.expenses[0]).toMatchObject({
      id: expenseId,
      description: "Museum tickets",
      amount: 30,
    });
    expect(data[LEDGER_STORAGE_KEY]).toContain("Museum tickets");
  });
});
