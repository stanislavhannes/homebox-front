import type { CSSProperties } from "react";

/** Bewährte Akzentfarben (Tailwind-Paletten, Stufe 600/700: guter Kontrast hell wie dunkel). */
export const ACCENT_PRESETS = [
  { value: "", label: "Neutral", swatch: "#18181b" },
  { value: "#2563eb", label: "Blau", swatch: "#2563eb" },
  { value: "#4f46e5", label: "Indigo", swatch: "#4f46e5" },
  { value: "#7c3aed", label: "Violett", swatch: "#7c3aed" },
  { value: "#c026d3", label: "Magenta", swatch: "#c026d3" },
  { value: "#0891b2", label: "Petrol", swatch: "#0891b2" },
  { value: "#ea580c", label: "Orange", swatch: "#ea580c" },
  { value: "#475569", label: "Schiefer", swatch: "#475569" },
] as const;

/*
 * Ampel-Regel: Grün und Rot bedeuten auf Pages „verfügbar“ und „verliehen“. Ein Akzent in diesen
 * Farbtönen würde Status vortäuschen. Solche Farben werden an den Rand der Zone geschoben
 * (Rot → Magenta/Orange-Seite, Grün → Lime/Petrol-Seite), Sättigung und Helligkeit bleiben.
 */
const STATUS_ZONES = [
  { name: "Rot", from: 340, to: 15 },
  { name: "Grün", from: 105, to: 170 },
] as const;

function toHsl(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return { h, s, l };
}

function fromHsl(h: number, s: number, l: number) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return "#" + [r, g, b].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("");
}

function inZone(h: number, z: { from: number; to: number }) {
  return z.from <= z.to ? h >= z.from && h <= z.to : h >= z.from || h <= z.to;
}

/** Liegt die Farbe in einer Status-Zone, wird sie zum näheren Rand verschoben. */
export function avoidStatusHues(hex: string): { color: string; zone: string | null } {
  const { h, s, l } = toHsl(hex);
  if (s < 0.25) return { color: hex, zone: null }; // Grautöne verwechselt niemand
  for (const z of STATUS_ZONES) {
    if (!inZone(h, z)) continue;
    const dist = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
    const target = dist(h, z.from) <= dist(h, z.to) ? z.from - 8 : z.to + 8;
    return { color: fromHsl((target + 360) % 360, s, l), zone: z.name };
  }
  return { color: hex, zone: null };
}

export function normalizeAccent(v: unknown): string | null {
  const s = String(v ?? "").trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(s) ? s : null;
}

/** Relative Luminanz nach WCAG */
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Schrift auf der Akzentfarbe: weiß oder fast schwarz, je nachdem was mehr Kontrast hat. */
export function accentForeground(hex: string) {
  const l = luminance(hex);
  return (1.05 / (l + 0.05)) >= ((l + 0.05) / 0.05) ? "#ffffff" : "#0a0a0a";
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function mix(hex: string, target: string, t: number) {
  const ch = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  return (
    "#" +
    [1, 3, 5]
      .map((i) => Math.round(ch(hex, i) * (1 - t) + ch(target, i) * t).toString(16).padStart(2, "0"))
      .join("")
  );
}

/**
 * Akzent so weit Richtung `target` schieben, bis er gegen `bg` mindestens `min` erreicht.
 * Die gewählte Farbe bleibt, wenn sie schon reicht.
 */
export function ensureContrast(hex: string, bg: string, target: string, min = 4.5) {
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const c = mix(hex, target, t);
    if (contrast(c, bg) >= min) return c;
  }
  return target;
}

/** Hell: gegen Papier (#ffffff). Dunkel: gegen die dunkle Karte (#171717). */
export function accentVariants(input: string) {
  const accent = avoidStatusHues(input).color;
  const light = ensureContrast(accent, "#ffffff", "#000000");
  const dark = ensureContrast(accent, "#171717", "#ffffff");
  return { light, lightFg: accentForeground(light), dark, darkFg: accentForeground(dark) };
}

/** CSS-Variablen für einen Bereich der Seite. null = Standard-Design. Aktiv über die Klasse `accent-custom`. */
export function accentStyle(accent: string | null): CSSProperties | undefined {
  if (!accent) return undefined;
  const v = accentVariants(accent);
  return {
    "--accent-l": v.light,
    "--accent-l-fg": v.lightFg,
    "--accent-d": v.dark,
    "--accent-d-fg": v.darkFg,
    "--accent-header": `color-mix(in oklab, ${avoidStatusHues(accent).color} 40%, #09090b)`,
  } as CSSProperties;
}
