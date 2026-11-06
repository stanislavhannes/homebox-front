import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin-guard";
import { env } from "@/lib/env";
import { getSettings } from "@/lib/pages";
import { SettingsForm } from "./settings-form";

// Prüft die Admin-Session bei jedem Aufruf, darf daher blockieren.
export const instant = false;

export const metadata: Metadata = { title: "Einstellungen" };

export default async function SettingsPage() {
  await requireAdminPage();
  const settings = getSettings();
  const e = env();
  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Einstellungen</h1>
      <SettingsForm hiddenTag={settings.hiddenTag} />
      <section className="space-y-2 rounded-xl border p-4 text-sm">
        <h2 className="font-semibold">Verbindung</h2>
        <p className="text-muted-foreground">
          {e.HOMEBOX_MOCK ? (
            <>Testmodus aktiv (<code>HOMEBOX_MOCK=1</code>): Es werden Beispieldaten gezeigt, nichts geht an Homebox.</>
          ) : (
            <>Homebox: <code>{e.HOMEBOX_URL}</code> (API-Key aus <code>.env.local</code>)</>
          )}
        </p>
      </section>
    </div>
  );
}
