import { describe, expect, it } from "vitest";
import { allContactActions, contactAction, contactActions, normalizeMail, normalizePhone, normalizeTelegram } from "./contact";

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
    expect(a.kind).toBe("telegram");
  });
  it("alle Kontaktwege in Reihenfolge, ohne Doppelte und ohne Webseiten", () => {
    const all = contactActions("Mail info@x.de, Telegram @stani_hannes, Web https://x.de, nochmal info@x.de", "Bank");
    expect(all.map((a) => a.kind)).toEqual(["mail", "telegram"]);
  });
  it("Telegram-Eingaben werden zum Namen", () => {
    expect(normalizeTelegram("@stani_hannes")).toBe("stani_hannes");
    expect(normalizeTelegram("t.me/stani_hannes")).toBe("stani_hannes");
    expect(normalizeTelegram("https://t.me/stani_hannes")).toBe("stani_hannes");
    expect(normalizeTelegram("stani_hannes")).toBe("stani_hannes");
    expect(normalizeTelegram("@abc")).toBeNull();
    expect(normalizeTelegram("hallo welt")).toBeNull();
  });
  it("Mail und Telefon prüfen", () => {
    expect(normalizeMail(" info@x.de ")).toBe("info@x.de");
    expect(normalizeMail("info@x")).toBeNull();
    expect(normalizePhone("+49 171 2345678")).toBe("+49 171 2345678");
    expect(normalizePhone("0171/2345678")).toBe("0171/2345678");
    expect(normalizePhone("123")).toBeNull();
    expect(normalizePhone("ruf an")).toBeNull();
  });
  it("Felder vor weiteren Hinweisen, ohne Doppelte", () => {
    const a = allContactActions({ telegram: "stani_hannes", mail: "info@x.de", phone: "" }, "Oder info@x.de oder https://wa.me/49171", "Bank");
    expect(a.map((x) => x.kind)).toEqual(["telegram", "mail", "whatsapp"]);
  });
});
