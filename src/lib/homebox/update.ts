import type { HbEntity, HbField } from "./types";

/**
 * Homebox' PUT /entities/{id} ersetzt das komplette Item: jedes Feld, das im
 * Body fehlt, wird gelöscht. Deshalb bauen wir den Body immer aus einem frisch
 * gelesenen Item und ändern nur die Custom Fields.
 */

// Skalare Felder aus repo.EntityUpdate, die 1:1 aus repo.EntityOut kommen.
const PASSTHROUGH_KEYS = [
  "id",
  "name",
  "assetId",
  "description",
  "notes",
  "quantity",
  "archived",
  "insured",
  "lifetimeWarranty",
  "manufacturer",
  "modelNumber",
  "serialNumber",
  "purchaseDate",
  "purchaseFrom",
  "purchasePrice",
  "soldDate",
  "soldNotes",
  "soldPrice",
  "soldTo",
  "warrantyDetails",
  "warrantyExpires",
  "syncChildEntityLocations",
] as const;

export function toFieldData(f: HbField): HbField {
  const out: HbField = { name: f.name, type: f.type || "text" };
  if (f.id) out.id = f.id;
  if (f.textValue !== undefined) out.textValue = f.textValue;
  if (f.numberValue !== undefined) out.numberValue = f.numberValue;
  if (f.booleanValue !== undefined) out.booleanValue = f.booleanValue;
  if (f.timeValue !== undefined) out.timeValue = f.timeValue;
  return out;
}

export function buildEntityUpdate(
  entity: HbEntity,
  fields: HbField[],
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const key of PASSTHROUGH_KEYS) {
    if (entity[key] !== undefined && entity[key] !== null) body[key] = entity[key];
  }
  const entityTypeId = entity.entityType?.id;
  if (entityTypeId) body.entityTypeId = entityTypeId;
  const parentId = entity.parent?.id;
  if (parentId) body.parentId = parentId;
  const locationId = entity.location?.id ?? entity.locationId;
  if (locationId) body.locationId = locationId;
  body.tagIds = (entity.tags ?? []).map((t) => t.id);
  body.fields = fields.map(toFieldData);
  return body;
}

/** Custom Field `name` setzen (leerer Text entfernt das Feld). */
export function withTextField(
  fields: HbField[] | undefined,
  name: string,
  value: string,
): HbField[] {
  const rest = (fields ?? []).filter((f) => f.name !== name);
  const existing = (fields ?? []).find((f) => f.name === name);
  if (!value.trim()) return rest;
  return [
    ...rest,
    { ...(existing?.id ? { id: existing.id } : {}), name, type: "text", textValue: value },
  ];
}

export function getTextField(entity: HbEntity, name: string): string {
  return entity.fields?.find((f) => f.name === name)?.textValue ?? "";
}

/**
 * Vergleicht ein Item vor und nach dem Schreiben. Gibt die Namen aller
 * Eigenschaften zurück, die sich unerwartet geändert haben.
 */
export function unexpectedChanges(
  before: HbEntity,
  after: HbEntity,
  changedField: string,
): string[] {
  const diffs: string[] = [];
  for (const key of PASSTHROUGH_KEYS) {
    const a = before[key] ?? null;
    const b = after[key] ?? null;
    if (JSON.stringify(a) !== JSON.stringify(b)) diffs.push(key);
  }
  if ((before.parent?.id ?? null) !== (after.parent?.id ?? null)) diffs.push("parent");
  if ((before.entityType?.id ?? null) !== (after.entityType?.id ?? null))
    diffs.push("entityType");
  const tagIds = (e: HbEntity) => (e.tags ?? []).map((t) => t.id).sort().join(",");
  if (tagIds(before) !== tagIds(after)) diffs.push("tags");
  const otherFields = (e: HbEntity) =>
    JSON.stringify(
      (e.fields ?? [])
        .filter((f) => f.name !== changedField)
        .map((f) => [f.name, f.textValue ?? null, f.numberValue ?? null, f.booleanValue ?? null])
        .sort(),
    );
  if (otherFields(before) !== otherFields(after)) diffs.push("fields");
  const attachments = (e: HbEntity) => (e.attachments ?? []).length;
  if (attachments(before) !== attachments(after)) diffs.push("attachments");
  return diffs;
}
