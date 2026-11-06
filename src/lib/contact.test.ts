import { describe, expect, it } from "vitest";
import { contactAction } from "./contact";

describe("contactAction", () => {
  it("Mail mit Betreff und Text", () => {
    const a = contactAction("Schreib an verleih@example.org", "Nebelmaschine")!;
    expect(a.label).toBe("Per Mail anfragen");
    expect(a.href.startsWith("mailto:verleih@example.org?subject=Ausleihen%3A%20Nebelmaschine")).toBe(true);
    expect(decodeURIComponent(a.href)).toContain("„Nebelmaschine“");
  });
  it("WhatsApp mit Text", () => {
    const a = contactAction("https://wa.me/491711234567", "Bank")!;
    expect(a.label).toBe("Per WhatsApp anfragen");
    expect(new URL(a.href).searchParams.get("text")).toContain("„Bank“");
  });
  it("Signal-Link", () => {
    expect(contactAction("https://signal.me/#p/+49171")!.label).toBe("Per Signal anfragen");
  });
  it("Webseite ist kein Kontaktweg, Telefon danach schon", () => {
    const a = contactAction("Infos: https://example.org, Tel. 0171 2345678")!;
    expect(a.label).toBe("Anrufen");
    expect(a.href).toBe("tel:01712345678");
  });
  it("nichts Brauchbares", () => {
    expect(contactAction("Frag in der Gruppe")).toBeNull();
    expect(contactAction("")).toBeNull();
  });
  it("Telegram-@name wird zum Telegram-Button", () => {
    const a = contactAction("Am schnellsten über Telegram @stani_hannes", "Bank")!;
    expect(a.label).toBe("Per Telegram anfragen");
    expect(a.href).toBe("https://t.me/stani_hannes");
    expect(a.external).toBe(true);
  });
});
