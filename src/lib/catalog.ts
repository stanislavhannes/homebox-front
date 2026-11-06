import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { homebox, mapLimit } from "@/lib/homebox/client";
import type { HbEntity, HbTreeItem } from "@/lib/homebox/types";
import { LOAN_FIELD_NAME } from "@/lib/loans";

export const HOMEBOX_TAG = "homebox";

export type LocationNode = {
  id: string;
  name: string;
  /** Pfad ab Wurzel, z. B. ["Kollektiv Lager", "Licht"] */
  path: string[];
  children: LocationNode[];
};

export type CatalogLocation = {
  id: string;
  name: string;
  path: string[];
  depth: number;
  parentId: string | null;
};

export type CatalogItem = {
  id: string;
  name: string;
  assetId: string;
  description: string;
  notes: string;
  quantity: number;
  manufacturer: string;
  modelNumber: string;
  purchasePrice: number | null;
  tags: string[];
  /** nächster Lagerort (kein Item) über dem Item */
  locationId: string;
  locationName: string;
  locationPath: string[];
  /** IDs aller Lagerorte vom gewählten Wurzel-Lagerort bis zum Item (für Filter) */
  locationChain: string[];
  /** wenn das Item in einem anderen Item liegt (z. B. Case) */
  containerName: string | null;
  loanText: string;
  customFields: { name: string; value: string }[];
  /** Attachment-ID für die Kachel (Thumbnail, sonst Hauptbild) */
  thumbId: string | null;
  photos: { id: string; thumbId: string | null; title: string }[];
  /** Anhänge außer Fotos (Anleitungen, Garantie, Rechnungen, sonstige) */
  files: { id: string; title: string; type: FileType; mimeType: string }[];
  /** Foto-/Thumbnail-IDs, die öffentlich ausgeliefert werden dürfen (Dateien prüft die Page) */
  photoAttachmentIds: string[];
  updatedAt: string;
};

export const FILE_TYPES = ["manual", "attachment", "warranty", "receipt"] as const;
export type FileType = (typeof FILE_TYPES)[number];

export type Catalog = {
  locations: CatalogLocation[];
  items: CatalogItem[];
};

function toLocationNodes(nodes: HbTreeItem[], parentPath: string[] = []): LocationNode[] {
  return nodes.map((n) => {
    const path = [...parentPath, n.name];
    return { id: n.id, name: n.name, path, children: toLocationNodes(n.children ?? [], path) };
  });
}

/** Lagerort-Baum (ohne Items), für Admin und Filter */
export async function getLocationTree(): Promise<LocationNode[]> {
  "use cache";
  cacheTag(HOMEBOX_TAG);
  cacheLife({ stale: 30, revalidate: 60, expire: 3600 });
  return toLocationNodes(await homebox().getTree(false));
}

function findNode(nodes: HbTreeItem[], id: string): HbTreeItem | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.children ?? [], id);
    if (found) return found;
  }
  return null;
}

function collectLocationIds(nodes: HbTreeItem[], into = new Set<string>()) {
  for (const n of nodes) {
    into.add(n.id);
    collectLocationIds(n.children ?? [], into);
  }
  return into;
}

type Found = {
  id: string;
  location: { id: string; name: string; path: string[]; chain: string[] };
  containerId: string | null;
  containerName: string | null;
};

function fieldValue(f: NonNullable<HbEntity["fields"]>[number]): string {
  if (f.type === "boolean") return f.booleanValue ? "Ja" : "Nein";
  if (f.type === "number") return f.numberValue != null ? String(f.numberValue) : "";
  if (f.type === "time") return f.timeValue?.slice(0, 10) ?? "";
  return f.textValue ?? "";
}

function toCatalogItem(e: HbEntity, found: Found): CatalogItem {
  const attachments = e.attachments ?? [];
  const photos = attachments
    .filter((a) => a.type === "photo")
    .sort((a, b) => Number(!!b.primary) - Number(!!a.primary))
    .map((a) => ({ id: a.id, thumbId: a.thumbnail?.id ?? null, title: a.title }));
  // Hauptbild aus imageId nach vorne holen
  if (e.imageId) {
    const idx = photos.findIndex((p) => p.id === e.imageId);
    if (idx > 0) photos.unshift(...photos.splice(idx, 1));
  }
  const files = attachments
    .filter((a) => a.type !== "photo")
    .map((a) => ({
      id: a.id,
      title: a.title,
      type: (FILE_TYPES as readonly string[]).includes(a.type) ? (a.type as FileType) : "attachment",
      mimeType: a.mimeType ?? "",
    }));
  const thumbId = e.thumbnailId || photos[0]?.thumbId || e.imageId || photos[0]?.id || null;
  const allowed = new Set<string>();
  for (const p of photos) {
    allowed.add(p.id);
    if (p.thumbId) allowed.add(p.thumbId);
  }
  if (e.imageId) allowed.add(e.imageId);
  if (e.thumbnailId) allowed.add(e.thumbnailId);

  return {
    id: e.id,
    name: e.name,
    assetId: e.assetId ?? "",
    description: e.description ?? "",
    notes: e.notes ?? "",
    quantity: Math.max(1, Math.floor(e.quantity ?? 1)),
    manufacturer: e.manufacturer ?? "",
    modelNumber: e.modelNumber ?? "",
    purchasePrice: e.purchasePrice ? e.purchasePrice : null,
    tags: (e.tags ?? []).map((t) => t.name),
    locationId: found.location.id,
    locationName: found.location.name,
    locationPath: found.location.path,
    locationChain: found.location.chain,
    containerName: found.containerName,
    loanText: e.fields?.find((f) => f.name === LOAN_FIELD_NAME)?.textValue ?? "",
    customFields: (e.fields ?? [])
      .filter((f) => f.name !== LOAN_FIELD_NAME)
      .map((f) => ({ name: f.name, value: fieldValue(f) }))
      .filter((f) => f.value !== ""),
    thumbId,
    photos,
    files,
    photoAttachmentIds: [...allowed],
    updatedAt: e.updatedAt ?? "",
  };
}

/**
 * Alle Items unter den gewählten Lagerorten (inkl. Unterorte und Items in Items).
 * Ausgeschlossen: archivierte Items und Items mit dem versteckten Tag – samt
 * allem, was in einem versteckten Item liegt.
 *
 * Gecacht (60 s) und per Tag "homebox" sofort invalidierbar. Liefert nur Rohdaten;
 * die Verfügbarkeit wird zur Anfragezeit berechnet, weil sie vom Datum abhängt.
 */
export async function getCatalog(locationIds: string[], hiddenTag: string): Promise<Catalog> {
  "use cache";
  cacheTag(HOMEBOX_TAG);
  cacheLife({ stale: 30, revalidate: 60, expire: 3600 });

  const api = homebox();
  const [fullTree, locTree] = await Promise.all([api.getTree(true), api.getTree(false)]);
  const locationIdSet = collectLocationIds(locTree);

  const locations: CatalogLocation[] = [];
  const found = new Map<string, Found>();

  function walk(
    node: HbTreeItem,
    loc: Found["location"],
    container: { id: string; name: string } | null,
    depth: number,
  ) {
    for (const child of node.children ?? []) {
      if (locationIdSet.has(child.id)) {
        const path = [...loc.path, child.name];
        if (!locations.some((l) => l.id === child.id)) {
          locations.push({ id: child.id, name: child.name, path, depth: depth + 1, parentId: loc.id });
        }
        walk(
          child,
          { id: child.id, name: child.name, path, chain: [...loc.chain, child.id] },
          null,
          depth + 1,
        );
      } else {
        if (!found.has(child.id)) {
          found.set(child.id, {
            id: child.id,
            location: loc,
            containerId: container?.id ?? null,
            containerName: container?.name ?? null,
          });
        }
        walk(child, loc, { id: child.id, name: child.name }, depth);
      }
    }
  }

  for (const id of locationIds) {
    const node = findNode(fullTree, id);
    if (!node || !locationIdSet.has(id)) continue;
    if (!locations.some((l) => l.id === id)) {
      locations.push({ id, name: node.name, path: [node.name], depth: 0, parentId: null });
    }
    walk(node, { id, name: node.name, path: [node.name], chain: [id] }, null, 0);
  }

  const entries = [...found.values()];
  const entities = await mapLimit(entries, 8, (f) => api.getEntity(f.id).catch(() => null));

  const hidden = hiddenTag.trim().toLowerCase();
  const excluded = new Set<string>();
  entities.forEach((e, i) => {
    if (!e) return excluded.add(entries[i].id);
    const isHidden =
      e.archived ||
      e.entityType?.isLocation ||
      (hidden && (e.tags ?? []).some((t) => t.name.toLowerCase() === hidden));
    if (isHidden) excluded.add(e.id);
  });
  // Inhalt versteckter Container ebenfalls ausblenden (Container stehen im Baum vor ihrem Inhalt)
  for (const f of entries) {
    if (f.containerId && excluded.has(f.containerId)) excluded.add(f.id);
  }

  const items: CatalogItem[] = [];
  entities.forEach((e, i) => {
    if (e && !excluded.has(e.id)) items.push(toCatalogItem(e, entries[i]));
  });
  items.sort((a, b) => a.name.localeCompare(b.name, "de"));

  return { locations, items };
}

/** Einzelnes Item für den Admin-Bereich, ungecacht */
export async function getEntityFresh(id: string): Promise<HbEntity> {
  return homebox().getEntity(id);
}
