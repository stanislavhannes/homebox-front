import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowDownIcon, ArrowLeftIcon, FileTextIcon, MapPinIcon, PaperclipIcon } from "lucide-react";
import { ContactIcon } from "@/components/contact-icon";
import { Markdown } from "@/components/markdown";
import { AvailabilityBadge } from "@/components/shop/availability-badge";
import { Gallery } from "@/components/shop/gallery";
import { AccentScope } from "@/components/shop/accent-scope";
import { BackLink } from "@/components/shop/back-link";
import { PageLogo } from "@/components/shop/page-logo";
import { buttonVariants } from "@/components/ui/button";
import { LoanRow } from "@/app/admin/(protected)/items/loans-manager";
import { knownBorrowers, toAdminLoanItem } from "@/lib/admin-loans";
import { isAdmin } from "@/lib/auth";
import { allContactActions, contactTitle } from "@/lib/contact";
import { contactForItem, effectiveContact } from "@/lib/contacts";
import { getSettings } from "@/lib/pages";
import { PasswordForm } from "@/components/shop/password-form";
import { ContactCard } from "@/components/shop/shop-view";
import { HomeboxUnavailable } from "@/components/shop/states";
import { Skeleton } from "@/components/ui/skeleton";
import { formatShortDate } from "@/lib/loans";
import { loadCatalog, loadPage, logoUrl, todayInBerlin, toPublicDetail, toPublicPage } from "@/lib/public-view";

export default function ItemPage({ params }: PageProps<"/[slug]/item/[itemId]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ItemContent params={params} />
    </Suspense>
  );
}

async function ItemContent({ params }: Pick<PageProps<"/[slug]/item/[itemId]">, "params">) {
  const { slug, itemId } = await params;
  const { page, unlocked } = await loadPage(slug);
  return (
    <AccentScope accent={page.accent}>
      <ItemContentInner page={page} unlocked={unlocked} itemId={itemId} />
    </AccentScope>
  );
}

async function ItemContentInner({
  page,
  unlocked,
  itemId,
}: {
  page: Awaited<ReturnType<typeof loadPage>>["page"];
  unlocked: boolean;
  itemId: string;
}) {
  if (!unlocked) return <PasswordForm slug={page.slug} title={page.title} logoUrl={toPublicPage(page).logoUrl} />;

  let catalog;
  try {
    catalog = await loadCatalog(page);
  } catch (err) {
    console.error("[item] Homebox-Fehler", err);
    return <HomeboxUnavailable />;
  }
  const raw = catalog.items.find((i) => i.id === itemId);
  if (!raw) notFound();

  const today = todayInBerlin();
  const item = toPublicDetail(page, raw, today);
  // Eigener Ansprechpartner des Items, sonst der Kontakt der Page
  const contact = effectiveContact(page, contactForItem(raw.id));
  // Ein Button pro Kontaktweg: erst die eigenen Felder (Telegram, Mail, Telefon), dann weitere Hinweise
  const actions = allContactActions(contact.fields, contact.freeText, item.name);
  const [ask, ...moreAsks] = actions;
  // Nur für eingeloggte Admins: Verleih direkt hier eintragen (Empfänger gelangen nur dann ins HTML)
  const admin = await isAdmin();
  const adminItem = admin ? toAdminLoanItem(raw, today, getSettings().hiddenTag) : null;
  const borrowers = admin ? knownBorrowers(catalog.items) : [];
  const howtoLead = firstSentence(page.howto);
  // „Mehr dazu“ nur, wenn „So läuft's“ mehr enthält als den ersten Satz (Kontakt haben die Buttons)
  const howtoHasMore = !!howtoLead && page.howto.trim().replace(/\s+/g, " ").length > howtoLead.replace(/…$/, "").length + 1;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <title>{`${item.name} · ${page.title}`}</title>
      <BackLink
        href={`/${page.slug}`}
        className="-my-2 mb-3 inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        <PageLogo url={page.hasLogo ? logoUrl(page) : null} className="h-5 max-w-20" />
        {page.title}
      </BackLink>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 md:grid-cols-2 md:gap-10">
        <div className="min-w-0 md:sticky md:top-6 md:self-start">
          <Gallery photos={item.photos} name={item.name} />
        </div>

        <div className="min-w-0 space-y-6">
          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight text-balance hyphens-auto [overflow-wrap:anywhere] sm:text-3xl">{item.name}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <AvailabilityBadge status={item.status} label={item.availabilityLabel} className="px-3 py-1 text-sm" />
              {item.status === "partial" && item.nextReturn && (
                <span className="text-sm text-muted-foreground">
                  Weitere ab {formatShortDate(addDay(item.nextReturn), today)}
                </span>
              )}
              {item.status === "unavailable" && item.nextReturn && (
                <span className="text-sm text-muted-foreground">
                  Wieder da ab {formatShortDate(addDay(item.nextReturn), today)}
                </span>
              )}
            </div>
            {item.locationPath && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPinIcon className="size-4 shrink-0" />
                {item.locationPath.join(" › ")}
              </p>
            )}
          </div>

          {(ask || howtoLead) && (
            <div className="space-y-2">
              {howtoLead && (
                <p className="max-w-prose text-sm text-muted-foreground">
                  {howtoLead}
                  {howtoHasMore && (
                    <>
                      {" "}
                      <a
                        href={`#kontakt-${item.id}`}
                        className="inline-flex items-center gap-0.5 font-medium whitespace-nowrap text-foreground underline-offset-4 hover:underline"
                      >
                        Mehr dazu <ArrowDownIcon className="size-3.5" />
                      </a>
                    </>
                  )}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {ask && (
                  // Am Handy übernimmt die feste Leiste unten
                  <div className="hidden flex-wrap gap-2 md:flex">
                    {actions.map((a, i) => (
                      <a
                        key={a.kind + a.href}
                        href={a.href}
                        {...(a.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className={buttonVariants({
                          size: "lg",
                          variant: i === 0 ? "default" : "secondary",
                          className: "h-11 px-4 text-base",
                        })}
                      >
                        <ContactIcon kind={a.kind} /> {a.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {adminItem && (
            <section
              aria-labelledby="verleih-admin"
              className="admin-theme space-y-3 rounded-xl border border-[color-mix(in_oklab,var(--awning)_45%,var(--border))] p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="verleih-admin" className="text-sm font-semibold">
                  Verleih
                </h2>
                <span className="text-xs text-muted-foreground">Nur für dich sichtbar</span>
              </div>
              <LoanRow item={adminItem} today={today} borrowers={borrowers} embedded />
            </section>
          )}

          {item.description && <Markdown text={item.description} className="leading-relaxed" />}

          {item.facts.length > 0 && (
            <dl className="divide-y rounded-xl border text-sm">
              {item.facts.map((f) => (
                <div key={f.label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-4 py-2.5">
                  <dt className="text-muted-foreground">{f.label}</dt>
                  <dd className="font-medium break-words">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((t) => (
                <Link
                  key={t}
                  href={`/${page.slug}?tag=${encodeURIComponent(t)}`}
                  className="inline-flex min-h-8 items-center rounded-full bg-muted px-3 text-xs transition-colors hover:bg-muted/70 hover:text-foreground"
                  title={`Alles aus „${t}“ zeigen`}
                >
                  {t}
                </Link>
              ))}
            </div>
          )}

          {item.notes && (
            <section>
              <h2 className="mb-1.5 text-sm font-semibold">Notizen</h2>
              <Markdown text={item.notes} className="text-sm text-muted-foreground" />
            </section>
          )}

          {item.files.length > 0 && (
            <section>
              <h2 className="mb-1.5 text-sm font-semibold">
                {item.files.every((f) => f.kind === "Anleitung") ? "Anleitungen" : "Anleitungen & Dokumente"}
              </h2>
              <ul className="divide-y rounded-lg border">
                {item.files.map((f) => (
                  <li key={f.url}>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-muted/50"
                    >
                      {f.isPdf ? (
                        <FileTextIcon className="size-4 shrink-0 text-primary" />
                      ) : (
                        <PaperclipIcon className="size-4 shrink-0 text-primary" />
                      )}
                      <span className="min-w-0 flex-1 truncate font-medium">{f.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {f.kind}
                        {f.isPdf ? " · PDF" : ""}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <ContactCard
            contact={contact.freeText}
            fields={contact.fields}
            personName={contact.personName}
            howto={page.howto}
            title={contactTitle(page.contactTitle)}
            anchorId={`kontakt-${item.id}`}
          />
        </div>
      </div>

      {ask && (
        <>
          <div className="cta-bar-mobile fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur supports-backdrop-filter:bg-background/80 md:hidden">
            <div className="flex gap-2">
              <a
                href={ask.href}
                {...(ask.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={buttonVariants({ size: "lg", className: "h-12 min-w-0 flex-1 text-base" })}
              >
                <ContactIcon kind={ask.kind} /> <span className="truncate">{ask.label}</span>
              </a>
              {/* Weitere Wege als runde Symbol-Buttons, passt in eine Daumenzeile */}
              {moreAsks.slice(0, 3).map((a) => (
                <a
                  key={a.kind + a.href}
                  href={a.href}
                  {...(a.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  aria-label={a.label}
                  title={a.label}
                  className={buttonVariants({ variant: "secondary", size: "icon-lg", className: "size-12 shrink-0 rounded-full" })}
                >
                  <ContactIcon kind={a.kind} className="size-5" />
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}

/** Erster Satz von „So läuft's“ als Kurzinfo neben dem Anfrage-Button (max. ~160 Zeichen) */
function firstSentence(text: string): string | null {
  const t = text.trim().split(/\n/)[0]?.trim() ?? "";
  if (!t) return null;
  const m = t.match(/^.+?[.!?](?=\s|$)/);
  const s = (m ? m[0] : t).trim();
  return s.length > 160 ? `${s.slice(0, 157).trimEnd()}…` : s;
}

function addDay(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function DetailSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)] gap-8 px-4 py-6 md:grid-cols-2">
      <Skeleton className="col-span-full h-5 w-40" />
      <Skeleton className="aspect-[4/3] rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
