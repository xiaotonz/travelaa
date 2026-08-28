"use client";

import { ExpenseForm } from "@/components/expense-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Expense } from "@/types";

type AddExpenseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
};

export function AddExpenseDialog({
  open,
  onOpenChange,
  expense = null,
}: AddExpenseDialogProps) {
  const isEditing = Boolean(expense);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit expense" : "Add expense"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this expense. Changes stay on this device."
              : "Record what was spent. It is saved on this device."}
          </DialogDescription>
        </DialogHeader>
        <ExpenseForm
          key={expense?.id ?? "new-expense"}
          embedded
          expense={expense}
          onSaved={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
