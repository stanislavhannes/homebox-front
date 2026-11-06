import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2Icon, ExternalLinkIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/admin-guard";
import { getLocationTree, type LocationNode } from "@/lib/catalog";
import { DEFAULT_VISIBLE_FIELDS, FIELD_OPTIONS, getPage } from "@/lib/pages";
import { logoUrl } from "@/lib/public-view";
import { PageForm } from "../page-form";

// Prüft die Admin-Session bei jedem Aufruf, darf daher blockieren.
export const instant = false;

export default async function EditPage({ params, searchParams }: PageProps<"/admin/pages/[id]">) {
  await requireAdminPage();
  const { id } = await params;
  const { saved } = await searchParams;
  const page = getPage(Number(id));
  if (!page) notFound();

  let locations: LocationNode[] = [];
  let homeboxError: string | undefined;
  try {
    locations = await getLocationTree();
  } catch (err) {
    homeboxError = `Lagerorte konnten nicht geladen werden: ${(err as Error).message}`;
  }
  const { passwordHash, ...rest } = page;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{page.title}</h1>
        <Link href={`/${page.slug}`} target="_blank" className={buttonVariants({ variant: "outline", size: "sm" })}>
          /{page.slug} ansehen <ExternalLinkIcon />
        </Link>
      </div>
      {saved && (
        <p role="status" className="mt-3 flex items-center gap-2 text-sm text-[var(--admin-success)]">
          <CheckCircle2Icon className="size-4" /> Gespeichert.
        </p>
      )}
      <PageForm
        key={page.updatedAt}
        page={{ ...rest, hasPassword: !!passwordHash, logoUrl: page.hasLogo ? logoUrl(page) : null }}
        locations={locations}
        fieldOptions={FIELD_OPTIONS}
        defaultFields={DEFAULT_VISIBLE_FIELDS}
        homeboxError={homeboxError}
      />
    </div>
  );
}
