import { describe, expect, it } from "vitest";

import { createEmptyLedger } from "@/lib/ledger-storage";
import { addMember, removeMember } from "@/lib/members";
import type { Expense, Ledger } from "@/types";

function expenseFor(memberId: string): Expense {
  return {
    id: "exp-1",
    amount: 20,
    description: "Taxi",
    category: "Transport",
    date: "2026-08-25T00:00:00.000Z",
    paidBy: memberId,
    participants: [memberId],
    splitType: "equal",
  };
}

describe("addMember", () => {
  it("trims the name and assigns a unique id", () => {
    const result = addMember([], "  Alice  ", "m1");

    expect(result).toEqual({
      ok: true,
      members: [{ id: "m1", name: "Alice" }],
    });
  });

  it("rejects a blank name", () => {
    expect(addMember([], "   ")).toEqual({
      ok: false,
      error: "Enter a member name.",
    });
  });

  it("rejects a duplicate name case-insensitively", () => {
    const result = addMember([{ id: "m1", name: "Alice" }], "alice");

    expect(result).toEqual({
      ok: false,
      error: 'A member named "alice" already exists.',
    });
  });
});

describe("removeMember", () => {
  it("removes a member who is not on any expense", () => {
    const ledger: Ledger = {
      ...createEmptyLedger("Trip"),
      members: [
        { id: "m1", name: "Alice" },
        { id: "m2", name: "Bob" },
      ],
    };

    expect(removeMember(ledger, "m1")).toEqual({
      ok: true,
      members: [{ id: "m2", name: "Bob" }],
    });
  });

  it("blocks removing a member who paid or participates in an expense", () => {
    const ledger: Ledger = {
      ...createEmptyLedger("Trip"),
      members: [{ id: "m1", name: "Alice" }],
      expenses: [expenseFor("m1")],
    };

    expect(removeMember(ledger, "m1")).toEqual({
      ok: false,
      error:
        "Cannot remove Alice because they are part of existing expenses.",
    });
  });
});
