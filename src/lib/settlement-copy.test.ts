import { describe, expect, it } from "vitest";

import { settlementHeadline } from "@/lib/settlement";

describe("settlementHeadline", () => {
  it("only claims a reduction when the after path is shorter", () => {
    expect(settlementHeadline(6, 3)).toEqual({
      title: "Transactions reduced from 6 to 3",
      subtitle: "Fewer payments mean a simpler way to settle.",
    });
  });

  it("stays honest when before and after have the same count", () => {
    expect(settlementHeadline(3, 3)).toEqual({
      title: "Already the simplest path — 3 payments",
      subtitle: "Before and after use the same number of transfers.",
    });
    expect(settlementHeadline(1, 1)).toEqual({
      title: "Already the simplest path — 1 payment",
      subtitle: "Before and after use the same number of transfers.",
    });
  });

  it("does not pretend there is a simpler path when nothing is owed", () => {
    expect(settlementHeadline(0, 0)).toEqual({
      title: "Nothing to settle",
      subtitle: "No transfers are required right now.",
    });
  });
});
