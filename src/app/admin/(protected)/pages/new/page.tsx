import { requireAdminPage } from "@/lib/admin-guard";
import { getLocationTree, type LocationNode } from "@/lib/catalog";
import { DEFAULT_VISIBLE_FIELDS, FIELD_OPTIONS } from "@/lib/pages";
import { PageForm } from "../page-form";

// Prüft die Admin-Session bei jedem Aufruf, darf daher blockieren.
export const instant = false;

export default async function NewPage() {
  await requireAdminPage();
  let locations: LocationNode[] = [];
  let homeboxError: string | undefined;
  try {
    locations = await getLocationTree();
  } catch (err) {
    homeboxError = `Lagerorte konnten nicht geladen werden: ${(err as Error).message}`;
  }
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Neue Page</h1>
      <PageForm
        page={null}
        locations={locations}
        fieldOptions={FIELD_OPTIONS}
        defaultFields={DEFAULT_VISIBLE_FIELDS}
        homeboxError={homeboxError}
      />
    </div>
  );
}
