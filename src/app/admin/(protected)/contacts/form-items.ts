import "server-only";
import { adminLocationPath } from "@/lib/admin-loans";
import { getCatalog, getLocationTree } from "@/lib/catalog";
import { contactIdsByItem, listContacts } from "@/lib/contacts";
import type { ContactFormItem } from "./contact-form";

/** Alle Items für die Checkliste im Formular, dazu die aktuell diesem Ansprechpartner zugewiesenen */
export async function loadContactFormItems(
  contactId: number | null,
): Promise<{ items: ContactFormItem[]; assigned: string[]; homeboxError?: string }> {
  const byItem = contactIdsByItem();
  const names = new Map(listContacts().map((c) => [c.id, c.name]));
  const assigned = [...byItem].filter(([, cid]) => cid === contactId).map(([itemId]) => itemId);
  try {
    const roots = await getLocationTree();
    // leerer hiddenTag: auch private Items zuweisen können
    const catalog = await getCatalog(roots.map((r) => r.id), "");
    const items = catalog.items
      .map((it) => {
        const owner = byItem.get(it.id);
        return {
          id: it.id,
          name: it.name,
          locationPath: adminLocationPath(it),
          owner: owner !== undefined && owner !== contactId ? (names.get(owner) ?? null) : null,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "de"));
    // Items, die es in Homebox nicht mehr gibt, fallen beim nächsten Speichern weg
    const known = new Set(items.map((it) => it.id));
    return { items, assigned: assigned.filter((id) => known.has(id)) };
  } catch (err) {
    // Ohne Katalog alle Zuweisungen behalten, damit Speichern nichts verliert
    return { items: [], assigned, homeboxError: `Items konnten nicht geladen werden: ${(err as Error).message}` };
  }
}
