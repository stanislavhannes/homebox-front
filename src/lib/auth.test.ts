import { describe, expect, it, vi } from "vitest";
import type { PageConfig } from "./pages";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ env: () => ({ SESSION_SECRET: "x".repeat(32) }) }));

const { pageAccessKey, verifyPageAccessKey } = await import("./auth");

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

describe("Rate-Limit", async () => {
  const { isRateLimited, recordFailedAttempt, clearAttempts } = await import("./auth");
  it("sperrt eine IP nach 10 Fehlversuchen", () => {
    for (let i = 0; i < 10; i++) recordFailedAttempt("t1", "1.1.1.1");
    expect(isRateLimited("t1", "1.1.1.1")).toBe(true);
    expect(isRateLimited("t1", "2.2.2.2")).toBe(false);
    clearAttempts("t1", "1.1.1.1");
    expect(isRateLimited("t1", "1.1.1.1")).toBe(false);
  });
  it("sperrt den Bereich, wenn viele IPs raten (gefälschte X-Forwarded-For)", () => {
    for (let i = 0; i < 50; i++) recordFailedAttempt("t2", `10.0.0.${i}`);
    expect(isRateLimited("t2", "10.9.9.9")).toBe(true);
    expect(isRateLimited("t3", "10.9.9.9")).toBe(false);
  });
});

describe("Rate-Limit Tagesgrenze und Meldung", async () => {
  const { isRateLimited, recordFailedAttempt, rateLimitedFor, rateLimitMessage } = await import("./auth");
  it("lässt pro Bereich höchstens 200 Fehlversuche am Tag zu", () => {
    vi.useFakeTimers();
    for (let round = 0; round < 4; round++) {
      for (let i = 0; i < 50; i++) recordFailedAttempt("t4", `10.1.${round}.${i}`);
      vi.advanceTimersByTime(11 * 60_000); // 10-Minuten-Fenster ist vorbei
    }
    expect(isRateLimited("t4", "10.9.9.9")).toBe(true);
    expect(rateLimitedFor("t4", "10.9.9.9")).toBeGreaterThan(20 * 60 * 60_000);
    vi.useRealTimers();
  });
  it("nennt die Wartezeit", () => {
    expect(rateLimitMessage(7 * 60_000)).toContain("7 Minuten");
    expect(rateLimitMessage(30_000)).toContain("einer Minute");
    expect(rateLimitMessage(23 * 60 * 60_000)).toContain("23 Stunden");
  });
});
