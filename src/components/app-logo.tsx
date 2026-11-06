import { cn } from "@/lib/utils";

/** App-Logo: die Homebox-Box mit Laden-Markise (Homebox × Storefront). Datei: public/logo.svg */
export function AppLogo({ className }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- statisches SVG
  return <img src="/logo.svg" alt="" aria-hidden className={cn("size-8 shrink-0", className)} />;
}
