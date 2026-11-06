import { describe, expect, it } from "vitest";
import { cleanFileTitle } from "./file-title";

describe("cleanFileTitle", () => {
  it("räumt kaputte Titel auf", () => {
    expect(cleanFileTitle("Google Drive)")).toBe("Google Drive");
    expect(cleanFileTitle("(Bedienungsanleitung")).toBe("Bedienungsanleitung");
    expect(cleanFileTitle("Manual (EN).pdf")).toBe("Manual (EN).pdf");
    expect(cleanFileTitle(" - ")).toBeNull();
    expect(cleanFileTitle("a)")).toBeNull();
  });
});
