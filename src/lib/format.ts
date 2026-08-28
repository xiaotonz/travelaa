export const DEFAULT_LEDGER_TITLE = "Untitled ledger";

export function formatAmount(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatSignedAmount(amount: number): string {
  if (Math.abs(amount) < 0.005) {
    return "$0.00";
  }

  return amount > 0 ? `+$${amount.toFixed(2)}` : `-$${Math.abs(amount).toFixed(2)}`;
}

export function memberCountLabel(count: number): string {
  return count === 1 ? "1 member" : `${count} members`;
}

export function isDefaultLedgerTitle(title: string): boolean {
  return title.trim().toLowerCase() === DEFAULT_LEDGER_TITLE.toLowerCase();
}

export function formatExpenseDate(isoDate: string): string {
  const match = isoDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return isoDate;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const local = new Date(year, month - 1, day);
  if (Number.isNaN(local.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(local);
}

export function memberNamesById(
  members: { id: string; name: string }[],
): Record<string, string> {
  return Object.fromEntries(members.map((member) => [member.id, member.name]));
}
