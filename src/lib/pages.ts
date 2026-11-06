import "server-only";
import type { ContactFields } from "@/lib/contact";
import { db } from "@/lib/db";

export const FIELD_OPTIONS = [
  { key: "description", label: "Beschreibung" },
  { key: "manufacturer", label: "Hersteller" },
  { key: "modelNumber", label: "Modell" },
  { key: "quantity", label: "Menge (Anzahl verfügbar/gesamt)" },
  { key: "purchasePrice", label: "Kaufpreis" },
  { key: "notes", label: "Notizen" },
  { key: "assetId", label: "Asset-ID" },
  { key: "manuals", label: "Bedienungsanleitungen" },
  { key: "attachments", label: "Sonstige Anhänge" },
  { key: "warranty", label: "Garantie-Dokumente" },
  { key: "receipts", label: "Rechnungen / Kaufbelege" },
  { key: "tags", label: "Tags" },
  { key: "location", label: "Lagerort" },
  { key: "customFields", label: "Weitere Custom Fields" },
] as const;

export type VisibleField = (typeof FIELD_OPTIONS)[number]["key"];

export const DEFAULT_VISIBLE_FIELDS: VisibleField[] = [
  "description",
  "manufacturer",
  "modelNumber",
  "quantity",
  "manuals",
  "location",
];

export const RESERVED_SLUGS = new Set(["admin", "api", "_next", "favicon.ico"]);

export type PageLayout = "A" | "B" | "C";
export const PAGE_LAYOUTS: PageLayout[] = ["A", "B", "C"];

export type PageConfig = {
  id: number;
  slug: string;
  title: string;
  intro: string;
  layout: PageLayout;
  locationIds: string[];
  passwordHash: string | null;
  contact: string;
  visibleFields: VisibleField[];
  published: boolean;
  updatedAt: string;
  /** Logo vorhanden? Die Bytes selbst lädt nur getPageLogo. */
  hasLogo: boolean;
  /** Akzentfarbe als #rrggbb, null = Standard */
  accent: string | null;
  /** „So läuft's“: Abholung, Dauer, Pfand … (Freitext) */
  howto: string;
  /** Überschrift über dem Kontakt, leer = Standard */
  contactTitle: string;
  /** Eigene Kontaktfelder (normalisiert); contact = weitere Hinweise */
  contactFields: ContactFields;
};

type Row = {
  id: number;
  slug: string;
  title: string;
  intro: string;
  layout: string;
  location_ids: string;
  password_hash: string | null;
  contact: string;
  visible_fields: string;
  published: number;
  updated_at: string;
  has_logo: number;
  accent: string | null;
  howto: string;
  contact_title: string;
  contact_mail: string;
  contact_telegram: string;
  contact_phone: string;
};

const COLS =
  "id, slug, title, intro, layout, location_ids, password_hash, contact, visible_fields, published, updated_at, accent, howto, contact_title, contact_mail, contact_telegram, contact_phone, (logo IS NOT NULL) AS has_logo";

function fromRow(r: Row): PageConfig {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    intro: r.intro,
    layout: (PAGE_LAYOUTS as string[]).includes(r.layout) ? (r.layout as PageLayout) : "A",
    locationIds: JSON.parse(r.location_ids),
    passwordHash: r.password_hash,
    contact: r.contact,
    visibleFields: JSON.parse(r.visible_fields),
    published: r.published === 1,
    updatedAt: r.updated_at,
    hasLogo: r.has_logo === 1,
    accent: r.accent,
    howto: r.howto ?? "",
    contactTitle: r.contact_title ?? "",
    contactFields: { telegram: r.contact_telegram ?? "", mail: r.contact_mail ?? "", phone: r.contact_phone ?? "" },
  };
}

export function listPages(): PageConfig[] {
  const rows = db().prepare(`SELECT ${COLS} FROM pages ORDER BY title`).all() as Row[];
  return rows.map(fromRow);
}

export function getPage(id: number): PageConfig | null {
  const row = db().prepare(`SELECT ${COLS} FROM pages WHERE id = ?`).get(id) as Row | undefined;
  return row ? fromRow(row) : null;
}

export function getPageBySlug(slug: string): PageConfig | null {
  const row = db().prepare(`SELECT ${COLS} FROM pages WHERE slug = ?`).get(slug) as Row | undefined;
  return row ? fromRow(row) : null;
}

export type PageInput = {
  slug: string;
  title: string;
  intro: string;
  layout: PageLayout;
  locationIds: string[];
  contact: string;
  visibleFields: VisibleField[];
  published: boolean;
  accent: string | null;
  howto: string;
  contactTitle: string;
  contactFields: ContactFields;
};

export function createPage(input: PageInput, passwordHash: string | null): number {
  const res = db()
    .prepare(
      `INSERT INTO pages (slug, title, intro, layout, location_ids, password_hash, contact, visible_fields, published, accent, howto, contact_title, contact_mail, contact_telegram, contact_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.slug,
      input.title,
      input.intro,
      input.layout,
      JSON.stringify(input.locationIds),
      passwordHash,
      input.contact,
      JSON.stringify(input.visibleFields),
      input.published ? 1 : 0,
      input.accent,
      input.howto,
      input.contactTitle,
      input.contactFields.mail,
      input.contactFields.telegram,
      input.contactFields.phone,
    );
  return Number(res.lastInsertRowid);
}

/** passwordHash: undefined = unverändert, null = entfernen */
export function updatePage(id: number, input: PageInput, passwordHash?: string | null) {
  db()
    .prepare(
      `UPDATE pages SET slug = ?, title = ?, intro = ?, layout = ?, location_ids = ?, contact = ?,
         visible_fields = ?, published = ?, accent = ?, howto = ?, contact_title = ?, contact_mail = ?, contact_telegram = ?, contact_phone = ?, updated_at = datetime('now') WHERE id = ?`,
    )
    .run(
      input.slug,
      input.title,
      input.intro,
      input.layout,
      JSON.stringify(input.locationIds),
      input.contact,
      JSON.stringify(input.visibleFields),
      input.published ? 1 : 0,
      input.accent,
      input.howto,
      input.contactTitle,
      input.contactFields.mail,
      input.contactFields.telegram,
      input.contactFields.phone,
      id,
    );
  if (passwordHash !== undefined) {
    db().prepare("UPDATE pages SET password_hash = ? WHERE id = ?").run(passwordHash, id);
  }
}

export const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

/** logo: null = entfernen */
export function setPageLogo(id: number, logo: { bytes: Uint8Array; type: string } | null) {
  db()
    .prepare("UPDATE pages SET logo = ?, logo_type = ?, updated_at = datetime('now') WHERE id = ?")
    .run(logo?.bytes ?? null, logo?.type ?? null, id);
}

/** Logo-Bytes ersetzen, ohne updated_at zu ändern (einmaliges Verkleinern alter Uploads) */
export function replacePageLogoBytes(id: number, logo: { bytes: Uint8Array; type: string }) {
  db().prepare("UPDATE pages SET logo = ?, logo_type = ? WHERE id = ?").run(logo.bytes, logo.type, id);
}

export function getPageLogo(id: number): { bytes: Uint8Array; type: string } | null {
  const row = db().prepare("SELECT logo, logo_type FROM pages WHERE id = ?").get(id) as
    | { logo: Uint8Array | null; logo_type: string | null }
    | undefined;
  if (!row?.logo || !row.logo_type) return null;
  return { bytes: row.logo, type: row.logo_type };
}

export function deletePage(id: number) {
  db().prepare("DELETE FROM pages WHERE id = ?").run(id);
}

// ---- globale Einstellungen ----

export type ThemeSetting = "system" | "light" | "dark";
export const THEME_SETTINGS: ThemeSetting[] = ["system", "light", "dark"];

export type AppSettings = {
  /** Items mit diesem Tag erscheinen auf keiner Page (Groß/Klein egal) */
  hiddenTag: string;
  /** Hell/Dunkel für die ganze App: nach Gerät oder fest */
  theme: ThemeSetting;
};

const DEFAULT_SETTINGS: AppSettings = { hiddenTag: "privat", theme: "system" };

export function getSettings(): AppSettings {
  const rows = db().prepare("SELECT key, value FROM settings").all() as {
    key: string;
    value: string;
  }[];
  const s: AppSettings = { ...DEFAULT_SETTINGS };
  for (const r of rows) {
    if (r.key === "hiddenTag") s.hiddenTag = r.value;
    if (r.key === "theme" && (THEME_SETTINGS as string[]).includes(r.value)) s.theme = r.value as ThemeSetting;
  }
  return s;
}

export function saveSettings(s: AppSettings) {
  const upsert = db().prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  );
  upsert.run("hiddenTag", s.hiddenTag.trim());
  upsert.run("theme", s.theme);
}
