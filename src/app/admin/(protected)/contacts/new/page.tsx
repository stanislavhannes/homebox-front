import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin-guard";
import { ContactForm } from "../contact-form";
import { loadContactFormItems } from "../form-items";

// Prüft die Admin-Session bei jedem Aufruf, darf daher blockieren.
export const instant = false;

export const metadata: Metadata = { title: "Neuer Ansprechpartner" };

export default async function NewContactPage() {
  await requireAdminPage();
  const { items, assigned, homeboxError } = await loadContactFormItems(null);
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Neuer Ansprechpartner</h1>
      <ContactForm contact={null} items={items} assigned={assigned} homeboxError={homeboxError} />
    </div>
  );
}
