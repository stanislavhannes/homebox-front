import { afterEach, describe, expect, it, vi } from "vitest";
import type { PageConfig } from "./pages";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ env: () => ({ SESSION_SECRET: "x".repeat(32) }) }));

// Header der aktuellen Anfrage, pro Test gesetzt
let requestHeaders = new Headers();
vi.mock("next/headers", () => ({ headers: async () => requestHeaders, cookies: async () => ({}) }));

const { checkPasswordAttempt, pageAccessKey, verifyPageAccessKey } = await import("./auth");

const page = (passwordHash: string | null, id = 1) => ({ id, passwordHash }) as PageConfig;

describe("Zugangslink", () => {
  it("öffnet die Page mit dem passenden Schlüssel", () => {
    const p = page("scrypt:a:b");
    expect(verifyPageAccessKey(p, pageAccessKey(p)!)).toBe(true);
  });
  it("lehnt falsche oder leere Schlüssel ab", () => {
    const p = page("scrypt:a:b");
    expect(verifyPageAccessKey(p, "falsch")).toBe(false);
    expect(verifyPageAccessKey(p, "")).toBe(false);
  });
  it("wird ungültig, wenn sich das Passwort ändert", () => {
    const key = pageAccessKey(page("scrypt:a:b"))!;
    expect(verifyPageAccessKey(page("scrypt:c:d"), key)).toBe(false);
  });
  it("gilt nur für die eigene Page", () => {
    const key = pageAccessKey(page("scrypt:a:b", 1))!;
    expect(verifyPageAccessKey(page("scrypt:a:b", 2), key)).toBe(false);
  });
  it("gibt es für Pages ohne Passwort nicht", () => {
    expect(pageAccessKey(page(null))).toBeNull();
    expect(verifyPageAccessKey(page(null), "egal")).toBe(false);
  });
});

describe("Sperre gegen Passwort-Durchprobieren", () => {
  afterEach(() => vi.useRealTimers());

  /** Ein Versuch von dieser IP (so wie Traefik sie hinten an X-Forwarded-For anhängt) */
  const attempt = (scope: string, ip: string, correct = false, spoofed = "6.6.6.6") => {
    requestHeaders = new Headers({ "x-forwarded-for": `${spoofed}, ${ip}` });
    return checkPasswordAttempt(scope, () => correct, "falsch");
  };

  it("sperrt eine IP nach 10 Fehlversuchen, andere IPs nicht", async () => {
    for (let i = 0; i < 10; i++) expect(await attempt("a", "1.1.1.1")).toBe("falsch");
    expect(await attempt("a", "1.1.1.1", true)).toContain("Zu viele falsche Versuche");
    expect(await attempt("a", "2.2.2.2", true)).toBeNull();
  });

  it("nimmt die IP vom Proxy, nicht die vom Client vorangestellte", async () => {
    for (let i = 0; i < 10; i++) await attempt("b", "1.1.1.1", false, `9.9.9.${i}`);
    expect(await attempt("b", "1.1.1.1", true, "8.8.8.8")).toContain("Zu viele");
  });

  it("hebt die Sperre der IP nach richtigem Passwort auf", async () => {
    for (let i = 0; i < 9; i++) await attempt("c", "1.1.1.1");
    expect(await attempt("c", "1.1.1.1", true)).toBeNull();
    for (let i = 0; i < 9; i++) expect(await attempt("c", "1.1.1.1")).toBe("falsch");
  });

  it("sperrt den Bereich, wenn viele IPs raten", async () => {
    for (let i = 0; i < 50; i++) await attempt("d", `10.0.0.${i}`);
    expect(await attempt("d", "10.9.9.9", true)).toMatch(/in 10 Minuten/);
    expect(await attempt("e", "10.9.9.9", true)).toBeNull();
  });

  it("lässt pro Bereich höchstens 200 Fehlversuche am Tag zu", async () => {
    vi.useFakeTimers();
    for (let round = 0; round < 4; round++) {
      for (let i = 0; i < 50; i++) await attempt("f", `10.1.${round}.${i}`);
      vi.advanceTimersByTime(11 * 60_000); // 10-Minuten-Fenster ist vorbei
    }
    expect(await attempt("f", "10.9.9.9", true)).toMatch(/in 24 Stunden/);
  });
});
