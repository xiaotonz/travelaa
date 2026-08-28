import { describe, expect, it } from "vitest";

import {
  formatAmount,
  formatExpenseDate,
  formatSignedAmount,
  isDefaultLedgerTitle,
  memberCountLabel,
} from "@/lib/format";

describe("formatAmount", () => {
  it("prefixes a display-only dollar sign", () => {
    expect(formatAmount(0)).toBe("$0.00");
    expect(formatAmount(125)).toBe("$125.00");
    expect(formatAmount(19.5)).toBe("$19.50");
  });
});

describe("formatSignedAmount", () => {
  it("keeps the dollar sign on signed nets", () => {
    expect(formatSignedAmount(209)).toBe("+$209.00");
    expect(formatSignedAmount(-65)).toBe("-$65.00");
    expect(formatSignedAmount(0.001)).toBe("$0.00");
  });
});

describe("isDefaultLedgerTitle", () => {
  it("treats the first-run title as unnamed", () => {
    expect(isDefaultLedgerTitle("Untitled ledger")).toBe(true);
    expect(isDefaultLedgerTitle("  untitled ledger  ")).toBe(true);
    expect(isDefaultLedgerTitle("Japan 2026")).toBe(false);
  });
});

describe("formatExpenseDate", () => {
  it("renders a calendar YYYY-MM-DD as that local day, not the UTC day before", () => {
    expect(formatExpenseDate("2026-08-28")).toBe("Aug 28, 2026");
    expect(formatExpenseDate("2026-08-28T00:00:00.000Z")).toBe("Aug 28, 2026");
  });
});

describe("memberCountLabel", () => {
  it("pluralizes member counts", () => {
    expect(memberCountLabel(0)).toBe("0 members");
    expect(memberCountLabel(1)).toBe("1 member");
    expect(memberCountLabel(4)).toBe("4 members");
  });
});
