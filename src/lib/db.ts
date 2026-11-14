import "server-only";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { env } from "@/lib/env";

const g = globalThis as unknown as { __appDb?: DatabaseSync; __appDbSchema?: number };

/** Bei neuen Spalten erhöhen, dann migriert auch ein laufender Dev-Server (HMR) sofort. */
const SCHEMA_VERSION = 6;

export function db(): DatabaseSync {
  if (g.__appDb) {
    if (g.__appDbSchema !== SCHEMA_VERSION) {
      migrate(g.__appDb);
      g.__appDbSchema = SCHEMA_VERSION;
    }
    return g.__appDb;
  }
  const file = resolve(/*turbopackIgnore: true*/ process.cwd(), env().DATABASE_PATH);
  mkdirSync(dirname(file), { recursive: true });
  const database = new DatabaseSync(file);
  database.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      intro TEXT NOT NULL DEFAULT '',
      layout TEXT NOT NULL DEFAULT 'A',
      location_ids TEXT NOT NULL DEFAULT '[]',
      password_hash TEXT,
      contact TEXT NOT NULL DEFAULT '',
      visible_fields TEXT NOT NULL DEFAULT '[]',
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  migrate(database);
  g.__appDb = database;
  g.__appDbSchema = SCHEMA_VERSION;
  return database;
}

/** Spalten, die später dazugekommen sind. Idempotent. */
function migrate(database: DatabaseSync) {
  const cols = new Set(
    (database.prepare("PRAGMA table_info(pages)").all() as { name: string }[]).map((c) => c.name),
  );
  if (!cols.has("logo")) database.exec("ALTER TABLE pages ADD COLUMN logo BLOB");
  if (!cols.has("logo_type")) database.exec("ALTER TABLE pages ADD COLUMN logo_type TEXT");
  if (!cols.has("accent")) database.exec("ALTER TABLE pages ADD COLUMN accent TEXT");
  for (const c of ["contact_mail", "contact_telegram", "contact_phone"]) {
    if (!cols.has(c)) database.exec(`ALTER TABLE pages ADD COLUMN ${c} TEXT NOT NULL DEFAULT ''`);
  }
  if (!cols.has("contact_title")) database.exec("ALTER TABLE pages ADD COLUMN contact_title TEXT NOT NULL DEFAULT ''");
  if (!cols.has("howto")) database.exec("ALTER TABLE pages ADD COLUMN howto TEXT NOT NULL DEFAULT ''");
  // Ansprechpartner pro Item (seit 1.2)
  database.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      telegram TEXT NOT NULL DEFAULT '',
      mail TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS item_contacts (
      item_id TEXT PRIMARY KEY,
      contact_id INTEGER NOT NULL REFERENCES contacts(id)
    );
  `);
}
