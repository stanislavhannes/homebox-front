import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AppLogo } from "@/components/app-logo";
import { logoutAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { AdminNav } from "./admin-nav";

// Admin prüft bei jedem Aufruf die Session (Cookie + Ablaufzeit) und darf deshalb blockieren.
export const instant = false;

export const metadata: Metadata = { title: { default: "Verwaltung", template: "%s · Verwaltung" } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="admin-theme flex flex-1 flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <AppLogo className="size-7" /> Homebox Front
          </Link>
          <Suspense fallback={<nav className="h-8" />}>
            <AdminNav />
          </Suspense>
          <form action={logoutAction} className="ml-auto">
            <Button type="submit" variant="ghost" size="sm">
              Abmelden
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Lädt…</p>}>{children}</Suspense>
      </main>
    </div>
  );
}
