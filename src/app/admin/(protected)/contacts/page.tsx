import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { ContactIcon } from "@/components/contact-icon";
import { buttonVariants } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/admin-guard";
import { listContacts } from "@/lib/contacts";

// Prüft die Admin-Session bei jedem Aufruf, darf daher blockieren.
export const instant = false;

export const metadata: Metadata = { title: "Ansprechpartner" };

export default async function ContactsPage() {
  await requireAdminPage();
  const contacts = listContacts();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ansprechpartner</h1>
          <p className="text-sm text-muted-foreground">
            Für Items, die jemand anderes betreut. Ihre Detailseite zeigt dann diesen Kontakt statt den der Page.
          </p>
        </div>
        <Link href="/admin/contacts/new" className={buttonVariants()}>
          <PlusIcon /> Neuer Ansprechpartner
        </Link>
      </div>

      {contacts.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-14 text-center">
          <p className="font-medium">Noch keine Ansprechpartner</p>
          <p className="mt-1 text-sm text-muted-foreground">Leg jemanden an und hake die Items ab, die zu ihm gehören.</p>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {contacts.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/contacts/${c.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-muted/40">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{c.name}</span>
                  <span className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                    {c.fields.telegram && (
                      <span className="inline-flex items-center gap-1">
                        <ContactIcon kind="telegram" className="size-3.5" /> @{c.fields.telegram}
                      </span>
                    )}
                    {c.fields.mail && (
                      <span className="inline-flex items-center gap-1">
                        <ContactIcon kind="mail" className="size-3.5" /> {c.fields.mail}
                      </span>
                    )}
                    {c.fields.phone && (
                      <span className="inline-flex items-center gap-1">
                        <ContactIcon kind="phone" className="size-3.5" /> {c.fields.phone}
                      </span>
                    )}
                  </span>
                </span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {c.itemCount === 1 ? "1 Item" : `${c.itemCount} Items`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
