import type { Metadata } from "next";
import { Suspense } from "react";
import { AccentScope } from "@/components/shop/accent-scope";
import { PasswordForm } from "@/components/shop/password-form";
import { ShopView } from "@/components/shop/shop-view";
import { HomeboxUnavailable, ShopSkeleton } from "@/components/shop/states";
import { getPageBySlug } from "@/lib/pages";
import {
  loadCatalog,
  loadPage,
  publicLocations,
  todayInBerlin,
  toPublicItem,
  toPublicPage,
} from "@/lib/public-view";

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = getPageBySlug(slug);
  return { title: page?.published ? page.title : "Nicht gefunden" };
}

export default function ShopPage({ params }: PageProps<"/[slug]">) {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopContent params={params} />
    </Suspense>
  );
}

async function ShopContent({ params }: Pick<PageProps<"/[slug]">, "params">) {
  const { slug } = await params;
  const { page, unlocked } = await loadPage(slug);
  return (
    <AccentScope accent={page.accent}>
      <ShopContentInner page={page} unlocked={unlocked} />
    </AccentScope>
  );
}

async function ShopContentInner({
  page,
  unlocked,
}: {
  page: Awaited<ReturnType<typeof loadPage>>["page"];
  unlocked: boolean;
}) {
  if (!unlocked) return <PasswordForm slug={page.slug} title={page.title} logoUrl={toPublicPage(page).logoUrl} />;

  let catalog;
  try {
    catalog = await loadCatalog(page);
  } catch (err) {
    console.error("[shop] Homebox-Fehler", err);
    return <HomeboxUnavailable />;
  }
  const today = todayInBerlin();
  const items = catalog.items.map((it) => toPublicItem(page, it, today));
  // Liegt alles am selben Ort, sagt der Lagerort auf jeder Karte nichts
  if (new Set(items.map((i) => i.locationName)).size <= 1) for (const i of items) i.locationName = null;
  return (
    <ShopView
      page={toPublicPage(page)}
      locations={publicLocations(catalog.locations, items)}
      items={items}
    />
  );
}
