"use client";

import { create } from "zustand";

import {
  createEmptyLedger,
  getBrowserStorage,
  loadLedger,
  replaceExpenses as withExpenses,
  replaceMembers as withMembers,
  saveLedger,
  updateLedgerTitle,
  type StorageLike,
} from "@/lib/ledger-storage";
import {
  addExpense as addExpenseToLedger,
  deleteExpense as deleteExpenseFromLedger,
  insertExpenseAt,
  updateExpense as updateExpenseInLedger,
  type ExpenseDraft,
} from "@/lib/expenses";
import {
  addMember as addMemberToList,
  removeMember as removeMemberFromLedger,
} from "@/lib/members";
import type { Expense, Ledger, Member } from "@/types";

export type DeletedExpense = {
  expense: Expense;
  index: number;
};

export type LedgerStore = {
  ledger: Ledger;
  isHydrated: boolean;
  deletedExpense: DeletedExpense | null;
  hydrate: () => void;
  setTitle: (title: string) => void;
  addMember: (name: string) => string | null;
  removeMember: (memberId: string) => string | null;
  addExpense: (draft: ExpenseDraft) => string | null;
  updateExpense: (expenseId: string, draft: ExpenseDraft) => string | null;
  deleteExpense: (expenseId: string) => string | null;
  restoreDeletedExpense: () => string | null;
  dismissDeletedExpense: () => void;
  replaceMembers: (members: Member[]) => void;
  replaceExpenses: (expenses: Expense[]) => void;
  replaceLedger: (ledger: Ledger) => void;
};

export function createLedgerStore(
  storage: StorageLike | null = getBrowserStorage(),
) {
  return create<LedgerStore>((set, get) => ({
    ledger: createEmptyLedger(),
    isHydrated: false,
    deletedExpense: null,
    hydrate() {
      if (get().isHydrated) {
        return;
      }

      set({
        ledger: loadLedger(storage) ?? get().ledger,
        isHydrated: true,
      });
    },
    setTitle(title) {
      const ledger = updateLedgerTitle(get().ledger, title);
      saveLedger(ledger, storage);
      set({ ledger });
    },
    addMember(name) {
      const result = addMemberToList(get().ledger.members, name);
      if (!result.ok) {
        return result.error;
      }

      const ledger = { ...get().ledger, members: result.members };
      saveLedger(ledger, storage);
      set({ ledger });
      return null;
    },
    removeMember(memberId) {
      const result = removeMemberFromLedger(get().ledger, memberId);
      if (!result.ok) {
        return result.error;
      }

      const ledger = { ...get().ledger, members: result.members };
      saveLedger(ledger, storage);
      set({ ledger });
      return null;
    },
    addExpense(draft) {
      const result = addExpenseToLedger(get().ledger, draft);
      if (!result.ok) {
        return result.error;
      }

      const ledger = { ...get().ledger, expenses: result.expenses };
      saveLedger(ledger, storage);
      set({ ledger });
      return null;
    },
    updateExpense(expenseId, draft) {
      const result = updateExpenseInLedger(get().ledger, expenseId, draft);
      if (!result.ok) {
        return result.error;
      }

      const ledger = { ...get().ledger, expenses: result.expenses };
      saveLedger(ledger, storage);
      set({ ledger });
      return null;
    },
    deleteExpense(expenseId) {
      const current = get().ledger;
      const index = current.expenses.findIndex(
        (expense) => expense.id === expenseId,
      );
      const removed = current.expenses[index];
      const result = deleteExpenseFromLedger(current, expenseId);
      if (!result.ok) {
        return result.error;
      }

      const ledger = { ...current, expenses: result.expenses };
      saveLedger(ledger, storage);
      set({
        ledger,
        deletedExpense: removed ? { expense: removed, index } : null,
      });
      return null;
    },
    restoreDeletedExpense() {
      const deleted = get().deletedExpense;
      if (!deleted) {
        return "Nothing to undo.";
      }

      const ledger = withExpenses(
        get().ledger,
        insertExpenseAt(get().ledger.expenses, deleted.expense, deleted.index),
      );
      saveLedger(ledger, storage);
      set({ ledger, deletedExpense: null });
      return null;
    },
    dismissDeletedExpense() {
      set({ deletedExpense: null });
    },
    replaceMembers(members) {
      const ledger = withMembers(get().ledger, members);
      saveLedger(ledger, storage);
      set({ ledger });
    },
    replaceExpenses(expenses) {
      const ledger = withExpenses(get().ledger, expenses);
      saveLedger(ledger, storage);
      set({ ledger });
    },
    replaceLedger(ledger) {
      saveLedger(ledger, storage);
      set({ ledger });
    },
  }));
}

export const useLedgerStore = createLedgerStore();
