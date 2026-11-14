import "server-only";
import { CONTACT_NAME_MAX, CONTACT_NOTE_MAX, parseContactFields, type ContactFields } from "./contact";
import { db } from "./db";
import type { PageConfig } from "./pages";

/** Ansprechpartner, der einzelnen Items statt des Page-Kontakts zugewiesen werden kann */
export type ItemContact = { id: number; name: string; fields: ContactFields; note: string };
export type ContactInput = Omit<ItemContact, "id">;

export function parseContactInput(raw: {
  name: string;
  telegram: string;
  mail: string;
  phone: string;
  note: string;
}): { value: ContactInput } | { error: string } {
  const name = raw.name.trim().slice(0, CONTACT_NAME_MAX);
  if (!name) return { error: "Bitte einen Namen angeben." };
  const parsed = parseContactFields(raw);
  if ("error" in parsed) return parsed;
  const { telegram, mail, phone } = parsed.fields;
  if (!telegram && !mail && !phone) return { error: "Bitte mindestens Telegram, Mail oder Telefon angeben." };
  return { value: { name, fields: parsed.fields, note: raw.note.trim().slice(0, CONTACT_NOTE_MAX) } };
}

/**
 * Kontakt, der für ein Item gilt: der zugewiesene Ansprechpartner (seine Felder und sein Hinweis ersetzen
 * Page-Felder und „Weitere Hinweise“) oder sonst der Kontakt der Page.
 */
export function effectiveContact(
  page: Pick<PageConfig, "contactFields" | "contact">,
  person: ItemContact | null,
): { fields: ContactFields; freeText: string; personName: string | null } {
  if (!person) return { fields: page.contactFields, freeText: page.contact, personName: null };
  return { fields: person.fields, freeText: person.note, personName: person.name };
}

// ---------- Datenbank ----------

type Row = { id: number; name: string; telegram: string; mail: string; phone: string; note: string };

function fromRow(r: Row): ItemContact {
  return { id: r.id, name: r.name, fields: { telegram: r.telegram, mail: r.mail, phone: r.phone }, note: r.note };
}

export function listContacts(): (ItemContact & { itemCount: number })[] {
  const rows = db()
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM item_contacts ic WHERE ic.contact_id = c.id) AS item_count
       FROM contacts c ORDER BY c.name COLLATE NOCASE`,
    )
    .all() as (Row & { item_count: number })[];
  return rows.map((r) => ({ ...fromRow(r), itemCount: r.item_count }));
}

export function getContact(id: number): ItemContact | null {
  const row = db().prepare("SELECT * FROM contacts WHERE id = ?").get(id) as Row | undefined;
  return row ? fromRow(row) : null;
}

export function createContact(v: ContactInput): number {
  const res = db()
    .prepare("INSERT INTO contacts (name, telegram, mail, phone, note) VALUES (?, ?, ?, ?, ?)")
    .run(v.name, v.fields.telegram, v.fields.mail, v.fields.phone, v.note);
  return Number(res.lastInsertRowid);
}

export function updateContact(id: number, v: ContactInput) {
  db()
    .prepare("UPDATE contacts SET name = ?, telegram = ?, mail = ?, phone = ?, note = ? WHERE id = ?")
    .run(v.name, v.fields.telegram, v.fields.mail, v.fields.phone, v.note, id);
}

/** Zugewiesene Items fallen danach auf den Page-Kontakt zurück */
export function deleteContact(id: number) {
  inTransaction(() => {
    db().prepare("DELETE FROM item_contacts WHERE contact_id = ?").run(id);
    db().prepare("DELETE FROM contacts WHERE id = ?").run(id);
  });
}

export function contactForItem(itemId: string): ItemContact | null {
  const row = db()
    .prepare("SELECT c.* FROM item_contacts ic JOIN contacts c ON c.id = ic.contact_id WHERE ic.item_id = ?")
    .get(itemId) as Row | undefined;
  return row ? fromRow(row) : null;
}

/** item_id → contact_id für alle Zuweisungen */
export function contactIdsByItem(): Map<string, number> {
  const rows = db().prepare("SELECT item_id, contact_id FROM item_contacts").all() as { item_id: string; contact_id: number }[];
  return new Map(rows.map((r) => [r.item_id, r.contact_id]));
}

/** contactId null = Zuweisung entfernen (Item zeigt wieder den Page-Kontakt) */
export function assignContact(itemId: string, contactId: number | null) {
  if (contactId === null) db().prepare("DELETE FROM item_contacts WHERE item_id = ?").run(itemId);
  else
    db()
      .prepare("INSERT INTO item_contacts (item_id, contact_id) VALUES (?, ?) ON CONFLICT(item_id) DO UPDATE SET contact_id = excluded.contact_id")
      .run(itemId, contactId);
}

/** Setzt genau diese Items für den Ansprechpartner. Items einer anderen Person wechseln zu ihm. */
export function setContactItems(contactId: number, itemIds: string[]) {
  inTransaction(() => {
    db().prepare("DELETE FROM item_contacts WHERE contact_id = ?").run(contactId);
    for (const itemId of new Set(itemIds)) assignContact(itemId, contactId);
  });
}

function inTransaction(fn: () => void) {
  db().exec("BEGIN");
  try {
    fn();
    db().exec("COMMIT");
  } catch (err) {
    db().exec("ROLLBACK");
    throw err;
  }
}
