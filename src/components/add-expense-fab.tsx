"use client";

import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type AddExpenseFabProps = {
  onClick: () => void;
};

export function AddExpenseFab({ onClick }: AddExpenseFabProps) {
  return (
    <div className="flex justify-end">
      <Button
        type="button"
        onClick={onClick}
        className="h-14 min-h-11 rounded-full px-5 shadow-sm"
      >
        <PlusIcon data-icon="inline-start" />
        Add expense
      </Button>
    </div>
  );
}
