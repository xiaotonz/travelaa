import type { Ledger, Member } from "@/types";

export type MemberActionSuccess = {
  ok: true;
  members: Member[];
};

export type MemberActionFailure = {
  ok: false;
  error: string;
};

export type MemberActionResult = MemberActionSuccess | MemberActionFailure;

export function addMember(
  members: Member[],
  rawName: string,
  id: string = crypto.randomUUID(),
): MemberActionResult {
  const name = rawName.trim();

  if (!name) {
    return { ok: false, error: "Enter a member name." };
  }

  const alreadyExists = members.some(
    (member) => member.name.trim().toLowerCase() === name.toLowerCase(),
  );

  if (alreadyExists) {
    return {
      ok: false,
      error: `A member named "${name}" already exists.`,
    };
  }

  return {
    ok: true,
    members: [...members, { id, name }],
  };
}

export function removeMember(
  ledger: Ledger,
  memberId: string,
): MemberActionResult {
  const member = ledger.members.find((item) => item.id === memberId);

  if (!member) {
    return { ok: false, error: "Member not found." };
  }

  // Safer MVP: refuse deletion when the member is on any expense so we
  // never rewrite paidBy/participants or drop historical spend.
  if (isMemberLinkedToExpenses(ledger, memberId)) {
    return {
      ok: false,
      error: `Cannot remove ${member.name} because they are part of existing expenses.`,
    };
  }

  return {
    ok: true,
    members: ledger.members.filter((item) => item.id !== memberId),
  };
}

export function isMemberLinkedToExpenses(
  ledger: Ledger,
  memberId: string,
): boolean {
  return ledger.expenses.some(
    (expense) =>
      expense.paidBy === memberId || expense.participants.includes(memberId),
  );
}
