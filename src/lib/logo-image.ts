import "server-only";
import sharp from "sharp";

/** Logos werden höchstens ~64px hoch gezeigt; 256px reichen auch auf 3x-Displays. */
export const LOGO_MAX_PX = 256;

/**
 * Rastergrafiken auf höchstens 256×256 verkleinern und als WebP (mit Transparenz) speichern.
 * SVG bleibt unverändert. Bei Fehlern das Original zurückgeben.
 */
export async function shrinkLogo(bytes: Uint8Array, type: string): Promise<{ bytes: Uint8Array; type: string }> {
  if (type === "image/svg+xml") return { bytes, type };
  try {
    // Schon klein genug: nichts tun (sonst würde jeder Abruf neu rechnen)
    const meta = await sharp(bytes).metadata();
    if ((meta.width ?? 0) <= LOGO_MAX_PX && (meta.height ?? 0) <= LOGO_MAX_PX) return { bytes, type };
    const out = await sharp(bytes, { animated: false })
      .rotate()
      .resize({ width: LOGO_MAX_PX, height: LOGO_MAX_PX, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 88, alphaQuality: 100 })
      .toBuffer();
    return out.length < bytes.length ? { bytes: new Uint8Array(out), type: "image/webp" } : { bytes, type };
  } catch {
    return { bytes, type };
  }
}
