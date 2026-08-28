export interface Member {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string; // ISO
  paidBy: string; // Member.id
  participants: string[]; // Member.id[]
  splitType: "equal" | "custom";
  customShares?: Record<string, number>;
  receiptUrl?: string;
}

export interface Ledger {
  id: string;
  title: string;
  createdAt: string;
  members: Member[];
  expenses: Expense[];
  status: "active" | "settled";
}

export const EXPENSE_CATEGORIES = [
  "Accommodation",
  "Transport",
  "Food",
  "Ticket",
  "Shopping",
  "Entertainment",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
