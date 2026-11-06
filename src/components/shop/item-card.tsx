import Link from "next/link";
import { BookOpenIcon, PackageIcon } from "lucide-react";
import type { PublicItem } from "@/lib/public-view";
import { AvailabilityBadge } from "./availability-badge";

/**
 * Auf Karten und Zeilen nur Ausnahmen zeigen: „Verliehen bis …“ und „2 von 10 verfügbar“.
 * Verfügbar ist der Normalfall und wird nur für Screenreader genannt.
 */
function StatusMark({ item, className }: { item: PublicItem; className?: string }) {
  if (item.status === "available") return <span className="sr-only">{item.availabilityLabel}</span>;
  return <AvailabilityBadge status={item.status} label={item.availabilityLabel} className={className} />;
}

export function ItemRow({ item, slug }: { item: PublicItem; slug: string }) {
  const subtitle = [item.manufacturer, item.modelNumber].filter(Boolean).join(" · ");
  return (
    <Link
      href={`/${slug}/item/${item.id}`}
      className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50 focus-visible:bg-muted/60 focus-visible:outline-none"
    >
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Bilder kommen über den eigenen Proxy
          <img src={item.thumbUrl} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground/60">
            <PackageIcon className="size-6" strokeWidth={1.25} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold">{item.name}</h3>
        <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          {item.hasManual && (
            <BookOpenIcon className="size-3 shrink-0" aria-label="Mit Bedienungsanleitung" />
          )}
          <span className="truncate">{[subtitle, item.locationName].filter(Boolean).join(" · ")}</span>
        </p>
      </div>
      <StatusMark item={item} className="shrink-0" />
    </Link>
  );
}

export function ItemCard({ item, slug }: { item: PublicItem; slug: string }) {
  const subtitle = [item.manufacturer, item.modelNumber].filter(Boolean).join(" · ");
  return (
    <Link
      href={`/${slug}/item/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {item.thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Bilder kommen über den eigenen Proxy
          <img
            src={item.thumbUrl}
            alt=""
            loading="lazy"
            className="size-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground/60">
            <PackageIcon className="size-10" strokeWidth={1.25} />
          </div>
        )}
        {item.status === "unavailable" && (
          <div className="absolute inset-0 bg-background/40 backdrop-grayscale" aria-hidden />
        )}
        {item.hasManual && (
          <span
            title="Mit Bedienungsanleitung"
            className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium shadow-xs"
          >
            <BookOpenIcon className="size-3" /> Anleitung
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="space-y-0.5">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-pretty">{item.name}</h3>
          {subtitle && <p className="line-clamp-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
          <StatusMark item={item} />
          {item.locationName && (
            <span className="truncate text-xs text-muted-foreground">{item.locationName}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
