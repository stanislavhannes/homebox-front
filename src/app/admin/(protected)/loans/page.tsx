import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin-guard";
import { getCatalog, getLocationTree } from "@/lib/catalog";
import {
  availabilityLabel,
  computeAvailability,
  formatLoan,
  isActive,
  parseLoans,
  todayInBerlin,
} from "@/lib/loans";
import { getSettings } from "@/lib/pages";
import { imageUrl } from "@/lib/public-view";
import { LoansManager, type AdminLoanItem } from "./loans-manager";

// Prüft die Admin-Session bei jedem Aufruf, darf daher blockieren.
export const instant = false;

export const metadata: Metadata = { title: "Verleih" };

export default async function LoansPage() {
  await requireAdminPage();
  const hiddenTag = getSettings().hiddenTag.trim().toLowerCase();

  let items: AdminLoanItem[] = [];
  let error: string | null = null;
  try {
    const roots = await getLocationTree();
    // leerer hiddenTag: im Admin auch private Items zeigen (werden markiert)
    const catalog = await getCatalog(
      roots.map((r) => r.id),
      "",
    );
    const today = todayInBerlin();
    items = catalog.items.map((it) => {
      const parsed = parseLoans(it.loanText);
      const a = computeAvailability(it.quantity, parsed.loans, today);
      return {
        id: it.id,
        name: it.name,
        assetId: it.assetId,
        thumbUrl: it.thumbId ? imageUrl("_admin", it.id, it.thumbId) : null,
        locationPath: [...it.locationPath, ...(it.containerName ? [it.containerName] : [])].join(" › "),
        quantity: it.quantity,
        available: a.available,
        status: a.status,
        label: availabilityLabel(a, today, true),
        loans: parsed.loans.map((l) => ({
          key: formatLoan(l),
          quantity: l.quantity,
          until: l.until,
          borrower: l.borrower ?? null,
          active: isActive(l, today),
        })),
        invalid: parsed.invalid,
        hidden: !!hiddenTag && it.tags.some((t) => t.toLowerCase() === hiddenTag),
      };
    });
  } catch (err) {
    error = (err as Error).message;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verleih</h1>
        <p className="hidden text-sm text-muted-foreground sm:block">
          Wird direkt in Homebox im Feld „Verleih“ am Item gespeichert. Abgelaufene Einträge zählen automatisch nicht mehr.
        </p>
      </div>
      {error ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Homebox nicht erreichbar: {error}
        </p>
      ) : (
        <LoansManager items={items} today={todayInBerlin()} />
      )}
    </div>
  );
}
