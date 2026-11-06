/** Content-Type per Magic Bytes, weil Dateiendungen und Header oft lügen. */
const SNIFF: [number[], string][] = [
  [[0xff, 0xd8, 0xff], "image/jpeg"],
  [[0x89, 0x50, 0x4e, 0x47], "image/png"],
  [[0x47, 0x49, 0x46, 0x38], "image/gif"],
  [[0x25, 0x50, 0x44, 0x46], "application/pdf"],
];

export function sniffContentType(buf: ArrayBuffer, fallback: string | null): string {
  const bytes = new Uint8Array(buf.slice(0, 16));
  for (const [sig, type] of SNIFF) {
    if (sig.every((b, i) => bytes[i] === b)) return type;
  }
  // RIFF....WEBP
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[8] === 0x57 && bytes[9] === 0x45) return "image/webp";
  // ....ftypavif / heic
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    if (brand.startsWith("avi")) return "image/avif";
    if (brand.startsWith("hei") || brand.startsWith("mif")) return "image/heic";
  }
  const head = new TextDecoder().decode(bytes).trimStart();
  if (head.startsWith("<svg") || head.startsWith("<?xml")) return "image/svg+xml";
  return fallback && fallback !== "application/octet-stream" ? fallback : "application/octet-stream";
}
