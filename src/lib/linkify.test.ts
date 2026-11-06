import { describe, expect, it } from "vitest";
import { tokenize } from "./linkify";

const phones = (t: string) => tokenize(t).filter((x) => x.type === "phone").map((x) => x.value);

describe("tokenize", () => {
  it("erkennt echte Telefonnummern", () => {
    expect(phones("Ruf an: 0171 2345678")).toEqual(["0171 2345678"]);
    expect(phones("Tel. +49 171 2345678.")).toEqual(["+49 171 2345678"]);
    expect(phones("030/12345678")).toEqual(["030/12345678"]);
    expect(phones("+49 (0) 30 123456-7")).toEqual(["+49 (0) 30 123456-7"]);
  });
  it("lässt Kanal-Listen, Daten, Maße und Modellnummern in Ruhe", () => {
    expect(phones("Steuerung: DMX (3/4/5/6/8/9/11/12 Kanäle), Master/Slave, statische")).toEqual([]);
    expect(phones("bis 2026-11-14")).toEqual([]);
    expect(phones("Maße 120 x 60 x 75 cm, 1500 W")).toEqual([]);
    expect(phones("Modell AF-150 2024")).toEqual([]);
    expect(phones("Kanäle 0/1/2/3/4/5/6")).toEqual([]);
  });
  it("erkennt URLs und Mails weiterhin", () => {
    const t = tokenize("Mehr: https://example.org/x, oder an a.b@example.org.");
    expect(t.filter((x) => x.type === "url").map((x) => x.value)).toEqual(["https://example.org/x"]);
    expect(t.filter((x) => x.type === "mail").map((x) => x.value)).toEqual(["a.b@example.org"]);
  });
  it("Telefonnummer in einer URL bleibt Teil der URL", () => {
    const t = tokenize("https://bosch.com/gks-190-0601623000");
    expect(t).toHaveLength(1);
    expect(t[0].type).toBe("url");
  });
  it("Telegram: @name und t.me/name, aber keine Mailadresse", () => {
    const tg = (s: string) =>
      tokenize(s).flatMap((x) => (x.type === "telegram" ? [[x.value, x.href]] : []));
    expect(tg("Schreib mir auf Telegram: @stani_hannes.")).toEqual([["@stani_hannes", "https://t.me/stani_hannes"]]);
    expect(tg("oder t.me/kollektiv_verleih")).toEqual([["t.me/kollektiv_verleih", "https://t.me/kollektiv_verleih"]]);
    expect(tg("verleih@example.org")).toEqual([]);
    expect(tg("@abc")).toEqual([]); // zu kurz für Telegram
    expect(tokenize("verleih@example.org")[0].type).toBe("mail");
  });
});
