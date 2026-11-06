"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDownIcon, MessageCircleIcon, PackageSearchIcon, SearchIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LinkifiedText } from "@/components/linkified-text";
import type { PublicItem, PublicPage } from "@/lib/public-view";
import { DEFAULT_CONTACT_TITLE } from "@/lib/contact";
import { cn } from "@/lib/utils";
import { ItemCard, ItemRow } from "./item-card";
import { PageLogo } from "./page-logo";

export type ShopLocation = { id: string; name: string; depth: number; count: number };

type Props = {
  page: PublicPage;
  locations: ShopLocation[];
  items: PublicItem[];
};

/** So viele Kacheln auf einmal; teilbar durch 2, 3 und 4 Spalten */
export const PAGE_SIZE = 24;

function normalize(s: string) {
  return s.toLocaleLowerCase("de").normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/**
 * Suche und Filter. Der Zustand steht im Link (?q=…&ort=…&frei=1), damit man eine gefilterte
 * Ansicht weiterschicken kann und sie beim Zurückkommen erhalten bleibt.
 */
function useFilteredItems(items: PublicItem[], locationIds: Set<string>, tagNames: Set<string>) {
  const params = useSearchParams();
  const [query, setQueryRaw] = useState(() => params.get("q") ?? "");
  const [locationId, setLocationIdRaw] = useState<string | null>(() => {
    const ort = params.get("ort");
    return ort && locationIds.has(ort) ? ort : null;
  });
  const [onlyAvailable, setOnlyAvailableRaw] = useState(() => params.get("frei") === "1");
  const [tag, setTagRaw] = useState<string | null>(() => {
    const t = params.get("tag");
    return t && tagNames.has(t) ? t : null;
  });
  const [limit, setLimit] = useState(PAGE_SIZE);
  // Jede Filteränderung fängt wieder bei der ersten Seite an
  const setQuery = (v: string) => (setQueryRaw(v), setLimit(PAGE_SIZE));
  const setLocationId = (v: string | null) => (setLocationIdRaw(v), setLimit(PAGE_SIZE));
  const setOnlyAvailable = (v: boolean) => (setOnlyAvailableRaw(v), setLimit(PAGE_SIZE));
  const setTag = (v: string | null) => (setTagRaw(v), setLimit(PAGE_SIZE));
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const url = new URL(window.location.href);
    const set = (k: string, v: string | null) => (v ? url.searchParams.set(k, v) : url.searchParams.delete(k));
    set("q", deferredQuery.trim() || null);
    set("ort", locationId);
    set("frei", onlyAvailable ? "1" : null);
    set("tag", tag);
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
  }, [deferredQuery, locationId, onlyAvailable, tag]);

  const index = useMemo(
    () =>
      items.map((it) =>
        normalize(
          [it.name, it.description, it.manufacturer, it.modelNumber, it.locationName, ...it.tags]
            .filter(Boolean)
            .join(" "),
        ),
      ),
    [items],
  );

  const filtered = useMemo(() => {
    const terms = normalize(deferredQuery).split(/\s+/).filter(Boolean);
    return items.filter((it, i) => {
      if (locationId && !it.locationChain.includes(locationId)) return false;
      if (onlyAvailable && it.status === "unavailable") return false;
      if (tag && !it.tags.includes(tag)) return false;
      return terms.every((t) => index[i].includes(t));
    });
  }, [items, index, deferredQuery, locationId, onlyAvailable, tag]);

  const showMore = () => setLimit((l) => l + PAGE_SIZE);
  return {
    query,
    setQuery,
    locationId,
    setLocationId,
    onlyAvailable,
    setOnlyAvailable,
    tag,
    setTag,
    filtered,
    visible: filtered.slice(0, limit),
    showMore,
  };
}

function SearchField({
  value,
  onChange,
  className,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <div className={cn("relative", className)}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Suchen…"
        aria-label="Suchen"
        enterKeyHint="search"
        className="h-11 pr-11 pl-9 text-base md:h-10 md:text-sm [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Suche leeren"
          className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
        >
          <XIcon className="size-4" />
        </button>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm whitespace-nowrap transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function AvailableToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-primary"
      />
      Nur verfügbare
    </label>
  );
}

function FilterChips({
  locations,
  f,
  className,
}: {
  locations: ShopLocation[];
  f: ReturnType<typeof useFilteredItems>;
  className?: string;
}) {
  if (locations.length <= 1) return null;
  return (
    <div role="group" aria-label="Lagerort" className={cn("-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0", className)}>
      <span className="shrink-0 self-center pr-1 text-xs font-medium text-muted-foreground">Lagerort</span>
      <Chip active={f.locationId === null} onClick={() => f.setLocationId(null)}>
        Alle
      </Chip>
      {locations.map((l) => (
        <Chip key={l.id} active={f.locationId === l.id} onClick={() => f.setLocationId(l.id)}>
          {l.name} <span className="tabular-nums opacity-80">{l.count}</span>
        </Chip>
      ))}
    </div>
  );
}

export type ShopTag = { name: string; count: number };

/** Kategorien (Homebox-Tags) als Chips. Antippen filtert, nochmal antippen hebt auf. */
function TagChips({
  tags,
  f,
  className,
}: {
  tags: ShopTag[];
  f: ReturnType<typeof useFilteredItems>;
  className?: string;
}) {
  if (tags.length < 2) return null;
  return (
    <div role="group" aria-label="Kategorie" className={cn("-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0", className)}>
      <span className="shrink-0 self-center pr-1 text-xs font-medium text-muted-foreground">Kategorie</span>
      {tags.map((t) => (
        <Chip key={t.name} active={f.tag === t.name} onClick={() => f.setTag(f.tag === t.name ? null : t.name)}>
          {t.name} <span className="tabular-nums opacity-80">{t.count}</span>
        </Chip>
      ))}
    </div>
  );
}

/** Anzahl links, „Nur verfügbare“ rechts – der Schalter erscheint nur, wenn etwas verliehen ist. */
function CountRow({
  f,
  total,
  hasLent,
  toggleClassName,
}: {
  f: ReturnType<typeof useFilteredItems>;
  total: number;
  hasLent: boolean;
  toggleClassName?: string;
}) {
  return (
    <div className="flex min-h-9 flex-wrap items-center justify-between gap-x-4">
      <ResultCount shown={f.filtered.length} total={total} onlyAvailable={f.onlyAvailable} />
      {hasLent && (
        <div className={toggleClassName}>
          <AvailableToggle checked={f.onlyAvailable} onChange={f.setOnlyAvailable} />
        </div>
      )}
    </div>
  );
}

function Grid({
  items,
  total,
  slug,
  onReset,
  onShowMore,
  list = false,
}: {
  list?: boolean;
  items: PublicItem[];
  total: number;
  slug: string;
  onReset: () => void;
  onShowMore: () => void;
}) {
  if (items.length === 0) {
    return (
      <div id="teile" className="flex scroll-mt-24 flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
        <PackageSearchIcon className="size-10 text-muted-foreground" strokeWidth={1.25} />
        <div>
          <p className="font-medium">Nichts gefunden</p>
          <p className="text-sm text-muted-foreground">Versuch einen anderen Suchbegriff oder Filter.</p>
        </div>
        <Button variant="outline" onClick={onReset}>
          Filter zurücksetzen
        </Button>
      </div>
    );
  }
  const rest = total - items.length;
  return (
    <div id="teile" className="scroll-mt-24 space-y-6">
      {list ? (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {items.map((item) => (
            <li key={item.id}>
              <ItemRow item={item} slug={slug} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} slug={slug} />
          ))}
        </div>
      )}
      {rest > 0 && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground tabular-nums">
            {items.length} von {total} angezeigt
          </p>
          <Button variant="outline" className="h-11 px-4" onClick={onShowMore}>
            {rest > PAGE_SIZE ? `${PAGE_SIZE} weitere anzeigen` : `Restliche ${rest} anzeigen`}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Kontakt und „So läuft's“. Anker #kontakt für die Hinweise weiter oben. */
export function ContactCard({
  contact,
  howto,
  title = DEFAULT_CONTACT_TITLE,
  className,
  anchor = true,
}: {
  contact: string;
  howto?: string;
  /** Überschrift, pro Page einstellbar */
  title?: string;
  className?: string;
  /** false für die zweite Kopie (Desktop-Seitenleiste), damit #kontakt eindeutig bleibt */
  anchor?: boolean;
}) {
  if (!contact.trim() && !howto?.trim()) return null;
  return (
    <section id={anchor ? "kontakt" : undefined} className={cn("scroll-mt-24 space-y-3 rounded-xl border bg-muted/40 p-4", className)}>
      {contact.trim() && (
        <div>
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
            <MessageCircleIcon className="size-4" /> {title}
          </h2>
          <LinkifiedText text={contact} className="text-sm text-muted-foreground" />
        </div>
      )}
      {howto?.trim() && (
        <div>
          <h2 className="mb-1 text-sm font-semibold">So läuft&apos;s</h2>
          <LinkifiedText text={howto} className="text-sm text-muted-foreground" />
        </div>
      )}
    </section>
  );
}

/** Kurzer Hinweis oben, wenn der Kontakt erst weit unten kommt */
function ContactHint({ page, className }: { page: PublicPage; className?: string }) {
  if (!page.contact.trim() && !page.howto.trim()) return null;
  return (
    <a
      href="#kontakt"
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline",
        className,
      )}
    >
      <MessageCircleIcon className="size-4" />
      {page.howto.trim() ? "Wie ausleihen? So läuft's & Kontakt" : page.contactTitle}
      <ArrowDownIcon className="size-3.5" />
    </a>
  );
}

function ResultCount({ shown, total, onlyAvailable }: { shown: number; total: number; onlyAvailable: boolean }) {
  let text = shown === total ? `${total} Teile` : `${shown} von ${total} Teilen`;
  if (onlyAvailable && shown === total) text = `Alle ${total} Teile sind gerade verfügbar`;
  return (
    <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
      {text}
    </p>
  );
}

function SkipLink() {
  return (
    <a
      href="#teile"
      className="sr-only z-50 rounded-md bg-background px-3 py-2 text-sm font-medium shadow-md focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
    >
      Zu den Teilen springen
    </a>
  );
}

export function ShopView({ page, locations, items }: Props) {
  const locationIds = useMemo(() => new Set(locations.map((l) => l.id)), [locations]);
  const tags = useMemo<ShopTag[]>(() => {
    const counts = new Map<string, number>();
    for (const it of items) for (const t of it.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, "de"));
  }, [items]);
  const tagNames = useMemo(() => new Set(tags.map((t) => t.name)), [tags]);
  const f = useFilteredItems(items, locationIds, tagNames);
  const searchRef = useRef<HTMLInputElement>(null);
  const reset = () => {
    f.setQuery("");
    f.setLocationId(null);
    f.setOnlyAvailable(false);
    f.setTag(null);
    searchRef.current?.focus();
  };
  const showLocationFilter = locations.length > 1;
  const hasLent = items.some((i) => i.status === "unavailable");

  if (page.layout === "C") {
    return (
      <div className="flex-1">
        <SkipLink />
        <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
          <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <PageLogo url={page.logoUrl} className="h-9 max-w-32" />
              <h1 className="truncate text-lg font-bold tracking-tight">{page.title}</h1>
            </div>
            <SearchField inputRef={searchRef} value={f.query} onChange={f.setQuery} className="w-full sm:max-w-xs" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl space-y-4 px-4 py-6">
          {page.intro && <LinkifiedText text={page.intro} className="text-sm text-muted-foreground" />}
          <ContactHint page={page} />
          <div className="space-y-2">
            <FilterChips locations={locations} f={f} />
            <TagChips tags={tags} f={f} />
          </div>
          <CountRow f={f} total={items.length} hasLent={hasLent} />
          <Grid list items={f.visible} total={f.filtered.length} slug={page.slug} onReset={reset} onShowMore={f.showMore} />
          <ContactCard contact={page.contact} howto={page.howto} title={page.contactTitle} className="mt-8" />
        </main>
      </div>
    );
  }

  if (page.layout === "B") {
    return (
      <div className="flex-1">
        <SkipLink />
        <header
          className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white dark:from-zinc-900 dark:via-zinc-950 dark:to-black"
          style={page.accent ? { background: "linear-gradient(135deg, var(--accent-header), #09090b)" } : undefined}
        >
          <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
            {page.logoUrl && (
              <div className="mb-5 inline-flex rounded-xl bg-white p-2 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element -- eigenes, kleines Bild */}
                <img src={page.logoUrl} alt="" className="h-14 w-auto max-w-56 object-contain sm:h-16" />
              </div>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">{page.title}</h1>
            {page.intro && (
              <LinkifiedText text={page.intro} className="mt-3 max-w-2xl text-base text-white/80 [&_a]:text-white" />
            )}
            {(page.contact.trim() || page.howto.trim()) && (
              <a
                href="#kontakt"
                className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-white underline-offset-4 hover:underline"
              >
                <MessageCircleIcon className="size-4" />
                {page.howto.trim() ? "Wie ausleihen? So läuft's & Kontakt" : page.contactTitle}
                <ArrowDownIcon className="size-3.5" />
              </a>
            )}
            <SearchField
              inputRef={searchRef}
              value={f.query}
              onChange={f.setQuery}
              className="mt-5 max-w-xl [&_input]:border-white/20 [&_input]:bg-white [&_input]:text-zinc-900 dark:[&_input]:bg-zinc-800 dark:[&_input]:text-white"
            />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6">
          <div className="space-y-2">
            <FilterChips locations={locations} f={f} />
            <TagChips tags={tags} f={f} />
          </div>
          <CountRow f={f} total={items.length} hasLent={hasLent} />
          <Grid items={f.visible} total={f.filtered.length} slug={page.slug} onReset={reset} onShowMore={f.showMore} />
          <ContactCard contact={page.contact} howto={page.howto} title={page.contactTitle} className="mt-8" />
        </main>
      </div>
    );
  }

  // Layout A: klassischer Shop
  return (
    <div className="flex-1">
      <SkipLink />
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <PageLogo url={page.logoUrl} className="h-9 max-w-32" />
            <h1 className="truncate text-lg font-bold tracking-tight">{page.title}</h1>
          </div>
          <SearchField inputRef={searchRef} value={f.query} onChange={f.setQuery} className="w-full sm:max-w-sm" />
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 py-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-24 space-y-6">
            {showLocationFilter && (
              <nav aria-label="Lagerorte">
                <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Lagerorte</h2>
                <ul className="space-y-0.5">
                  <li>
                    <SidebarLink active={f.locationId === null} onClick={() => f.setLocationId(null)} depth={0} count={items.length}>
                      Alle
                    </SidebarLink>
                  </li>
                  {locations.map((l) => (
                    <li key={l.id}>
                      <SidebarLink active={f.locationId === l.id} onClick={() => f.setLocationId(l.id)} depth={l.depth} count={l.count}>
                        {l.name}
                      </SidebarLink>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            {tags.length > 1 && (
              <nav aria-label="Kategorien">
                <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Kategorien</h2>
                <ul className="space-y-0.5">
                  <li>
                    <SidebarLink active={f.tag === null} onClick={() => f.setTag(null)} depth={0} count={items.length}>
                      Alle
                    </SidebarLink>
                  </li>
                  {tags.map((t) => (
                    <li key={t.name}>
                      <SidebarLink active={f.tag === t.name} onClick={() => f.setTag(t.name)} depth={0} count={t.count}>
                        {t.name}
                      </SidebarLink>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            {hasLent && (
              <div>
                <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Status</h2>
                <AvailableToggle checked={f.onlyAvailable} onChange={f.setOnlyAvailable} />
              </div>
            )}
            <ContactCard contact={page.contact} howto={page.howto} title={page.contactTitle} anchor={false} />
          </div>
        </aside>
        <main className="min-w-0 flex-1 space-y-4">
          {page.intro && <LinkifiedText text={page.intro} className="max-w-3xl text-sm text-muted-foreground" />}
          <ContactHint page={page} className="md:hidden" />
          <div className="space-y-2 md:hidden">
            <FilterChips locations={locations} f={f} />
            <TagChips tags={tags} f={f} />
          </div>
          <CountRow f={f} total={items.length} hasLent={hasLent} toggleClassName="md:hidden" />
          <Grid items={f.visible} total={f.filtered.length} slug={page.slug} onReset={reset} onShowMore={f.showMore} />
          <div className="md:hidden">
            <ContactCard contact={page.contact} howto={page.howto} title={page.contactTitle} className="mt-8" />
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarLink({
  active,
  onClick,
  depth,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  depth: number;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-md py-1.5 pr-2 text-left text-sm transition-colors",
        active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      <span className="truncate">{children}</span>
      <span className="text-xs tabular-nums">{count}</span>
    </button>
  );
}
