import type { Expense, Ledger, Member } from "@/types";

export const LEDGER_STORAGE_KEY = "travelaa.ledger";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    // Some browsers throw in private mode when localStorage is disabled.
    return null;
  }
}

export function createEmptyLedger(title = "Untitled ledger"): Ledger {
  return {
    id: crypto.randomUUID(),
    title,
    createdAt: new Date().toISOString(),
    members: [],
    expenses: [],
    status: "active",
  };
}

export function loadLedger(
  storage: StorageLike | null = getBrowserStorage(),
): Ledger | null {
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(LEDGER_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    return isLedger(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveLedger(
  ledger: Ledger,
  storage: StorageLike | null = getBrowserStorage(),
): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(ledger));
    return true;
  } catch {
    return false;
  }
}

export function updateLedgerTitle(ledger: Ledger, title: string): Ledger {
  return { ...ledger, title };
}

export function replaceMembers(ledger: Ledger, members: Member[]): Ledger {
  const nextMembers = members.map(cloneMember);
  const memberIds = new Set(nextMembers.map((member) => member.id));

  return {
    ...ledger,
    members: nextMembers,
    // Keep paidBy history, but drop shares/participants for removed members.
    expenses: ledger.expenses.map((expense) =>
      sanitizeExpense(expense, memberIds),
    ),
  };
}

export function replaceExpenses(ledger: Ledger, expenses: Expense[]): Ledger {
  const memberIds = new Set(ledger.members.map((member) => member.id));

  return {
    ...ledger,
    expenses: expenses.map((expense) =>
      memberIds.size > 0
        ? sanitizeExpense(expense, memberIds)
        : cloneExpense(expense),
    ),
  };
}

function cloneMember(member: Member): Member {
  return { id: member.id, name: member.name };
}

function cloneExpense(expense: Expense): Expense {
  return {
    ...expense,
    participants: [...expense.participants],
    customShares: expense.customShares
      ? { ...expense.customShares }
      : undefined,
  };
}

function sanitizeExpense(expense: Expense, memberIds: Set<string>): Expense {
  const next = cloneExpense(expense);
  next.participants = next.participants.filter((id) => memberIds.has(id));

  if (next.customShares) {
    next.customShares = Object.fromEntries(
      Object.entries(next.customShares).filter(([id]) => memberIds.has(id)),
    );
  }

  return next;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMember(value: unknown): value is Member {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string"
  );
}

function isExpense(value: unknown): value is Expense {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.amount !== "number" ||
    !Number.isFinite(value.amount) ||
    typeof value.description !== "string" ||
    typeof value.category !== "string" ||
    typeof value.date !== "string" ||
    typeof value.paidBy !== "string" ||
    (value.splitType !== "equal" && value.splitType !== "custom")
  ) {
    return false;
  }

  if (
    !Array.isArray(value.participants) ||
    !value.participants.every((id) => typeof id === "string")
  ) {
    return false;
  }

  if (
    value.customShares !== undefined &&
    !isCustomShares(value.customShares)
  ) {
    return false;
  }

  if (value.receiptUrl !== undefined && typeof value.receiptUrl !== "string") {
    return false;
  }

  return true;
}

function isCustomShares(value: unknown): value is Record<string, number> {
  return (
    isRecord(value) &&
    Object.values(value).every(
      (share) => typeof share === "number" && Number.isFinite(share),
    )
  );
}

function isLedger(value: unknown): value is Ledger {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.createdAt === "string" &&
    (value.status === "active" || value.status === "settled") &&
    Array.isArray(value.members) &&
    value.members.every(isMember) &&
    Array.isArray(value.expenses) &&
    value.expenses.every(isExpense)
  );
}
