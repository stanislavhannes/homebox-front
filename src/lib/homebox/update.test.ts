import { describe, expect, it } from "vitest";
import type { HbEntity } from "./types";
import { buildEntityUpdate, unexpectedChanges, withTextField } from "./update";

const item: HbEntity = {
  id: "i1",
  name: "Nebelmaschine",
  assetId: "000-012",
  description: "1500 W",
  notes: "Fluid im Regal",
  quantity: 2,
  archived: false,
  purchasePrice: 99.5,
  purchaseDate: "2024-03-01T00:00:00Z",
  entityType: { id: "t-item", isLocation: false },
  parent: { id: "loc1", name: "Licht" },
  tags: [{ id: "tag1", name: "Licht" }],
  fields: [
    { id: "f1", name: "Watt", type: "number", numberValue: 1500 },
    { id: "f2", name: "Verleih", type: "text", textValue: "1× bis 2026-11-14" },
  ],
  attachments: [{ id: "a1", type: "photo", title: "Foto" }],
  imageId: "a1",
};

describe("buildEntityUpdate", () => {
  it("übernimmt alle Felder und ändert nur das Custom Field", () => {
    const fields = withTextField(item.fields, "Verleih", "2× bis 2026-12-01");
    const body = buildEntityUpdate(item, fields);
    expect(body).toMatchObject({
      id: "i1",
      name: "Nebelmaschine",
      assetId: "000-012",
      description: "1500 W",
      notes: "Fluid im Regal",
      quantity: 2,
      purchasePrice: 99.5,
      purchaseDate: "2024-03-01T00:00:00Z",
      entityTypeId: "t-item",
      parentId: "loc1",
      tagIds: ["tag1"],
    });
    expect(body.fields).toEqual([
      { id: "f1", name: "Watt", type: "number", numberValue: 1500 },
      { id: "f2", name: "Verleih", type: "text", textValue: "2× bis 2026-12-01" },
    ]);
    expect(body).not.toHaveProperty("attachments");
    expect(body).not.toHaveProperty("imageId");
  });

  it("leerer Wert entfernt das Feld", () => {
    expect(withTextField(item.fields, "Verleih", "")).toEqual([item.fields![0]]);
  });
});

describe("unexpectedChanges", () => {
  it("meldet nichts, wenn nur das Verleih-Feld anders ist", () => {
    const after = {
      ...item,
      fields: [item.fields![0], { ...item.fields![1], textValue: "neu" }],
      updatedAt: "x",
    };
    expect(unexpectedChanges(item, after, "Verleih")).toEqual([]);
  });

  it("meldet verlorene Notizen, Tags und Felder", () => {
    const after = { ...item, notes: "", tags: [], fields: [] };
    expect(unexpectedChanges(item, after, "Verleih")).toEqual(["notes", "tags", "fields"]);
  });
});
