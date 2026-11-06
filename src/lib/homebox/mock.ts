import "server-only";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { HomeboxApi } from "./client";
import type { HbEntity, HbTreeItem } from "./types";

/**
 * Testdaten für HOMEBOX_MOCK=1: lokale Entwicklung ohne Homebox-Token.
 * Schreibvorgänge landen nur im Speicher und sind nach einem Neustart weg.
 */

type Seed = {
  id: string;
  name: string;
  parent?: string;
  location?: boolean;
  quantity?: number;
  description?: string;
  manufacturer?: string;
  modelNumber?: string;
  notes?: string;
  price?: number;
  tags?: string[];
  loan?: string;
  photos?: number;
  manual?: boolean;
  /** weitere Anhänge [typ, titel] */
  files?: [string, string][];
};

function inDays(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000);
  return d.toISOString().slice(0, 10);
}

const seeds: Seed[] = [
  { id: "loc-kollektiv", name: "Kollektiv Lager", location: true },
  { id: "loc-licht", name: "Licht", parent: "loc-kollektiv", location: true },
  { id: "loc-ton", name: "Ton", parent: "loc-kollektiv", location: true },
  { id: "loc-deko", name: "Deko & Möbel", parent: "loc-kollektiv", location: true },
  { id: "loc-garage", name: "Stanis Garage Zuhause", location: true },
  { id: "loc-werkbank", name: "Werkbank", parent: "loc-garage", location: true },
  { id: "loc-privat", name: "Privatkram", location: true },

  { id: "it-nebel", name: "Nebelmaschine 1500 W", parent: "loc-licht", manufacturer: "Stairville", modelNumber: "AF-150", description: "**Kräftige Nebelmaschine** mit Fernbedienung und DMX.\n\n## Lieferumfang\n- Kabelfernbedienung\n- DMX-Kabel 3 m\n- ~~Fluid~~ ist *nicht* dabei\n\n| Leistung | Aufheizzeit |\n|---|---|\n| 1500 W | 8 min |\n\nMehr Infos: https://www.stairville.com\n\n<script>alert(1)</script>", price: 189, tags: ["Licht"], photos: 3, manual: true, files: [["attachment", "Zubehörliste.pdf"], ["receipt", "Rechnung Thomann.pdf"], ["warranty", "Garantiekarte.pdf"]] },
  { id: "it-spots", name: "LED Spot (4er Set)", parent: "loc-licht", quantity: 4, manufacturer: "Eurolite", modelNumber: "LED PAR-56", description: "RGB-Spots inkl. Stative, DMX-fähig.", tags: ["Licht"], loan: `2× bis ${inDays(8)} (Max)`, photos: 2 },
  { id: "it-case", name: "Flightcase Moving Heads", parent: "loc-licht", description: "Case mit 2 Moving Heads.", tags: ["Licht"], photos: 1 },
  { id: "it-mh", name: "Moving Head Spot 60 W", parent: "it-case", quantity: 2, manufacturer: "Stairville", modelNumber: "MH-X60", tags: ["Licht"], photos: 1 },
  { id: "it-dmx", name: "DMX Controller", parent: "loc-licht", manufacturer: "Akai", modelNumber: "APC mini", tags: ["Licht"], photos: 1 },
  { id: "it-pa", name: "PA Box 15\" aktiv", parent: "loc-ton", quantity: 2, manufacturer: "the box pro", modelNumber: "Achat 115", description: "Aktive 2-Wege-Box, 15 Zoll, 400 W RMS.", price: 349, tags: ["Ton"], loan: `2× bis ${inDays(3)} (Kollektiv Y)`, photos: 2, manual: true },
  { id: "it-mixer", name: "Mischpult 12 Kanal", parent: "loc-ton", manufacturer: "Behringer", modelNumber: "Xenyx 1204", tags: ["Ton"], photos: 1 },
  { id: "it-kabel", name: "XLR-Kabel 10 m", parent: "loc-ton", quantity: 12, tags: ["Ton", "Kabel"], loan: `4× bis ${inDays(-2)} (alt)`, photos: 0 },
  { id: "it-bank", name: "Bierzeltgarnitur", parent: "loc-deko", quantity: 10, description: "Tisch + 2 Bänke, 220 cm.", tags: ["Möbel"], loan: `6× bis ${inDays(5)} (Lena); 2× bis ${inDays(12)}`, photos: 1 },
  { id: "it-pavillon", name: "Pavillon 3×6 m", parent: "loc-deko", tags: ["Möbel"], loan: `bis ${inDays(20)} (Tom)`, photos: 1 },
  { id: "it-lichterkette", name: "Lichterkette 20 m", parent: "loc-deko", quantity: 3, tags: ["Deko", "Licht"], photos: 1 },

  { id: "it-gks", name: "Bosch Professional GKS 190 Handkreissäge", parent: "loc-garage", manufacturer: "Bosch Professional", modelNumber: "GKS 190", price: 114, notes: "Produktseite: https://www.bosch-professional.com/de/de/products/gks-190-0601623000", tags: ["Werkzeug"], photos: 3, manual: true },
  { id: "it-hdr", name: "PARKSIDE PERFORMANCE Hochdruckreiniger PHDP 180 D3", parent: "loc-garage", manufacturer: "Parkside", modelNumber: "PHDP 180 D3", tags: ["Werkzeug"], loan: `bis ${inDays(1)} (Nachbar)`, photos: 1 },
  { id: "it-bohr", name: "Akku-Bohrschrauber 18 V", parent: "loc-werkbank", manufacturer: "Makita", modelNumber: "DDF485", tags: ["Werkzeug"], photos: 1 },
  { id: "it-stich", name: "Stichsäge", parent: "loc-werkbank", tags: ["Werkzeug"], photos: 0 },
  { id: "it-geheim", name: "Tagebuch", parent: "loc-werkbank", tags: ["privat"], photos: 0 },
  { id: "it-archiv", name: "Alte Bohrmaschine (archiviert)", parent: "loc-werkbank", photos: 0 },
  { id: "it-privat", name: "Steuerordner", parent: "loc-privat", photos: 0 },
  // Viele Kleinteile, damit die Paginierung im Mock etwas zu tun hat
  { id: "loc-regal", name: "Werkzeugregal", parent: "loc-garage", location: true },
  ...[
    "Akkuschrauber 12 V", "Winkelschleifer 125 mm", "Exzenterschleifer", "Bandschleifer", "Oberfräse",
    "Kappsäge", "Tischkreissäge", "Säbelsäge", "Multitool oszillierend", "Heißluftfön",
    "Heißklebepistole", "Lötstation", "Multimeter", "Laser-Entfernungsmesser", "Kreuzlinienlaser",
    "Wasserwaage 120 cm", "Schraubzwingen (6er Set)", "Ratschenkasten 1/2\"", "Drehmomentschlüssel", "Bit-Set 100-teilig",
    "Bohrhammer SDS-plus", "Fliesenschneider", "Tapetenablöser", "Farbsprühsystem", "Nass-/Trockensauger",
    "Kompressor 50 l", "Stehleiter 6 Stufen", "Gerüstbock (2 Stück)", "Spanngurte (8er Set)", "Sackkarre",
    // Randfall: sehr langer Name mit Emoji und Kompositum
    "🔧 Hochleistungs-Akkuwinkelschleiferaufsatzadapterset für Edelstahlrohrbearbeitung inkl. Transportkoffer, Ersatzscheiben und Bedienungsanleitung (2. Generation)",
  ].map((name, i): Seed => ({
    id: `it-regal-${i + 1}`,
    name,
    parent: "loc-regal",
    tags: ["Werkzeug"],
    photos: i % 3 === 0 ? 0 : 1,
    ...(i % 7 === 3 ? { loan: `bis ${inDays(4 + i)} (Freund ${i})` } : {}),
  })),
];

const tagIds = new Map<string, string>();
function tag(name: string) {
  if (!tagIds.has(name)) tagIds.set(name, `tag-${tagIds.size + 1}`);
  return { id: tagIds.get(name)!, name };
}

/**
 * Beispielfotos (KI-generiert, frei verwendbar) unter mock-photos/<item-id>.webp, weitere
 * Ansichten als <item-id>-2.webp usw. Ohne Datei gibt es den farbigen SVG-Platzhalter.
 */
const PHOTO_DIR = join(/*turbopackIgnore: true*/ process.cwd(), "src/lib/homebox/mock-photos");

function photoFile(itemId: string, n: number): string | null {
  const f = join(PHOTO_DIR, n === 1 ? `${itemId}.webp` : `${itemId}-${n}.webp`);
  return existsSync(f) ? f : null;
}

/** Anzahl Fotos: echte Dateien, wenn vorhanden (keine Doppelten), sonst wie im Seed */
function photoCount(s: Seed): number {
  if (!photoFile(s.id, 1)) return s.photos ?? 0;
  let n = 1;
  while (photoFile(s.id, n + 1)) n++;
  return n;
}

function build(): Map<string, HbEntity> {
  const byId = new Map(seeds.map((s) => [s.id, s]));
  const store = new Map<string, HbEntity>();
  for (const s of seeds) {
    const parent = s.parent ? byId.get(s.parent) : undefined;
    const attachments = [
      ...Array.from({ length: photoCount(s) }, (_, i) => ({
        id: `${s.id}-photo-${i + 1}`,
        type: "photo",
        title: `${s.name} – Foto ${i + 1}`,
        mimeType: photoFile(s.id, i + 1) ? "image/webp" : "image/svg+xml",
        primary: i === 0,
      })),
      ...(s.manual
        ? [{ id: `${s.id}-manual`, type: "manual", title: `Bedienungsanleitung ${s.name}`, mimeType: "application/pdf" }]
        : []),
      ...(s.files ?? []).map(([type, title], i) => ({
        id: `${s.id}-file-${i + 1}`,
        type,
        title,
        mimeType: "application/pdf",
      })),
    ];
    store.set(s.id, {
      id: s.id,
      name: s.name,
      assetId: `000-${String(store.size + 1).padStart(3, "0")}`,
      description: s.description ?? "",
      notes: s.notes ?? "",
      quantity: s.quantity ?? 1,
      archived: s.id === "it-archiv",
      manufacturer: s.manufacturer ?? "",
      modelNumber: s.modelNumber ?? "",
      purchasePrice: s.price ?? 0,
      entityType: s.location
        ? { id: "type-location", name: "global.location", isLocation: true }
        : { id: "type-item", name: "global.item", isLocation: false },
      parent: parent ? { id: parent.id, name: parent.name } : null,
      tags: (s.tags ?? []).map(tag),
      fields: s.loan ? [{ id: `${s.id}-f`, name: "Verleih", type: "text", textValue: s.loan }] : [],
      attachments,
      imageId: attachments[0]?.type === "photo" ? attachments[0].id : undefined,
      thumbnailId: attachments[0]?.type === "photo" ? attachments[0].id : undefined,
    });
  }
  return store;
}

const g = globalThis as unknown as { __hbMock?: Map<string, HbEntity> };
function store() {
  g.__hbMock ??= build();
  return g.__hbMock;
}

function tree(withItems: boolean): HbTreeItem[] {
  const all = [...store().values()];
  const node = (e: HbEntity): HbTreeItem => ({
    id: e.id,
    name: e.name,
    type: e.entityType?.isLocation ? "location" : "item",
    children: all
      .filter((c) => c.parent?.id === e.id && (withItems || c.entityType?.isLocation))
      .map(node),
  });
  return all.filter((e) => !e.parent && e.entityType?.isLocation).map(node);
}

const COLORS = ["#f97316", "#8b5cf6", "#06b6d4", "#22c55e", "#e11d48", "#eab308"];

function placeholderSvg(title: string): string {
  let h = 0;
  for (const c of title) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const color = COLORS[h % COLORS.length];
  const label = title.replace(/[<&>"]/g, "").slice(0, 28);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".9"/><stop offset="1" stop-color="${color}" stop-opacity=".45"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><text x="400" y="315" font-family="system-ui,sans-serif" font-size="34" fill="#fff" text-anchor="middle">${label}</text></svg>`;
}

export const mockApi: HomeboxApi = {
  async getTree(withItems) {
    return tree(withItems);
  },
  async getEntity(id) {
    const e = store().get(id);
    if (!e) throw new Error(`Mock: Entity ${id} nicht gefunden`);
    return structuredClone(e);
  },
  async putEntity(id, body) {
    const e = store().get(id);
    if (!e) throw new Error(`Mock: Entity ${id} nicht gefunden`);
    const updated: HbEntity = { ...e, fields: (body.fields as HbEntity["fields"]) ?? [] };
    store().set(id, updated);
    return structuredClone(updated);
  },
  async getAttachment(entityId, attachmentId) {
    const e = store().get(entityId);
    const a = e?.attachments?.find((x) => x.id === attachmentId);
    if (!a) throw new Error("Mock: Anhang nicht gefunden");
    if (a.type !== "photo") {
      const pdf = "%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 144]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF";
      return { body: new TextEncoder().encode(pdf).buffer as ArrayBuffer, contentType: "application/pdf" };
    }
    const n = Number(attachmentId.match(/-photo-(\d+)$/)?.[1] ?? 1);
    const file = photoFile(entityId, n);
    if (file) {
      const buf = readFileSync(file);
      return { body: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, contentType: "image/webp" };
    }
    return {
      body: new TextEncoder().encode(placeholderSvg(a.title)).buffer as ArrayBuffer,
      contentType: "image/svg+xml",
    };
  },
};
