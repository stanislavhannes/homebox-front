import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin-guard";
import { getCatalog, getLocationTree } from "@/lib/catalog";
import { toAdminLoanItem } from "@/lib/admin-loans";
import { todayInBerlin } from "@/lib/loans";
import { contactIdsByItem, listContacts } from "@/lib/contacts";
import { getSettings } from "@/lib/pages";
import { LoansManager, type AdminLoanItem, type ContactChoice } from "./loans-manager";

// Prüft die Admin-Session bei jedem Aufruf, darf daher blockieren.
export const instant = false;

export const metadata: Metadata = { title: "Items" };

export default async function LoansPage() {
  await requireAdminPage();
  const hiddenTag = getSettings().hiddenTag;

  const contacts: ContactChoice = {
    options: listContacts().map((c) => ({ id: c.id, name: c.name })),
    byItem: Object.fromEntries(contactIdsByItem()),
  };
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
    items = catalog.items.map((it) => toAdminLoanItem(it, today, hiddenTag));
  } catch (err) {
    error = (err as Error).message;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Items</h1>
        <p className="hidden text-sm text-muted-foreground sm:block">
          Alles aus deinen Homebox-Lagerorten. Verleihe trägst du hier ein, sie landen in Homebox im Feld „Verleih“ und
          zählen nach dem Rückgabedatum automatisch nicht mehr.
        </p>
      </div>
      {error ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Homebox nicht erreichbar: {error}
        </p>
      ) : (
        <LoansManager items={items} today={todayInBerlin()} contacts={contacts} />
      )}
    </div>
  );
}
