import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { unlockPage, verifyPageAccessKey } from "@/lib/auth";
import { getPageBySlug } from "@/lib/pages";

/**
 * Direktlink mit Zugangsschlüssel: /<slug>/zugang?k=<schlüssel>
 * Stimmt der Schlüssel, wird die Page wie nach der Passworteingabe freigeschaltet.
 * Sonst landet man einfach auf der normalen Page (mit Passwortfeld).
 */
export async function GET(request: NextRequest, { params }: RouteContext<"/[slug]/zugang">) {
  const { slug } = await params;
  const page = getPageBySlug(slug);
  const key = request.nextUrl.searchParams.get("k") ?? "";
  if (page?.published && verifyPageAccessKey(page, key)) await unlockPage(page);
  redirect(`/${encodeURIComponent(slug)}`);
}
