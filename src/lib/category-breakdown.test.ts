import { describe, expect, it } from "vitest";

import { computeCategoryBreakdown } from "@/lib/category-breakdown";
import type { Expense } from "@/types";

function expense(category: string, amount: number, id: string): Expense {
  return {
    id,
    amount,
    description: id,
    category,
    date: "2026-08-25T00:00:00.000Z",
    paidBy: "m1",
    participants: ["m1"],
    splitType: "equal",
  };
}

describe("computeCategoryBreakdown", () => {
  it("returns an empty list when there are no expenses", () => {
    expect(computeCategoryBreakdown([])).toEqual([]);
  });

  it("sums amounts by category and sorts largest first", () => {
    expect(
      computeCategoryBreakdown([
        expense("Food", 12, "a"),
        expense("Transport", 40, "b"),
        expense("Food", 8, "c"),
      ]),
    ).toEqual([
      { category: "Transport", amount: 40, percent: 67 },
      { category: "Food", amount: 20, percent: 33 },
    ]);
  });
});
