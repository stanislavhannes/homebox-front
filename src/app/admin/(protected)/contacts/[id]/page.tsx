import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin-guard";
import { getContact } from "@/lib/contacts";
import { ContactForm } from "../contact-form";
import { loadContactFormItems } from "../form-items";

// Prüft die Admin-Session bei jedem Aufruf, darf daher blockieren.
export const instant = false;

export const metadata: Metadata = { title: "Ansprechpartner" };

export default async function EditContactPage({ params }: PageProps<"/admin/contacts/[id]">) {
  await requireAdminPage();
  const { id } = await params;
  const contact = getContact(Number(id));
  if (!contact) notFound();
  const { items, assigned, homeboxError } = await loadContactFormItems(contact.id);
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{contact.name}</h1>
      <ContactForm key={contact.id} contact={contact} items={items} assigned={assigned} homeboxError={homeboxError} />
    </div>
  );
}
