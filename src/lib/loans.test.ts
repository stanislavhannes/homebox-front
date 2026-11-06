import { describe, expect, it } from "vitest";
import {
  availabilityLabel,
  computeAvailability,
  formatLoans,
  parseLoans,
  todayInBerlin,
} from "./loans";

describe("parseLoans", () => {
  it("liest mehrere Einträge mit Menge und Empfänger", () => {
    const p = parseLoans("6× bis 2026-11-14 (Max); 2× bis 2026-12-01 (Lena)");
    expect(p.invalid).toEqual([]);
    expect(p.loans).toEqual([
      { quantity: 6, until: "2026-11-14", borrower: "Max" },
      { quantity: 2, until: "2026-12-01", borrower: "Lena" },
    ]);
  });

  it("ist tolerant bei Handeingaben", () => {
    const p = parseLoans("bis 2026-11-20\n3x 14.11.2026 (Kollektiv X) ;  ");
    expect(p.loans).toEqual([
      { quantity: 1, until: "2026-11-20" },
      { quantity: 3, until: "2026-11-14", borrower: "Kollektiv X" },
    ]);
  });

  it("behält unlesbare Einträge statt sie zu verwerfen", () => {
    const p = parseLoans("2× bis 2026-02-30; irgendwas; 1× bis 2026-11-01");
    expect(p.loans).toHaveLength(1);
    expect(p.invalid).toEqual(["2× bis 2026-02-30", "irgendwas"]);
    expect(formatLoans(p)).toBe("1× bis 2026-11-01; 2× bis 2026-02-30; irgendwas");
  });

  it("leer und null ergeben nichts", () => {
    expect(parseLoans("")).toEqual({ loans: [], invalid: [] });
    expect(parseLoans(null)).toEqual({ loans: [], invalid: [] });
  });
});

describe("computeAvailability", () => {
  const today = "2026-11-14";

  it("zählt Verleih am Rückgabetag noch als aktiv", () => {
    const a = computeAvailability(1, [{ quantity: 1, until: "2026-11-14" }], today);
    expect(a.status).toBe("unavailable");
    expect(availabilityLabel(a, today, true)).toBe("Verliehen bis 14.11.");
  });

  it("abgelaufene Verleihe zählen nicht", () => {
    const a = computeAvailability(1, [{ quantity: 1, until: "2026-11-13" }], today);
    expect(a.status).toBe("available");
    expect(availabilityLabel(a, today, true)).toBe("Verfügbar");
  });

  it("Teilmengen", () => {
    const a = computeAvailability(
      10,
      [
        { quantity: 6, until: "2026-12-01" },
        { quantity: 2, until: "2026-11-20" },
        { quantity: 5, until: "2026-01-01" },
      ],
      today,
    );
    expect(a).toMatchObject({ available: 2, lent: 8, nextReturn: "2026-11-20", status: "partial" });
    expect(availabilityLabel(a, today, true)).toBe("2 von 10 verfügbar");
    expect(availabilityLabel(a, today, false)).toBe("Verfügbar");
  });

  it("mehr verliehen als vorhanden ergibt 0, nicht negativ", () => {
    const a = computeAvailability(2, [{ quantity: 5, until: "2027-01-02" }], today);
    expect(a.available).toBe(0);
    expect(availabilityLabel(a, today, true)).toBe("Verliehen bis 02.01.2027");
  });
});

describe("todayInBerlin", () => {
  it("nutzt die Berliner Zeitzone", () => {
    // 23:30 UTC am 14.11. ist in Berlin schon der 15.11.
    expect(todayInBerlin(new Date("2026-11-14T23:30:00Z"))).toBe("2026-11-15");
  });
});
