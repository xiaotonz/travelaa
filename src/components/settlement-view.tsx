"use client";

import { useEffect } from "react";
import Link from "next/link";

import { SettlementTransferRows } from "@/components/settlement-transfer-rows";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { computeBalances } from "@/lib/balances";
import { formatAmount, formatSignedAmount, memberNamesById } from "@/lib/format";
import { settleBalances, settlementHeadline } from "@/lib/settlement";
import { useLedgerStore } from "@/store/ledger-store";

function netClassName(net: number): string {
  if (net > 0.005) {
    return "text-[#3f6f64]";
  }
  if (net < -0.005) {
    return "text-[#9a4d4d]";
  }
  return "text-muted-foreground";
}

export function SettlementView() {
  const ledger = useLedgerStore((state) => state.ledger);
  const hydrate = useLedgerStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const summary = computeBalances(ledger);
  const plan = settleBalances(summary.balances);
  const names = memberNamesById(ledger.members);
  const headline = settlementHeadline(plan.reducedFrom, plan.reducedTo);
  const reduced = plan.reducedFrom > plan.reducedTo;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          TravelAA
        </p>
        <Button asChild variant="outline" size="sm" className="min-h-11">
          <Link href="/">Back to ledger</Link>
        </Button>
      </div>

      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Settle up</h1>
        <p className="text-sm text-muted-foreground">
          Compare the naive routes with the greedy path. Who pays whom stays
          readable either way.
        </p>
      </header>

      {ledger.members.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add people and expenses on the ledger first.
        </p>
      ) : (
        <ul className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-3 md:overflow-visible">
          {summary.balances.map((balance) => {
            const name = names[balance.memberId] ?? "Unknown";
            return (
              <li
                key={balance.memberId}
                className="min-w-[10.5rem] shrink-0 rounded-xl border border-border bg-card p-3"
              >
                <p className="truncate font-medium">{name}</p>
                <dl className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Paid</dt>
                    <dd className="tabular-nums">{formatAmount(balance.paid)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Should pay</dt>
                    <dd className="tabular-nums">{formatAmount(balance.owed)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Net</dt>
                    <dd
                      className={`tabular-nums font-medium ${netClassName(balance.net)}`}
                    >
                      {formatSignedAmount(balance.net)}
                    </dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>
      )}

      <section
        aria-labelledby="reduction-heading"
        className="rounded-xl border border-border bg-card px-4 py-5 text-center"
      >
        <h2
          id="reduction-heading"
          className="text-xl font-semibold tracking-tight text-balance"
        >
          {headline.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{headline.subtitle}</p>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Before</CardTitle>
            <CardDescription>
              Naive routes — every debtor pays every creditor a slice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettlementTransferRows transfers={plan.before} names={names} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>After</CardTitle>
            <CardDescription>
              {reduced
                ? "Greedy path — largest debts meet largest credits first."
                : "Greedy path — largest debts meet largest credits first. Same count as the naive routes."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettlementTransferRows transfers={plan.after} names={names} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
