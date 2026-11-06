import "server-only";
import { homebox, HomeboxError } from "@/lib/homebox/client";
import { buildEntityUpdate, getTextField, unexpectedChanges, withTextField } from "@/lib/homebox/update";
import { formatLoans, LOAN_FIELD_NAME, parseLoans, type ParsedLoans } from "@/lib/loans";

/**
 * Ändert das Verleih-Feld eines Items in Homebox.
 *
 * Ablauf: frisch lesen → nur das Feld ändern → kompletter PUT → erneut lesen →
 * prüfen, dass nichts anderes verändert wurde. Homebox' PUT ersetzt das ganze
 * Item, deshalb ist der Abgleich danach Pflicht.
 */
export async function updateLoans(
  itemId: string,
  mutate: (current: ParsedLoans, quantity: number) => ParsedLoans,
): Promise<{ loanText: string }> {
  const api = homebox();
  const before = await api.getEntity(itemId);
  if (before.entityType?.isLocation) throw new HomeboxError("Das ist ein Lagerort, kein Item.");

  const current = parseLoans(getTextField(before, LOAN_FIELD_NAME));
  const next = mutate(current, Math.max(1, Math.floor(before.quantity ?? 1)));
  const text = formatLoans(next);

  const fields = withTextField(before.fields, LOAN_FIELD_NAME, text);
  await api.putEntity(itemId, buildEntityUpdate(before, fields));

  const after = await api.getEntity(itemId);
  const stored = getTextField(after, LOAN_FIELD_NAME);
  if (stored !== text) {
    throw new HomeboxError(
      `Homebox hat das Verleih-Feld nicht wie erwartet gespeichert (gespeichert: "${stored}").`,
    );
  }
  const diffs = unexpectedChanges(before, after, LOAN_FIELD_NAME);
  if (diffs.length) {
    console.error("[loans] Unerwartete Änderungen nach PUT", itemId, diffs, { before, after });
    throw new HomeboxError(
      `Achtung: Beim Speichern haben sich auch diese Felder geändert: ${diffs.join(", ")}. Bitte das Item in Homebox prüfen.`,
    );
  }
  return { loanText: stored };
}
