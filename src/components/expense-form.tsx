"use client";

import { useEffect, useId, useState, type ChangeEvent, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  customShareProgress,
  todayInputValue,
  toDateInputValue,
  type ExpenseDraft,
} from "@/lib/expenses";
import { formatAmount } from "@/lib/format";
import { useLedgerStore } from "@/store/ledger-store";
import { EXPENSE_CATEGORIES, type Expense, type ExpenseCategory } from "@/types";

type ExpenseFormProps = {
  embedded?: boolean;
  expense?: Expense | null;
  onSaved?: () => void;
};

function formStateFromExpense(expense: Expense | null) {
  if (!expense) {
    return {
      amount: "",
      description: "",
      category: "Food" as ExpenseCategory,
      date: todayInputValue(),
      paidBy: null as string | null,
      participants: null as string[] | null,
      splitType: "equal" as ExpenseDraft["splitType"],
      customShares: {} as Record<string, string>,
      receiptUrl: undefined as string | undefined,
      receiptName: null as string | null,
    };
  }

  return {
    amount: String(expense.amount),
    description: expense.description,
    category: EXPENSE_CATEGORIES.includes(expense.category as ExpenseCategory)
      ? (expense.category as ExpenseCategory)
      : ("Other" as ExpenseCategory),
    date: toDateInputValue(expense.date),
    paidBy: expense.paidBy,
    participants: expense.participants,
    splitType: expense.splitType,
    customShares: Object.fromEntries(
      Object.entries(expense.customShares ?? {}).map(([id, value]) => [
        id,
        String(value),
      ]),
    ),
    receiptUrl: expense.receiptUrl,
    receiptName: expense.receiptUrl ? "Attached image" : null,
  };
}

export function ExpenseForm({
  embedded = false,
  expense = null,
  onSaved,
}: ExpenseFormProps) {
  const errorId = useId();
  const amountId = useId();
  const descriptionId = useId();
  const dateId = useId();
  const receiptId = useId();

  const members = useLedgerStore((state) => state.ledger.members);
  const hydrate = useLedgerStore((state) => state.hydrate);
  const addExpense = useLedgerStore((state) => state.addExpense);
  const updateExpense = useLedgerStore((state) => state.updateExpense);

  const initial = formStateFromExpense(expense);
  const [amount, setAmount] = useState(initial.amount);
  const [description, setDescription] = useState(initial.description);
  const [category, setCategory] = useState<ExpenseCategory>(initial.category);
  const [date, setDate] = useState(initial.date);
  const [paidBy, setPaidBy] = useState<string | null>(initial.paidBy);
  const [participants, setParticipants] = useState<string[] | null>(
    initial.participants,
  );
  const [splitType, setSplitType] = useState<ExpenseDraft["splitType"]>(
    initial.splitType,
  );
  const [customShares, setCustomShares] = useState<Record<string, string>>(
    initial.customShares,
  );
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(
    initial.receiptUrl,
  );
  const [receiptName, setReceiptName] = useState<string | null>(
    initial.receiptName,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const resolvedPaidBy =
    paidBy && members.some((member) => member.id === paidBy)
      ? paidBy
      : (members[0]?.id ?? "");
  const resolvedParticipants =
    participants === null
      ? members.map((member) => member.id)
      : participants.filter((id) =>
          members.some((member) => member.id === id),
        );

  const shareProgress = customShareProgress(
    amount,
    customShares,
    resolvedParticipants,
  );
  const customBlocked = splitType === "custom" && !shareProgress.balanced;

  function toggleParticipant(memberId: string) {
    const next = resolvedParticipants.includes(memberId)
      ? resolvedParticipants.filter((id) => id !== memberId)
      : [...resolvedParticipants, memberId];
    setParticipants(next);
  }

  function handleReceiptChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setReceiptUrl(undefined);
      setReceiptName(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      event.target.value = "";
      return;
    }

    setReceiptName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setReceiptUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const draft: ExpenseDraft = {
      amount,
      description,
      category,
      date,
      paidBy: resolvedPaidBy,
      participants: resolvedParticipants,
      splitType,
      customShares,
      receiptUrl,
    };

    const nextError = expense
      ? updateExpense(expense.id, draft)
      : addExpense(draft);
    setError(nextError);

    if (!nextError) {
      onSaved?.();
    }
  }

  const canSubmit = members.length > 0 && !customBlocked;
  const remainingLabel =
    shareProgress.remaining >= 0
      ? `${formatAmount(shareProgress.remaining)} left`
      : `${formatAmount(Math.abs(shareProgress.remaining))} over`;

  const form = (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor={amountId}>Amount</Label>
            <Input
              id={amountId}
              name="expenseAmount"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              required
              className="min-h-11"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={descriptionId}>Description</Label>
            <Input
              id={descriptionId}
              name="expenseDescription"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Dinner, taxi, tickets..."
              required
              className="min-h-11"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="expenseCategory"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as ExpenseCategory)
              }
              className="min-h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {EXPENSE_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={dateId}>Date</Label>
            <Input
              id={dateId}
              name="expenseDate"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              className="min-h-11"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="paidBy">Paid by</Label>
            <Select
              value={resolvedPaidBy || undefined}
              onValueChange={setPaidBy}
              disabled={!canSubmit && members.length === 0}
            >
              <SelectTrigger id="paidBy" className="min-h-11 w-full">
                <SelectValue placeholder="Add a member first" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Participants</legend>
            {members.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="min-h-11"
                  onClick={() =>
                    setParticipants(members.map((member) => member.id))
                  }
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => setParticipants([])}
                >
                  Select none
                </Button>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {members.map((member) => {
                const selected = resolvedParticipants.includes(member.id);
                return (
                  <Button
                    key={member.id}
                    type="button"
                    size="sm"
                    className="min-h-11"
                    variant={selected ? "default" : "outline"}
                    aria-pressed={selected}
                    onClick={() => toggleParticipant(member.id)}
                  >
                    {member.name}
                  </Button>
                );
              })}
            </div>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Add at least one member before recording an expense.
              </p>
            ) : null}
          </fieldset>

          <div className="flex flex-col gap-2">
            <Label>Split type</Label>
            <Tabs
              value={splitType}
              onValueChange={(value) =>
                setSplitType(value as ExpenseDraft["splitType"])
              }
            >
              <TabsList className="w-full">
                <TabsTrigger value="equal">Equal</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {splitType === "custom" ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                Assigned{" "}
                {formatAmount(shareProgress.assigned)} of{" "}
                {shareProgress.target === null
                  ? "$—"
                  : formatAmount(shareProgress.target)}{" "}
                · {remainingLabel}
              </p>
              {resolvedParticipants.map((participantId) => {
                const member = members.find((item) => item.id === participantId);
                if (!member) {
                  return null;
                }

                const shareId = `${receiptId}-${participantId}`;
                return (
                  <div key={participantId} className="flex flex-col gap-2">
                    <Label htmlFor={shareId}>{member.name} share</Label>
                    <Input
                      id={shareId}
                      name={`share-${participantId}`}
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={customShares[participantId] ?? ""}
                      onChange={(event) =>
                        setCustomShares((current) => ({
                          ...current,
                          [participantId]: event.target.value,
                        }))
                      }
                      placeholder="0.00"
                      className="min-h-11"
                    />
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor={receiptId}>Receipt (optional)</Label>
            <input
              id={receiptId}
              name="receipt"
              type="file"
              accept="image/*"
              onChange={handleReceiptChange}
              className="sr-only"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => document.getElementById(receiptId)?.click()}
              >
                {receiptUrl ? "Replace image" : "Attach image"}
              </Button>
              <span className="text-sm text-muted-foreground">
                {receiptName ?? "JPG or PNG"}
              </span>
            </div>
            {receiptUrl ? (
              // Data-URL preview is local-only; next/image cannot optimize it.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={receiptUrl}
                alt="Receipt preview"
                className="max-h-40 w-full rounded-lg border border-border object-contain"
              />
            ) : null}
          </div>

          {error ? (
            <p id={errorId} className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            className="min-h-11 w-full sm:w-auto"
            disabled={!canSubmit}
          >
            {expense ? "Save changes" : "Save expense"}
          </Button>
        </form>
  );

  if (embedded) {
    return form;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{expense ? "Edit expense" : "Add expense"}</CardTitle>
        <CardDescription>
          Record what was spent. It is saved on this device.
        </CardDescription>
      </CardHeader>
      <CardContent>{form}</CardContent>
    </Card>
  );
}
