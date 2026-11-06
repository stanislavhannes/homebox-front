/**
 * Verleih-Einträge, gespeichert als Text im Homebox-Custom-Field "Verleih".
 *
 * Format (ein Eintrag pro Verleih, getrennt durch ";" oder Zeilenumbruch):
 *   6× bis 2026-11-14 (Max); 2× bis 2026-12-01 (Lena); bis 2026-11-20
 *
 * Der Parser ist absichtlich tolerant, weil das Feld auch in Homebox von Hand
 * bearbeitet wird. Nicht lesbare Einträge werden nie verworfen, sondern als
 * `invalid` zurückgegeben und beim Formatieren unverändert erhalten.
 */

export const LOAN_FIELD_NAME = "Verleih";
export const TIME_ZONE = "Europe/Berlin";

export type Loan = {
  quantity: number;
  /** Rückgabedatum als YYYY-MM-DD (inklusive: an diesem Tag noch verliehen) */
  until: string;
  borrower?: string;
};

export type ParsedLoans = {
  loans: Loan[];
  /** Rohtext der Einträge, die nicht gelesen werden konnten */
  invalid: string[];
};

const ENTRY_RE =
  /^(?:(\d+)\s*[x×*]\s*)?(?:bis\s+)?(\d{4}-\d{2}-\d{2}|\d{1,2}\.\d{1,2}\.\d{4})\s*(?:\((.*)\))?$/i;

function normalizeDate(raw: string): string | null {
  let y: number, m: number, d: number;
  if (raw.includes("-")) {
    [y, m, d] = raw.split("-").map(Number);
  } else {
    [d, m, y] = raw.split(".").map(Number);
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function parseLoans(text: string | null | undefined): ParsedLoans {
  const result: ParsedLoans = { loans: [], invalid: [] };
  if (!text) return result;
  for (const rawEntry of text.split(/[;\n]/)) {
    const entry = rawEntry.trim();
    if (!entry) continue;
    const match = ENTRY_RE.exec(entry);
    const until = match ? normalizeDate(match[2]) : null;
    const quantity = match?.[1] ? Number(match[1]) : 1;
    if (!match || !until || quantity < 1) {
      result.invalid.push(entry);
      continue;
    }
    const borrower = match[3]?.trim();
    result.loans.push({ quantity, until, ...(borrower ? { borrower } : {}) });
  }
  return result;
}

export function formatLoan(loan: Loan): string {
  const borrower = loan.borrower?.trim().replace(/[();\n]/g, " ").trim();
  return `${loan.quantity}× bis ${loan.until}${borrower ? ` (${borrower})` : ""}`;
}

export function formatLoans(parsed: ParsedLoans): string {
  return [...parsed.loans.map(formatLoan), ...parsed.invalid].join("; ");
}

/** Heutiges Datum in Europe/Berlin als YYYY-MM-DD */
export function todayInBerlin(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function isActive(loan: Loan, today: string): boolean {
  return loan.until >= today;
}

export type Availability = {
  total: number;
  available: number;
  lent: number;
  /** Frühestes Rückgabedatum aktiver Verleihe (YYYY-MM-DD) */
  nextReturn: string | null;
  status: "available" | "partial" | "unavailable";
};

export function computeAvailability(
  quantity: number,
  loans: Loan[],
  today: string,
): Availability {
  const total = Math.max(0, Math.floor(quantity || 0)) || 1;
  const active = loans.filter((l) => isActive(l, today));
  const lent = active.reduce((sum, l) => sum + l.quantity, 0);
  const available = Math.max(0, total - lent);
  const nextReturn =
    active.map((l) => l.until).sort()[0] ?? null;
  return {
    total,
    available,
    lent: Math.min(lent, total),
    nextReturn,
    status:
      available === 0 ? "unavailable" : available < total ? "partial" : "available",
  };
}

/** "14.11." bzw. "14.11.2027", wenn nicht im aktuellen Jahr */
export function formatShortDate(iso: string, today: string): string {
  const [y, m, d] = iso.split("-");
  const sameYear = today.startsWith(y);
  return sameYear ? `${d}.${m}.` : `${d}.${m}.${y}`;
}

export function availabilityLabel(
  a: Availability,
  today: string,
  showQuantity: boolean,
): string {
  const ret = a.nextReturn ? formatShortDate(a.nextReturn, today) : null;
  if (a.status === "unavailable") {
    return ret ? `Verliehen bis ${ret}` : "Verliehen";
  }
  if (a.status === "partial" && showQuantity) {
    return `${a.available} von ${a.total} verfügbar`;
  }
  if (a.total > 1 && showQuantity) {
    return `${a.total} verfügbar`;
  }
  return "Verfügbar";
}
