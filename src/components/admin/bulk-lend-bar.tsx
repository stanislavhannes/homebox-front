"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDownIcon, ChevronUpIcon, XIcon } from "lucide-react";
import { lendManyAction, type LendManyResult } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { datePresets } from "@/lib/date-presets";
import { cn } from "@/lib/utils";

export type BulkItem = { id: string; name: string; available: number };

/**
 * Leiste unten für „mehrere zusammen verleihen“ (nur Admin): Auswahl, Mengen, Datum, Empfänger.
 * Wird im Admin (Items) und auf öffentlichen Pages für eingeloggte Admins verwendet.
 */
export function BulkLendBar({
  selected,
  onRemove,
  onClear,
  today,
  borrowers,
}: {
  selected: BulkItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
  today: string;
  borrowers: string[];
}) {
  const router = useRouter();
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [until, setUntil] = useState("");
  const [borrower, setBorrower] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [result, setResult] = useState<LendManyResult | null>(null);
  const [pending, start] = useTransition();
  if (selected.length === 0) return null;

  const failed = new Map((result?.results ?? []).filter((r) => !r.ok).map((r) => [r.itemId, r.message]));

  const submit = () =>
    start(async () => {
      const res = await lendManyAction({
        items: selected.map((s) => ({ itemId: s.id, quantity: qty[s.id] ?? 1 })),
        until,
        borrower,
      });
      setResult(res);
      if (res.ok) {
        toast.success(res.ok);
        setOpen(false);
        setUntil("");
        setBorrower("");
        setQty({});
        setResult(null);
        onClear();
      } else if (res.results?.some((r) => r.ok)) {
        // Erfolgreiche aus der Auswahl nehmen, Fehlgeschlagene bleiben mit Grund stehen
        toast.success(res.error ?? "");
        for (const r of res.results) if (r.ok) onRemove(r.itemId);
      }
      router.refresh();
    });

  return (
    <div
      className="cta-bar admin-theme fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_-8px_rgb(0_0_0/0.15)]"
      role="region"
      aria-label="Auswahl verleihen"
    >
      <div className="mx-auto max-w-6xl px-4">
        {open && (
          <div className="max-h-[60dvh] space-y-4 overflow-y-auto pt-4">
            <ul className="divide-y rounded-lg border">
              {selected.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate font-medium">{s.name}</span>
                  {s.available > 1 && (
                    <label className="flex items-center gap-1.5 text-muted-foreground">
                      Menge
                      <Input
                        type="number"
                        min={1}
                        max={s.available}
                        value={qty[s.id] ?? 1}
                        onChange={(e) => setQty((q) => ({ ...q, [s.id]: Number(e.target.value) }))}
                        className="h-10 w-16 text-base md:h-8 md:text-sm"
                      />
                      <span className="text-xs">von {s.available}</span>
                    </label>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemove(s.id)}
                    aria-label={`${s.name} aus der Auswahl nehmen`}
                    className="flex size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground md:size-8"
                  >
                    <XIcon className="size-4" />
                  </button>
                  {failed.has(s.id) && (
                    <p role="alert" className="basis-full text-xs font-medium text-destructive">
                      {failed.get(s.id)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1 text-sm">
                <label htmlFor={`${uid}-until`} className="block text-muted-foreground">
                  Bis einschließlich
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    id={`${uid}-until`}
                    type="date"
                    min={today}
                    value={until}
                    onChange={(e) => setUntil(e.target.value)}
                    className="h-11 w-40 text-base md:h-9 md:text-sm"
                  />
                  {datePresets(today).map((p) => (
                    <Button
                      key={p.label}
                      type="button"
                      size="sm"
                      variant={until === p.value ? "secondary" : "ghost"}
                      className="max-md:h-10"
                      onClick={() => setUntil(p.value)}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="min-w-48 flex-1 space-y-1 text-sm">
                <label htmlFor={`${uid}-borrower`} className="block text-muted-foreground">
                  An wen (optional, nicht öffentlich)
                </label>
                <Input
                  id={`${uid}-borrower`}
                  value={borrower}
                  onChange={(e) => setBorrower(e.target.value)}
                  maxLength={80}
                  list={`${uid}-borrowers`}
                  autoComplete="off"
                  className="h-11 text-base md:h-9 md:text-sm"
                />
                <datalist id={`${uid}-borrowers`}>
                  {borrowers.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
            </div>
            {result?.error && !result.results?.some((r) => r.ok) && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {result.error}
              </p>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="flex min-h-10 items-center gap-1.5 text-sm font-medium"
          >
            {open ? <ChevronDownIcon className="size-4" /> : <ChevronUpIcon className="size-4" />}
            {selected.length} ausgewählt
          </button>
          <Button variant="ghost" size="sm" className="max-md:h-10" onClick={onClear} disabled={pending}>
            Auswahl leeren
          </Button>
          <div className="ml-auto">
            {open ? (
              <Button className={cn("h-11 px-4 md:h-9")} onClick={submit} disabled={pending || !until}>
                {pending ? "Speichert in Homebox…" : `${selected.length} verleihen`}
              </Button>
            ) : (
              <Button className="h-11 px-4 md:h-9" onClick={() => setOpen(true)}>
                Zusammen verleihen
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
