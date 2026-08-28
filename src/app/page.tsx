import { LedgerDashboard } from "@/components/ledger-dashboard";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col bg-background px-4 pt-6 pb-[calc(2rem+env(safe-area-inset-bottom))] text-foreground sm:px-6 sm:pt-8">
      <LedgerDashboard />
    </main>
  );
}
