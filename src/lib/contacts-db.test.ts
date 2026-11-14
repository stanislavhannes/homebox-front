import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

// Echte SQLite-Datei in einem Temp-Ordner
const dir = mkdtempSync(join(tmpdir(), "hf-contacts-"));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ env: () => ({ DATABASE_PATH: join(dir, "app.db") }) }));

const c = await import("./contacts");

const person = (name: string) => ({ name, fields: { telegram: "", mail: `${name.toLowerCase()}@example.org`, phone: "" }, note: "" });

describe("Ansprechpartner in der Datenbank", () => {
  it("weist zu, wechselt und entfernt", () => {
    const max = c.createContact(person("Max"));
    expect(c.contactForItem("item-1")).toBeNull();
    c.assignContact("item-1", max);
    expect(c.contactForItem("item-1")?.name).toBe("Max");
    c.assignContact("item-1", null);
    expect(c.contactForItem("item-1")).toBeNull();
  });

  it("setContactItems übernimmt Items einer anderen Person und gibt abgewählte frei", () => {
    const anna = c.createContact(person("Anna"));
    const ben = c.createContact(person("Ben"));
    c.setContactItems(anna, ["a", "b"]);
    c.setContactItems(ben, ["b", "c"]);
    expect(c.contactForItem("a")?.name).toBe("Anna");
    expect(c.contactForItem("b")?.name).toBe("Ben");
    c.setContactItems(anna, []);
    expect(c.contactForItem("a")).toBeNull();
    expect(c.listContacts().find((x) => x.id === ben)?.itemCount).toBe(2);
  });

  it("nach dem Löschen zeigen die Items wieder den Page-Kontakt", () => {
    const eva = c.createContact(person("Eva"));
    c.setContactItems(eva, ["x", "y"]);
    c.deleteContact(eva);
    expect(c.getContact(eva)).toBeNull();
    expect(c.contactForItem("x")).toBeNull();
    expect([...c.contactIdsByItem().values()]).not.toContain(eva);
  });

  it("bearbeiten ändert den Kontakt für alle zugewiesenen Items", () => {
    const id = c.createContact(person("Tom"));
    c.assignContact("t", id);
    c.updateContact(id, { ...person("Tom"), name: "Thomas", note: "abends" });
    expect(c.contactForItem("t")).toMatchObject({ name: "Thomas", note: "abends" });
  });
});
