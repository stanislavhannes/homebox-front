/**
 * Anhangstitel aus Homebox sind oft abgeschnittene Dateinamen („Google Drive)“). Unpaarige
 * Klammern und Satzzeichen am Rand weg; bleibt kaum Text übrig, null (dann Art als Titel).
 */
export function cleanFileTitle(title: string): string | null {
  let t = title.trim();
  for (let i = 0; i < 3; i++) {
    const before = t;
    if ((t.match(/\(/g)?.length ?? 0) < (t.match(/\)/g)?.length ?? 0)) t = t.replace(/\)\s*$/, "").replace(/^\s*\)/, "");
    if ((t.match(/\(/g)?.length ?? 0) > (t.match(/\)/g)?.length ?? 0)) t = t.replace(/^\s*\(/, "").replace(/\(\s*$/, "");
    t = t.replace(/^[\s\-–—_.,:;|]+|[\s\-–—_,:;|]+$/g, "").trim();
    if (t === before) break;
  }
  return (t.match(/\p{L}/gu)?.length ?? 0) >= 3 ? t : null;
}
