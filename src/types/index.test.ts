import { describe, expect, it } from "vitest";

import { EXPENSE_CATEGORIES } from "@/types";

describe("EXPENSE_CATEGORIES", () => {
  it("exports the required category names", () => {
    expect(EXPENSE_CATEGORIES).toEqual([
      "Accommodation",
      "Transport",
      "Food",
      "Ticket",
      "Shopping",
      "Entertainment",
      "Other",
    ]);
  });
});
