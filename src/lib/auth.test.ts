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
