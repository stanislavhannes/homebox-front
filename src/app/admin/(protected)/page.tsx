import Link from "next/link";
import { ExternalLinkIcon, LockIcon, PlusIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/admin-guard";
import { pageAccessKey } from "@/lib/auth";
import { getLocationTree, type LocationNode } from "@/lib/catalog";
import { listPages } from "@/lib/pages";
import { cn } from "@/lib/utils";
import { CopyLinkButton } from "./copy-link-button";

// Prüft die Admin-Session bei jedem Aufruf, darf daher blockieren.
export const instant = false;

export default async function AdminPagesList() {
  await requireAdminPage();
  const pages = listPages();
  const names = new Map<string, string>();
  try {
    const walk = (nodes: LocationNode[]) =>
      nodes.forEach((n) => {
        names.set(n.id, n.path.join(" › "));
        walk(n.children);
      });
    walk(await getLocationTree());
  } catch {
    // Homebox nicht erreichbar: dann eben ohne Namen
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pages</h1>
          <p className="text-sm text-muted-foreground">Jede Page hat einen eigenen Link und zeigt einen oder mehrere Lagerorte.</p>
        </div>
        <Link href="/admin/pages/new" className={buttonVariants()}>
          <PlusIcon /> Neue Page
        </Link>
      </div>

      {pages.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-14 text-center">
          <p className="font-medium">Noch keine Pages</p>
          <p className="mt-1 text-sm text-muted-foreground">Leg die erste an, z. B. „Kollektiv Party-Stuff“.</p>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {pages.map((p) => {
            const accessKey = pageAccessKey(p);
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/pages/${p.id}`} className="font-medium hover:underline">
                    {p.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                    <span className="font-mono">/{p.slug}</span>
                    <span>Layout {p.layout}</span>
                    {p.passwordHash && (
                      <span className="inline-flex items-center gap-1">
                        <LockIcon className="size-3" /> Passwort
                      </span>
                    )}
                    {!p.published && <span className="text-amber-600 dark:text-amber-400">nicht veröffentlicht</span>}
                    {!p.howto.trim() && <span className="text-[var(--admin-active-text)]">„So läuft&apos;s“ fehlt</span>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.locationIds.map((id) => names.get(id) ?? "unbekannter Lagerort").join(", ")}
                  </p>
                </div>
                <CopyLinkButton slug={p.slug} />
                {accessKey && <CopyLinkButton slug={p.slug} accessKey={accessKey} />}
                <Link
                  href={`/${p.slug}`}
                  target="_blank"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "max-md:h-10")}
                >
                  Ansehen <ExternalLinkIcon />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
