"use client";

import { useActionState, useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EyeOffIcon, PackageIcon, RefreshCwIcon, SearchIcon, TriangleAlertIcon } from "lucide-react";
import {
  cleanupExpiredAction,
  lendAction,
  refreshHomeboxAction,
  returnLoanAction,
  type LoanResult,
} from "@/app/admin/actions";
import { AvailabilityBadge } from "@/components/shop/availability-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BulkLendBar } from "@/components/admin/bulk-lend-bar";
import { datePresets } from "@/lib/date-presets";
import { cn } from "@/lib/utils";

export type AdminLoanItem = {
  id: string;
  name: string;
  assetId: string;
  thumbUrl: string | null;
  locationPath: string;
  quantity: number;
  available: number;
  status: "available" | "partial" | "unavailable";
  label: string;
  loans: { key: string; quantity: number; until: string; borrower: string | null; active: boolean }[];
  invalid: string[];
  hidden: boolean;
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function normalize(s: string) {
  return s.toLocaleLowerCase("de").normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/** So viele Zeilen auf einmal; danach „Weitere anzeigen“ */
const ADMIN_PAGE_SIZE = 50;

export function LoansManager({ items, today }: { items: AdminLoanItem[]; today: string }) {
  const router = useRouter();
  const [query, setQueryRaw] = useState("");
  const [onlyLent, setOnlyLentRaw] = useState(false);
  const [limit, setLimit] = useState(ADMIN_PAGE_SIZE);
  // Mehrfachauswahl zum gemeinsamen Verleihen (Reihenfolge der Auswahl bleibt erhalten)
  const [picked, setPicked] = useState<string[]>([]);
  const togglePick = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const selected = picked
    .map((id) => byId.get(id))
    .filter((i): i is AdminLoanItem => !!i && i.available > 0)
    .map((i) => ({ id: i.id, name: i.name, available: i.available }));
  // Neue Suche oder neuer Filter fängt wieder oben an
  const setQuery = (v: string) => (setQueryRaw(v), setLimit(ADMIN_PAGE_SIZE));
  const setOnlyLent = (v: boolean) => (setOnlyLentRaw(v), setLimit(ADMIN_PAGE_SIZE));
  const [refreshing, startRefresh] = useTransition();

  const filtered = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    const hasEntries = (it: AdminLoanItem) => it.loans.length > 0 || it.invalid.length > 0;
    return items
      .filter((it) => {
        if (onlyLent && !hasEntries(it)) return false;
        const hay = normalize(`${it.name} ${it.assetId} ${it.locationPath} ${it.loans.map((l) => l.borrower ?? "").join(" ")}`);
        return terms.every((t) => hay.includes(t));
      })
      // Was gerade draußen ist, steht oben
      .sort((a, b) => Number(hasEntries(b)) - Number(hasEntries(a)));
  }, [items, query, onlyLent]);
  // Bekannte Namen als Vorschläge im Feld „An wen“
  const borrowers = useMemo(
    () => [...new Set(items.flatMap((it) => it.loans.map((l) => l.borrower).filter((b): b is string => !!b)))].sort(),
    [items],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Item, Lagerort oder Person…"
            aria-label="Items suchen"
            className="h-11 pl-9 text-base md:h-9 md:text-sm"
          />
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm md:min-h-9">
          <input type="checkbox" checked={onlyLent} onChange={(e) => setOnlyLent(e.target.checked)} className="size-4 accent-primary" />
          Nur mit Verleih-Einträgen
        </label>
        <Button
          variant="outline"
          size="sm"
          className="max-md:h-10"
          disabled={refreshing}
          onClick={() =>
            startRefresh(async () => {
              await refreshHomeboxAction();
              router.refresh();
              toast.success("Aktuellen Stand aus Homebox geladen.");
            })
          }
        >
          <RefreshCwIcon className={cn(refreshing && "animate-spin")} /> Aus Homebox neu laden
        </Button>
      </div>

      <p className="text-sm text-muted-foreground tabular-nums">
        {filtered.length > limit ? `${limit} von ${filtered.length} Items` : `${filtered.length} Items`}
      </p>

      <ul className="divide-y rounded-xl border">
        {filtered.slice(0, limit).map((it) => (
          <LoanRow
            key={it.id}
            item={it}
            today={today}
            borrowers={borrowers}
            picked={picked.includes(it.id)}
            onPick={() => togglePick(it.id)}
          />
        ))}
      </ul>

      <BulkLendBar
        selected={selected}
        onRemove={(id) => setPicked((p) => p.filter((x) => x !== id))}
        onClear={() => setPicked([])}
        today={today}
        borrowers={borrowers}
      />

      {filtered.length > limit && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setLimit((l) => l + ADMIN_PAGE_SIZE)}>
            {filtered.length - limit > ADMIN_PAGE_SIZE
              ? `${ADMIN_PAGE_SIZE} weitere anzeigen`
              : `Restliche ${filtered.length - limit} anzeigen`}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Eine Verleih-Zeile. embedded = auf der öffentlichen Detailseite (nur für Admins): ohne Bild,
 * Name und Status, die stehen dort schon.
 */
export function LoanRow({
  item,
  today,
  borrowers,
  embedded = false,
  picked = false,
  onPick,
}: {
  item: AdminLoanItem;
  today: string;
  borrowers: string[];
  embedded?: boolean;
  /** Mehrfachauswahl (nur in der Liste) */
  picked?: boolean;
  onPick?: () => void;
}) {
  const router = useRouter();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [until, setUntil] = useState("");
  const [busy, startTransition] = useTransition();
  const [, startLend] = useTransition();
  const [lendState, lend, lending] = useActionState<LoanResult, FormData>(async (prev, fd) => {
    const res = await lendAction(prev, fd);
    if (res.ok) {
      toast.success(`${item.name}: ${res.ok}`);
      setOpen(false);
      setUntil("");
      router.refresh();
    }
    return res;
  }, {});

  const run = (fn: () => Promise<LoanResult>, okText: string) =>
    startTransition(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else {
        toast.success(okText);
        router.refresh();
      }
    });
  const Wrapper = embedded ? "div" : "li";
  const presets = datePresets(today);

  const hasExpired = item.loans.some((l) => !l.active);

  return (
    <Wrapper className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start", !embedded && "p-3", busy && "opacity-60")}>
      <div className="flex min-w-0 flex-1 gap-3">
        {onPick && (
          <label className="-my-1 -ml-1 flex size-11 shrink-0 cursor-pointer items-center justify-center self-center md:size-9">
            <input
              type="checkbox"
              checked={picked}
              onChange={onPick}
              disabled={item.available === 0}
              aria-label={`${item.name} auswählen`}
              className="size-4 accent-primary"
            />
          </label>
        )}
        <div className={cn("size-14 shrink-0 overflow-hidden rounded-lg bg-muted", embedded && "hidden")}>
          {item.thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.thumbUrl} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground/60">
              <PackageIcon className="size-6" strokeWidth={1.25} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          {embedded && item.loans.length === 0 && item.invalid.length === 0 && (
            <p className="text-sm text-muted-foreground">Gerade nichts verliehen.</p>
          )}
          <div className={cn("flex flex-wrap items-center gap-2", embedded && "hidden")}>
            <span className="min-w-0 font-medium [overflow-wrap:anywhere]">{item.name}</span>
            {item.hidden && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title="Hat den versteckten Tag, erscheint auf keiner Page">
                <EyeOffIcon className="size-3" /> versteckt
              </span>
            )}
          </div>
          <p className={cn("truncate text-xs text-muted-foreground", embedded && "hidden")}>
            {item.assetId && <span className="font-mono">{item.assetId} · </span>}
            {item.locationPath} · {item.quantity} Stück
          </p>
          {!embedded && <AvailabilityBadge status={item.status} label={item.label} />}

          {(item.loans.length > 0 || item.invalid.length > 0) && (
            <ul className="space-y-1 pt-1">
              {item.loans.map((l) => (
                <li key={l.key} className={cn("flex flex-wrap items-center gap-2 text-sm", !l.active && "text-muted-foreground line-through decoration-muted-foreground/50")}>
                  <span>
                    {l.quantity}× bis {formatDate(l.until)}
                    {l.borrower && <> an <strong className="font-medium">{l.borrower}</strong></>}
                  </span>
                  {!l.active && <span className="text-xs no-underline">(abgelaufen)</span>}
                  <Button
                    variant="outline"
                    size="sm"
                    className="max-md:h-10"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () => returnLoanAction(item.id, l.key),
                        l.active ? `${item.name} ist zurück.` : `Abgelaufener Eintrag bei ${item.name} entfernt.`,
                      )
                    }
                  >
                    {l.active ? "Ist zurück" : "Entfernen"}
                  </Button>
                </li>
              ))}
              {item.invalid.map((raw) => (
                <li key={raw} className="flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-400">
                  <TriangleAlertIcon className="size-3.5" /> Nicht lesbar, bitte in Homebox korrigieren: „{raw}“
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
        {item.available === 0 && !open ? (
          <span className="flex min-h-8 items-center text-sm text-muted-foreground">Alles verliehen</span>
        ) : (
          <Button
            size="sm"
            variant={open ? "secondary" : "outline"}
            className="max-md:h-10"
            disabled={busy}
            onClick={() => setOpen(!open)}
            aria-expanded={open}
          >
            {open ? "Abbrechen" : "Verleihen"}
          </Button>
        )}
        {hasExpired && (
          <Button
            size="sm"
            variant="ghost"
            className="max-md:h-10"
            disabled={busy}
            onClick={() => run(() => cleanupExpiredAction(item.id), `Abgelaufene Einträge bei ${item.name} entfernt.`)}
          >
            Abgelaufene aufräumen
          </Button>
        )}
      </div>

      {open && (
        // onSubmit statt action-Prop: sonst leert React bei Fehlern (z. B. überbucht) alle Felder
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startLend(() => lend(fd));
          }}
          className="flex w-full basis-full flex-wrap items-end gap-3 rounded-lg bg-muted/50 p-3"
        >
          <input type="hidden" name="itemId" value={item.id} />
          <label className="space-y-1 text-sm">
            <span className="block text-muted-foreground">Menge</span>
            <Input name="quantity" type="number" min={1} max={item.available} defaultValue={1} className="h-11 w-20 text-base md:h-9 md:text-sm" required />
          </label>
          <div className="space-y-1 text-sm">
            <label htmlFor={`${listId}-until`} className="block text-muted-foreground">
              Bis einschließlich
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id={`${listId}-until`}
                name="until"
                type="date"
                min={today}
                required
                autoFocus
                value={until}
                onChange={(e) => setUntil(e.target.value)}
                className="h-11 w-40 text-base md:h-9 md:text-sm"
              />
              {presets.map((p) => (
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
          <label className="min-w-40 flex-1 space-y-1 text-sm">
            <span className="block text-muted-foreground">An wen (optional, nicht öffentlich)</span>
            <Input name="borrower" maxLength={80} list={`${listId}-borrowers`} autoComplete="off" className="h-11 text-base md:h-9 md:text-sm" />
            <datalist id={`${listId}-borrowers`}>
              {borrowers.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </label>
          <Button type="submit" size="sm" className="h-11 px-4 md:h-9" disabled={lending}>
            {lending ? "Speichert in Homebox…" : "Eintragen"}
          </Button>
          {lendState.error && (
            <p role="alert" className="basis-full text-sm font-medium text-destructive">
              {lendState.error}
            </p>
          )}
        </form>
      )}
    </Wrapper>
  );
}
