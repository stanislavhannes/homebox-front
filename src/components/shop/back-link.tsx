"use client";

import Link from "next/link";

/**
 * Zurück zur Übersicht. Kam man von dort, geht es per Verlauf zurück, damit Suche, Filter und
 * Scrollposition erhalten bleiben. Sonst (direkt geöffneter Link) normal zur Page.
 */
export function BackLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        try {
          const ref = new URL(document.referrer);
          if (ref.origin === location.origin && ref.pathname === href) {
            e.preventDefault();
            history.back();
          }
        } catch {
          // kein Referrer: normaler Link
        }
      }}
    >
      {children}
    </Link>
  );
}
