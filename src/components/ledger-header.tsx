"use client";

import { useRef } from "react";
import Link from "next/link";
import { PencilIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { computeBalances } from "@/lib/balances";
import {
  DEFAULT_LEDGER_TITLE,
  formatSignedAmount,
  isDefaultLedgerTitle,
  memberCountLabel,
} from "@/lib/format";
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

export function LedgerHeader() {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const ledger = useLedgerStore((state) => state.ledger);
  const setTitle = useLedgerStore((state) => state.setTitle);
  const summary = computeBalances(ledger);
  const hasExpenses = ledger.expenses.length > 0;
  const showRenameHint = isDefaultLedgerTitle(ledger.title);

  function handleTitleBlur() {
    if (!ledger.title.trim()) {
      setTitle(DEFAULT_LEDGER_TITLE);
    }
  }

  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          TravelAA
        </p>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {memberCountLabel(ledger.members.length)}
          </p>
          {hasExpenses ? (
            <Button asChild variant="outline" size="sm" className="min-h-11">
              <Link href="/settle">Settle up</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="ledger-title">
            Ledger title
          </label>
          <input
            ref={titleInputRef}
            id="ledger-title"
            name="ledgerTitle"
            value={ledger.title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
            className="-mx-1 min-w-0 flex-1 rounded-lg bg-transparent px-1 text-3xl font-semibold tracking-tight text-foreground underline decoration-muted-foreground/40 decoration-2 underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <button
            type="button"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => titleInputRef.current?.focus()}
            aria-label="Rename trip"
          >
            <PencilIcon className="size-5" />
          </button>
        </div>
        {showRenameHint ? (
          <p className="text-sm text-muted-foreground">
            Tap the title to rename this trip.
          </p>
        ) : null}
      </div>

      {hasExpenses ? (
        <div className="relative">
          <ul
            aria-label="Who is ahead"
            className="flex gap-2 overflow-x-auto pb-1 [mask-image:linear-gradient(to_right,black_calc(100%-1.5rem),transparent)] md:[mask-image:none]"
          >
            {summary.balances.map((balance) => {
              const name =
                ledger.members.find((member) => member.id === balance.memberId)
                  ?.name ?? "Unknown";

              return (
                <li
                  key={balance.memberId}
                  className="flex min-h-11 min-w-[7.5rem] shrink-0 items-center justify-between gap-3 rounded-full border border-border bg-card px-3"
                >
                  <span className="truncate text-sm font-medium">{name}</span>
                  <span
                    className={`text-sm font-semibold tabular-nums ${netClassName(balance.net)}`}
                  >
                    {formatSignedAmount(balance.net)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </header>
  );
}
