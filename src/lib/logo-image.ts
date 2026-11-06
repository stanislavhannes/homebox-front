import "server-only";
import sharp from "sharp";

/** Logos werden höchstens in ~64px Höhe gezeigt; 512px reicht auch für scharfe Retina-Darstellung. */
const MAX = 512;

/**
 * Rastergrafiken auf höchstens 512×512 verkleinern und als WebP (mit Transparenz) speichern.
 * SVG bleibt unverändert. Bei Fehlern das Original zurückgeben.
 */
export async function shrinkLogo(bytes: Uint8Array, type: string): Promise<{ bytes: Uint8Array; type: string }> {
  if (type === "image/svg+xml") return { bytes, type };
  try {
    const out = await sharp(bytes, { animated: false })
      .rotate()
      .resize({ width: MAX, height: MAX, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 88, alphaQuality: 100 })
      .toBuffer();
    return out.length < bytes.length ? { bytes: new Uint8Array(out), type: "image/webp" } : { bytes, type };
  } catch {
    return { bytes, type };
  }
}
