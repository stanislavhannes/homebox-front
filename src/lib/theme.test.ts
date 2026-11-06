import { describe, expect, it } from "vitest";
import { ACCENT_PRESETS, accentForeground, accentStyle, accentVariants, avoidStatusHues, normalizeAccent } from "./theme";

describe("theme", () => {
  it("wählt lesbare Schrift auf der Akzentfarbe", () => {
    expect(accentForeground("#2563eb")).toBe("#ffffff");
    expect(accentForeground("#18181b")).toBe("#ffffff");
    expect(accentForeground("#facc15")).toBe("#0a0a0a");
    expect(accentForeground("#ffffff")).toBe("#0a0a0a");
  });
  it("akzeptiert nur #rrggbb", () => {
    expect(normalizeAccent("#2563EB")).toBe("#2563eb");
    expect(normalizeAccent("")).toBeNull();
    expect(normalizeAccent("red")).toBeNull();
    expect(normalizeAccent("#fff;background:url(x)")).toBeNull();
  });
  it("ohne Farbe kein Style", () => {
    expect(accentStyle(null)).toBeUndefined();
    expect(accentStyle("#2563eb")).toMatchObject({ "--accent-l": "#2563eb" });
  });
  it("Varianten erreichen 4.5:1 hell wie dunkel", () => {
    const blue = accentVariants("#2563eb");
    expect(blue.light).toBe("#2563eb"); // reicht auf Weiß schon
    expect(blue.dark).not.toBe("#2563eb"); // auf dunkel aufgehellt
    const yellow = accentVariants("#facc15");
    expect(yellow.light).not.toBe("#facc15"); // auf Weiß abgedunkelt
    expect(yellow.dark).toBe("#facc15");
  });
  it("Rot und Grün werden aus den Status-Zonen geschoben", () => {
    expect(avoidStatusHues("#e11d48").zone).toBe("Rot");
    expect(avoidStatusHues("#e11d48").color).not.toBe("#e11d48");
    expect(avoidStatusHues("#16a34a").zone).toBe("Grün");
    expect(avoidStatusHues("#2563eb")).toEqual({ color: "#2563eb", zone: null });
    expect(avoidStatusHues("#475569").zone).toBeNull(); // Grau bleibt
    for (const p of ACCENT_PRESETS) if (p.value) expect(avoidStatusHues(p.value).zone).toBeNull();
  });
});
