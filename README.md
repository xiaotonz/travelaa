# TravelAA / SplitViz

TravelAA is a group travel expense splitter. Friends add a trip ledger, record who paid for what, and see who is ahead or behind.

SplitViz is the settlement view. Most split apps only list a final “who pays whom.” TravelAA also shows the **before** path (a naive set of transfers) next to the **after** path (a greedy simplification). The headline says *Transactions reduced from X to Y* only when the count actually drops.

All data stays in the browser (`localStorage`). There is no login and no backend.

## Features

- Create a trip ledger and rename it in place
- Add and remove virtual members by name (no accounts)
- Record expenses with amount, description, category, date, payer, and participants
- Equal split or custom per-person shares
- Optional on-device receipt preview (stored as a data URL)
- Per-member Paid / Should pay / Net balances
- Category spend overview with labeled bars
- Settlement page with before/after transfer rows
- Optimal transfer list after simplification
- Works offline after the first load; no environment variables required

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Zustand + `localStorage` persistence
- Labeled category bars and settlement transfer rows
- Vitest for unit tests

## Run locally

```bash
git clone https://github.com/xiaotonz/travelaa.git
cd travelaa
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful scripts:

```bash
npm test
npm run build
npm run start
```

## Deploy on Vercel

1. Import the GitHub repository `xiaotonz/travelaa` in the Vercel dashboard (or `vercel` CLI).
2. Framework preset: **Next.js**.
3. Leave build settings at the defaults (`npm install`, `npm run build`).
4. Do **not** add environment variables. The app does not need secrets, a database, or a server API.
5. Deploy. The production site is a static/SSR Next.js app that writes ledgers only in each visitor’s browser.

## Data model

One current ledger is stored under `travelaa.ledger`.

```ts
Member { id, name }

Expense {
  id
  amount
  description
  category            // Accommodation | Transport | Food | Ticket | Shopping | Entertainment | Other
  date                // ISO
  paidBy              // Member.id
  participants        // Member.id[]
  splitType           // 'equal' | 'custom'
  customShares?       // Record<Member.id, number>
  receiptUrl?         // optional local data URL
}

Ledger {
  id
  title
  createdAt
  members
  expenses
  status              // 'active' | 'settled'
}
```

Balances (pure functions in `src/lib/balances.ts`):

- **Paid** — sum of expenses the member paid
- **Should pay (owed)** — their share of expenses they joined (equal: `amount / participants.length`; custom: `customShares[id]`)
- **Net** — `paid - owed` (positive = creditor, negative = debtor)

## How settlement before / after works

The settle page (`/settle`) calls `settleBalances()` in `src/lib/settlement.ts`. It does not re-run the math in the UI.

1. Compute each member’s net.
2. Split **debtors** (`net < 0`) and **creditors** (`net > 0`).
3. **Before (naive paths)** — every debtor pays every creditor a proportional slice:

   `amount = |debt| * (credit / totalCredit)`

   This is a complete bipartite graph of transfers. It clears the books but is usually too many arrows.
4. **After (greedy simplification)** — repeatedly pair the current largest debtor with the current largest creditor and transfer `min(|debt|, credit)` until remaining nets are within a small epsilon (~0.01).
5. The page draws both graphs (payers on the left, receivers on the right) and lists the optimal “who pays whom how much” path. The metric is `reducedFrom` → `reducedTo`.

## License

Private project unless otherwise stated.
