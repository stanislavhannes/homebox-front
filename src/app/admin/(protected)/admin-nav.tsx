"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Pages", match: (p: string) => p === "/admin" || p.startsWith("/admin/pages") },
  { href: "/admin/loans", label: "Verleih", match: (p: string) => p.startsWith("/admin/loans") },
  { href: "/admin/settings", label: "Einstellungen", match: (p: string) => p.startsWith("/admin/settings") },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1">
      {LINKS.map((l) => {
        const active = l.match(pathname);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors max-sm:py-2.5",
              active
                ? "bg-[var(--admin-active-bg)] font-medium text-[var(--admin-active-text)]"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
