"use client";

import { useEffect, useId, useState, type FormEvent } from "react";

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
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLedgerStore } from "@/store/ledger-store";

function MemberForm({
  name,
  setName,
  error,
  errorId,
  inputId,
  onSubmit,
  compact = false,
}: {
  name: string;
  setName: (value: string) => void;
  error: string | null;
  errorId: string;
  inputId: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  compact?: boolean;
}) {
  return (
    <form
      className={
        compact
          ? "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
          : "flex flex-col gap-3"
      }
      onSubmit={onSubmit}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Label htmlFor={inputId}>Member name</Label>
        <Input
          id={inputId}
          name="memberName"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Alex"
          autoComplete="off"
          className="min-h-11"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
      </div>
      <Button type="submit" className="min-h-11 w-full sm:w-auto">
        Add member
      </Button>
      {error ? (
        <p id={errorId} className="text-sm text-destructive sm:col-span-2" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

export function MembersSection() {
  const inputId = useId();
  const errorId = useId();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const members = useLedgerStore((state) => state.ledger.members);
  const isHydrated = useLedgerStore((state) => state.isHydrated);
  const hydrate = useLedgerStore((state) => state.hydrate);
  const addMember = useLedgerStore((state) => state.addMember);
  const removeMember = useLedgerStore((state) => state.removeMember);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextError = addMember(name);
    setError(nextError);

    if (!nextError) {
      setName("");
    }
  }

  function handleRemove(memberId: string) {
    setError(removeMember(memberId));
  }

  if (!isHydrated) {
    return null;
  }

  const form = (
    <MemberForm
      name={name}
      setName={setName}
      error={error}
      errorId={errorId}
      inputId={inputId}
      onSubmit={handleSubmit}
      compact={members.length >= 2}
    />
  );

  if (members.length < 2) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Add people</CardTitle>
          <CardDescription>
            Start with names. No login is required.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {form}
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add the first person on this trip.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-3 text-sm font-medium"
                >
                  {member.name}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <section
        aria-labelledby="members-heading"
        className="flex flex-col gap-3"
      >
        <div className="flex items-center justify-between gap-3">
          <h2
            id="members-heading"
            className="flex min-h-11 items-center text-sm font-medium"
          >
            People
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11 px-4"
            onClick={() => setSheetOpen(true)}
          >
            Manage
          </Button>
        </div>
        <ul className="flex flex-wrap gap-2">
          {members.map((member) => (
            <li
              key={member.id}
              className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-3 text-sm font-medium"
            >
              {member.name}
            </li>
          ))}
        </ul>
        {form}
      </section>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Members</SheetTitle>
            <SheetDescription>
              Add or remove people on this trip. No login is required.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4 pb-6">
            <Separator />
            <ul className="flex flex-col gap-2">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
                >
                  <span className="min-w-0 truncate font-medium">
                    {member.name}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-11 px-4"
                    onClick={() => handleRemove(member.id)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
