import "server-only";
import type { AdminLoanItem } from "@/app/admin/(protected)/items/loans-manager";
import type { CatalogItem } from "@/lib/catalog";
import { availabilityLabel, computeAvailability, formatLoan, isActive, parseLoans } from "@/lib/loans";
import { imageUrl } from "@/lib/public-view";

/** Item für die Verleih-Verwaltung aufbereiten. Enthält Empfänger: nur an Admins ausliefern. */
export function toAdminLoanItem(it: CatalogItem, today: string, hiddenTag: string): AdminLoanItem {
  const parsed = parseLoans(it.loanText);
  const a = computeAvailability(it.quantity, parsed.loans, today);
  const tag = hiddenTag.trim().toLowerCase();
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
    hidden: !!tag && it.tags.some((t) => t.toLowerCase() === tag),
  };
}

/** Bisher eingetragene Namen, als Vorschläge im Feld „An wen“ */
export function knownBorrowers(items: CatalogItem[]): string[] {
  const names = new Set<string>();
  for (const it of items) for (const l of parseLoans(it.loanText).loans) if (l.borrower) names.add(l.borrower);
  return [...names].sort((a, b) => a.localeCompare(b, "de"));
}
