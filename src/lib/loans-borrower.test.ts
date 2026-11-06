import { describe, expect, it } from "vitest";
import { formatLoan, parseLoans } from "./loans";

describe("Empfänger mit Sonderzeichen", () => {
  for (const borrower of ["Max (Kollektiv)", "Lena; Tom", "A×B", "Jörg 🎉"]) {
    it(`übersteht Hin- und Rückweg: ${borrower}`, () => {
      const text = formatLoan({ quantity: 2, until: "2026-12-01", borrower });
      const p = parseLoans(text);
      expect(p.invalid).toEqual([]);
      expect(p.loans).toHaveLength(1);
      expect(p.loans[0].quantity).toBe(2);
      expect(p.loans[0].borrower).toBeTruthy();
    });
  }
});
