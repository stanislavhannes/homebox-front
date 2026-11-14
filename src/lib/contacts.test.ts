import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("./db", () => ({ db: () => { throw new Error("keine DB im Test"); } }));

const { effectiveContact, parseContactInput } = await import("./contacts");

const raw = { name: "Max", telegram: "", mail: "", phone: "", note: "" };

describe("parseContactInput", () => {
  it("normalisiert gültige Eingaben", () => {
    const r = parseContactInput({ ...raw, name: "  Max  ", telegram: "@max_muster", note: " abends " });
    expect(r).toEqual({ value: { name: "Max", fields: { telegram: "max_muster", mail: "", phone: "" }, note: "abends" } });
  });
  it("braucht einen Namen", () => {
    expect(parseContactInput({ ...raw, name: " ", mail: "max@example.org" })).toHaveProperty("error");
  });
  it("braucht mindestens einen Kontaktweg", () => {
    expect(parseContactInput(raw)).toEqual({ error: "Bitte mindestens Telegram, Mail oder Telefon angeben." });
  });
  it("lehnt ungültige Mail ab", () => {
    expect(parseContactInput({ ...raw, mail: "max.example.org" })).toEqual({ error: "Die Mailadresse sieht nicht richtig aus." });
  });
  it("lehnt ungültigen Telegram-Namen ab", () => {
    expect(parseContactInput({ ...raw, telegram: "@ab" })).toHaveProperty("error");
  });
});

describe("effectiveContact", () => {
  const page = { contactFields: { telegram: "verein", mail: "", phone: "" }, contact: "Infos im Wiki" };
  it("nimmt ohne Ansprechpartner den Page-Kontakt", () => {
    expect(effectiveContact(page, null)).toEqual({ fields: page.contactFields, freeText: "Infos im Wiki", personName: null });
  });
  it("nimmt mit Ansprechpartner dessen Felder und Notiz", () => {
    const person = { id: 1, name: "Max", fields: { telegram: "", mail: "", phone: "0171 1234567" }, note: "abends" };
    expect(effectiveContact(page, person)).toEqual({ fields: person.fields, freeText: "abends", personName: "Max" });
  });
});
