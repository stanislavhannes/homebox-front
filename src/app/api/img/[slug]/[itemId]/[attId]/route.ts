import { isAdmin, isPageUnlocked } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { homebox } from "@/lib/homebox/client";
import { getPageBySlug, getSettings } from "@/lib/pages";
import { isAttachmentAllowed } from "@/lib/public-view";
import { sniffContentType } from "@/lib/sniff";

/**
 * Bild-/Anhang-Proxy. Liefert einen Homebox-Anhang nur aus, wenn
 *  - die Page veröffentlicht ist (oder der Admin fragt),
 *  - die Page freigeschaltet ist (Passwort),
 *  - das Item auf dieser Page liegt und
 *  - der Anhang zu diesem Item gehört (Fotos, Thumbnails, Anleitungen).
 * Der Slug "_admin" ist für den Admin-Bereich und prüft nur die Admin-Session.
 */

const notFound = () => new Response("Nicht gefunden", { status: 404 });

export async function GET(_req: Request, ctx: RouteContext<"/api/img/[slug]/[itemId]/[attId]">) {
  const { slug, itemId, attId } = await ctx.params;

  if (slug === "_admin") {
    if (!(await isAdmin())) return notFound();
  } else {
    const page = getPageBySlug(slug);
    if (!page) return notFound();
    if (!page.published && !(await isAdmin())) return notFound();
    if (!(await isPageUnlocked(page))) return new Response("Passwort nötig", { status: 401 });
    const catalog = await getCatalog(page.locationIds, getSettings().hiddenTag).catch(() => null);
    const item = catalog?.items.find((i) => i.id === itemId);
    if (!item || !isAttachmentAllowed(page, item, attId)) return notFound();
  }

  let file;
  try {
    file = await homebox().getAttachment(itemId, attId);
  } catch (err) {
    console.error("[img] Anhang nicht ladbar", itemId, attId, (err as Error).message);
    return notFound();
  }
  const contentType = sniffContentType(file.body, file.contentType);
  const isInline = contentType.startsWith("image/") || contentType === "application/pdf";
  return new Response(file.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": isInline ? "inline" : "attachment",
      "Cache-Control": slug === "_admin" ? "private, max-age=300" : "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      // SVGs aus fremder Quelle dürfen kein Skript ausführen
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
