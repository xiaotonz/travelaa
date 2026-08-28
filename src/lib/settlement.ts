import type { MemberBalance } from "@/lib/balances";

export const SETTLEMENT_EPSILON = 0.01;

export type Transfer = {
  from: string;
  to: string;
  amount: number;
};

export type SettlementPlan = {
  before: Transfer[];
  after: Transfer[];
  reducedFrom: number;
  reducedTo: number;
};

export type SettlementHeadline = {
  title: string;
  subtitle: string;
};

export function settlementHeadline(
  reducedFrom: number,
  reducedTo: number,
): SettlementHeadline {
  if (reducedFrom === 0 && reducedTo === 0) {
    return {
      title: "Nothing to settle",
      subtitle: "No transfers are required right now.",
    };
  }

  if (reducedFrom > reducedTo) {
    return {
      title: `Transactions reduced from ${reducedFrom} to ${reducedTo}`,
      subtitle: "Fewer payments mean a simpler way to settle.",
    };
  }

  const paymentLabel = reducedTo === 1 ? "1 payment" : `${reducedTo} payments`;
  return {
    title: `Already the simplest path — ${paymentLabel}`,
    subtitle: "Before and after use the same number of transfers.",
  };
}

export function settleBalances(balances: MemberBalance[]): SettlementPlan {
  const before = naiveProportionalTransfers(balances);
  const after = greedyTransfers(balances);

  return {
    before,
    after,
    reducedFrom: before.length,
    reducedTo: after.length,
  };
}

/**
 * BEFORE (naive / raw paths): every debtor pays every creditor a proportional
 * slice of their debt. The slice is `debt * (credit / totalCredit)`.
 *
 * This is a complete bipartite set of transfers — not minimized — so later UI
 * can contrast this "original suggestion" with the greedy after-path.
 */
function naiveProportionalTransfers(balances: MemberBalance[]): Transfer[] {
  const debtors = balances.filter((item) => item.net < -SETTLEMENT_EPSILON);
  const creditors = balances.filter((item) => item.net > SETTLEMENT_EPSILON);
  const totalCredit = creditors.reduce((sum, item) => sum + item.net, 0);

  if (debtors.length === 0 || creditors.length === 0 || totalCredit <= 0) {
    return [];
  }

  const transfers: Transfer[] = [];

  for (const debtor of debtors) {
    const debt = Math.abs(debtor.net);

    for (const creditor of creditors) {
      const amount = debt * (creditor.net / totalCredit);
      if (amount > SETTLEMENT_EPSILON) {
        transfers.push({
          from: debtor.memberId,
          to: creditor.memberId,
          amount,
        });
      }
    }
  }

  return transfers;
}

/**
 * AFTER (greedy debt simplification): repeatedly match the current largest
 * debtor with the current largest creditor and transfer min(|debt|, credit)
 * until remaining nets are within epsilon of zero.
 */
function greedyTransfers(balances: MemberBalance[]): Transfer[] {
  const nets = new Map(
    balances.map((item) => [item.memberId, item.net] as const),
  );
  const transfers: Transfer[] = [];

  while (true) {
    const debtor = pickExtreme(nets, "debtor");
    const creditor = pickExtreme(nets, "creditor");

    if (!debtor || !creditor) {
      break;
    }

    const amount = Math.min(Math.abs(debtor.net), creditor.net);
    if (amount <= SETTLEMENT_EPSILON) {
      break;
    }

    transfers.push({
      from: debtor.memberId,
      to: creditor.memberId,
      amount,
    });

    nets.set(debtor.memberId, debtor.net + amount);
    nets.set(creditor.memberId, creditor.net - amount);
  }

  return transfers;
}

function pickExtreme(
  nets: Map<string, number>,
  role: "debtor" | "creditor",
): { memberId: string; net: number } | null {
  let picked: { memberId: string; net: number } | null = null;

  for (const [memberId, net] of nets) {
    if (role === "debtor" && net >= -SETTLEMENT_EPSILON) {
      continue;
    }
    if (role === "creditor" && net <= SETTLEMENT_EPSILON) {
      continue;
    }

    if (!picked) {
      picked = { memberId, net };
      continue;
    }

    const isBetter =
      role === "debtor"
        ? net < picked.net ||
          (net === picked.net && memberId < picked.memberId)
        : net > picked.net ||
          (net === picked.net && memberId < picked.memberId);

    if (isBetter) {
      picked = { memberId, net };
    }
  }

  return picked;
}
