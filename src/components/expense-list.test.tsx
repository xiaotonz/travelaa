import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ExpenseList } from "@/components/expense-list";
import { useLedgerStore } from "@/store/ledger-store";
import type { Expense, Ledger } from "@/types";

const taxi: Expense = {
  id: "taxi",
  amount: 36,
  description: "Taxi",
  category: "Transport",
  date: "2026-08-28T00:00:00.000Z",
  paidBy: "carol",
  participants: ["alice", "bob", "carol", "dave"],
  splitType: "equal",
};

const hotel: Expense = {
  ...taxi,
  id: "hotel",
  amount: 480,
  description: "Hotel",
  category: "Accommodation",
  paidBy: "alice",
};

const ledger: Ledger = {
  id: "demo",
  title: "Japan 2026",
  createdAt: "2026-08-28T00:00:00.000Z",
  status: "active",
  members: [
    { id: "alice", name: "Alice" },
    { id: "bob", name: "Bob" },
    { id: "carol", name: "Carol" },
    { id: "dave", name: "Dave" },
  ],
  expenses: [hotel, taxi],
};

describe("ExpenseList undo", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    useLedgerStore.setState({
      ledger,
      isHydrated: true,
      deletedExpense: null,
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("restores a deleted expense when Undo is pressed", () => {
    act(() => {
      root.render(<ExpenseList onEdit={() => undefined} />);
    });

    expect(container.textContent).toContain("Taxi");

    const taxiRow = [...container.querySelectorAll("li")].find((item) =>
      item.textContent?.includes("Taxi"),
    );
    const taxiDelete = [...(taxiRow?.querySelectorAll("button") ?? [])].find(
      (button) => button.textContent === "Delete",
    );
    expect(taxiDelete).toBeTruthy();

    act(() => {
      taxiDelete?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Deleted Taxi");
    expect(useLedgerStore.getState().ledger.expenses.map((item) => item.id)).toEqual([
      "hotel",
    ]);

    const undo = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === "Undo delete",
    );
    expect(undo).toBeTruthy();

    act(() => {
      undo?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(useLedgerStore.getState().ledger.expenses.map((item) => item.id)).toEqual([
      "hotel",
      "taxi",
    ]);
    expect(container.textContent).toContain("Taxi");
    expect(container.textContent).not.toContain("Deleted Taxi");
  });

  it("keeps the undo banner hittable for at least ten seconds", () => {
    vi.useFakeTimers();

    act(() => {
      root.render(<ExpenseList onEdit={() => undefined} />);
    });

    const taxiRow = [...container.querySelectorAll("li")].find((item) =>
      item.textContent?.includes("Taxi"),
    );
    const taxiDelete = [...(taxiRow?.querySelectorAll("button") ?? [])].find(
      (button) => button.textContent === "Delete",
    );

    act(() => {
      taxiDelete?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(container.textContent).toContain("Undo delete");
    expect(container.textContent).toContain("Deleted Taxi");

    vi.useRealTimers();
  });
});
