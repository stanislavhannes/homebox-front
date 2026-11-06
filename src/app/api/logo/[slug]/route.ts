import { isAdmin } from "@/lib/auth";
import { shrinkLogo } from "@/lib/logo-image";
import { getPageBySlug, getPageLogo, replacePageLogoBytes } from "@/lib/pages";

/**
 * Logo einer Page. Absichtlich ohne Passwort-Prüfung: Das Logo erscheint auch auf dem
 * Passwort-Formular. Unveröffentlichte Pages nur für den Admin.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/logo/[slug]">) {
  const { slug } = await ctx.params;
  const page = getPageBySlug(slug);
  if (!page || (!page.published && !(await isAdmin()))) {
    return new Response("Nicht gefunden", { status: 404 });
  }
  let logo = getPageLogo(page.id);
  if (!logo) return new Response("Nicht gefunden", { status: 404 });
  // Uploads von vor dem automatischen Verkleinern einmalig nachziehen
  if (logo.type !== "image/svg+xml" && logo.bytes.length > 120_000) {
    const small = await shrinkLogo(logo.bytes, logo.type);
    if (small.bytes.length < logo.bytes.length) {
      replacePageLogoBytes(page.id, small);
      logo = small;
    }
  }
  return new Response(new Uint8Array(logo.bytes), {
    headers: {
      "Content-Type": logo.type,
      // URL enthält ?v=<updatedAt>, daher lange cachebar
      "Cache-Control": page.published ? "public, max-age=31536000, immutable" : "private, max-age=60",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
