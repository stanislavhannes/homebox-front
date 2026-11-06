import "server-only";
import { notFound } from "next/navigation";
import { isAdmin, isPageUnlocked } from "@/lib/auth";
import { getCatalog, type CatalogItem, type CatalogLocation, type FileType } from "@/lib/catalog";
import {
  availabilityLabel,
  computeAvailability,
  parseLoans,
  todayInBerlin,
  type Availability,
} from "@/lib/loans";
import { cleanFileTitle } from "@/lib/file-title";
import { getPageBySlug, getSettings, type PageConfig, type VisibleField } from "@/lib/pages";

/** Was der Browser über ein Item erfährt. Enthält nie Empfänger von Verleihen. */
export type PublicItem = {
  id: string;
  name: string;
  thumbUrl: string | null;
  status: Availability["status"];
  availabilityLabel: string;
  locationId: string;
  /** alle Lagerorte über dem Item (für den Filter) */
  locationChain: string[];
  locationName: string | null;
  containerName: string | null;
  description: string | null;
  manufacturer: string | null;
  modelNumber: string | null;
  tags: string[];
  /** Bedienungsanleitung vorhanden und freigegeben */
  hasManual: boolean;
};

export type PublicItemDetail = PublicItem & {
  photos: { url: string; thumbUrl: string; title: string }[];
  files: { url: string; title: string; kind: string; isPdf: boolean }[];
  facts: { label: string; value: string }[];
  notes: string | null;
  locationPath: string[] | null;
  availableCount: number | null;
  totalCount: number | null;
  nextReturn: string | null;
};

export type PublicPage = {
  slug: string;
  title: string;
  intro: string;
  layout: "A" | "B" | "C";
  contact: string;
  logoUrl: string | null;
  accent: string | null;
  howto: string;
};

export function imageUrl(slug: string, itemId: string, attId: string) {
  return `/api/img/${encodeURIComponent(slug)}/${encodeURIComponent(itemId)}/${encodeURIComponent(attId)}`;
}

/** Page laden und Zugriff prüfen. Unveröffentlichte Pages sieht nur der Admin. */
export async function loadPage(slug: string): Promise<{ page: PageConfig; unlocked: boolean }> {
  const page = getPageBySlug(slug);
  if (!page) notFound();
  if (!page.published && !(await isAdmin())) notFound();
  return { page, unlocked: await isPageUnlocked(page) };
}

export function toPublicPage(page: PageConfig): PublicPage {
  return {
    slug: page.slug,
    title: page.title,
    intro: page.intro,
    layout: page.layout,
    contact: page.contact,
    logoUrl: page.hasLogo ? logoUrl(page) : null,
    accent: page.accent,
    howto: page.howto,
  };
}

export function logoUrl(page: Pick<PageConfig, "slug" | "updatedAt">) {
  return `/api/logo/${encodeURIComponent(page.slug)}?v=${encodeURIComponent(page.updatedAt)}`;
}

export async function loadCatalog(page: PageConfig) {
  return getCatalog(page.locationIds, getSettings().hiddenTag);
}

function has(page: PageConfig, f: VisibleField) {
  return page.visibleFields.includes(f);
}

/** Welche Anhang-Art über welches Häkchen der Page freigegeben wird */
const FILE_FIELD: Record<FileType, VisibleField> = {
  manual: "manuals",
  attachment: "attachments",
  warranty: "warranty",
  receipt: "receipts",
};
const FILE_LABEL: Record<FileType, string> = {
  manual: "Anleitung",
  attachment: "Anhang",
  warranty: "Garantie",
  receipt: "Rechnung",
};
const FILE_ORDER: FileType[] = ["manual", "attachment", "warranty", "receipt"];

function visibleFiles(page: PageConfig, item: CatalogItem) {
  return item.files
    .filter((f) => has(page, FILE_FIELD[f.type]))
    .sort((a, b) => FILE_ORDER.indexOf(a.type) - FILE_ORDER.indexOf(b.type));
}

/** Darf dieser Anhang auf dieser Page ausgeliefert werden? (Bild-Proxy) */
export function isAttachmentAllowed(page: PageConfig, item: CatalogItem, attId: string) {
  return item.photoAttachmentIds.includes(attId) || visibleFiles(page, item).some((f) => f.id === attId);
}

export function toPublicItem(page: PageConfig, item: CatalogItem, today: string): PublicItem {
  const a = computeAvailability(item.quantity, parseLoans(item.loanText).loans, today);
  return {
    id: item.id,
    name: item.name,
    thumbUrl: item.thumbId ? imageUrl(page.slug, item.id, item.thumbId) : null,
    status: a.status,
    availabilityLabel: availabilityLabel(a, today, has(page, "quantity")),
    locationId: item.locationId,
    locationChain: item.locationChain,
    locationName: has(page, "location") ? item.locationName : null,
    containerName: has(page, "location") ? item.containerName : null,
    description: has(page, "description") ? item.description : null,
    manufacturer: has(page, "manufacturer") ? item.manufacturer : null,
    modelNumber: has(page, "modelNumber") ? item.modelNumber : null,
    tags: has(page, "tags") ? item.tags : [],
    hasManual: has(page, "manuals") && item.files.some((f) => f.type === "manual"),
  };
}

const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

export function toPublicDetail(
  page: PageConfig,
  item: CatalogItem,
  today: string,
): PublicItemDetail {
  const base = toPublicItem(page, item, today);
  const a = computeAvailability(item.quantity, parseLoans(item.loanText).loans, today);
  const facts: { label: string; value: string }[] = [];
  if (has(page, "manufacturer") && item.manufacturer) facts.push({ label: "Hersteller", value: item.manufacturer });
  if (has(page, "modelNumber") && item.modelNumber) facts.push({ label: "Modell", value: item.modelNumber });
  if (has(page, "purchasePrice") && item.purchasePrice) facts.push({ label: "Kaufpreis", value: euro.format(item.purchasePrice) });
  if (has(page, "assetId") && item.assetId) facts.push({ label: "Asset-ID", value: item.assetId });
  if (has(page, "customFields")) facts.push(...item.customFields.map((f) => ({ label: f.name, value: f.value })));

  return {
    ...base,
    photos: item.photos.map((p) => ({
      url: imageUrl(page.slug, item.id, p.id),
      thumbUrl: imageUrl(page.slug, item.id, p.thumbId ?? p.id),
      title: p.title,
    })),
    files: visibleFiles(page, item).map((f) => ({
      url: imageUrl(page.slug, item.id, f.id),
      title: cleanFileTitle(f.title) ?? FILE_LABEL[f.type],
      kind: FILE_LABEL[f.type],
      isPdf: f.mimeType === "application/pdf" || /\.pdf$/i.test(f.title),
    })),
    facts,
    notes: has(page, "notes") && item.notes ? item.notes : null,
    locationPath: has(page, "location")
      ? [...item.locationPath, ...(item.containerName ? [item.containerName] : [])]
      : null,
    availableCount: has(page, "quantity") ? a.available : null,
    totalCount: has(page, "quantity") ? a.total : null,
    nextReturn: a.nextReturn,
  };
}

export function publicLocations(locations: CatalogLocation[], items: PublicItem[]) {
  // Nur Lagerorte zeigen, unter denen tatsächlich etwas liegt
  const counts = new Map<string, number>();
  for (const it of items) {
    for (const id of it.locationChain) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  // Bei genau einem gewählten Wurzel-Lagerort ist dieser als Filter überflüssig (= "Alle")
  const roots = locations.filter((l) => l.depth === 0);
  const dropRoot = roots.length === 1;
  return locations
    .filter((l) => !(dropRoot && l.depth === 0))
    .map((l) => ({
      id: l.id,
      name: l.name,
      depth: dropRoot ? l.depth - 1 : l.depth,
      count: counts.get(l.id) ?? 0,
    }))
    .filter((l) => l.count > 0);
}

export { todayInBerlin };
