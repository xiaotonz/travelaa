import { SettlementView } from "@/components/settlement-view";

export default function SettlePage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col bg-background px-4 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-foreground sm:px-6 sm:pt-8 md:max-w-4xl">
      <SettlementView />
    </main>
  );
}
