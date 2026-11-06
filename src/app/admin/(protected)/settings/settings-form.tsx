"use client";

import { useActionState } from "react";
import { saveSettingsAction, type FormState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsForm({ hiddenTag, theme }: { hiddenTag: string; theme: "system" | "light" | "dark" }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveSettingsAction, {});
  return (
    <form action={action} className="space-y-4 rounded-xl border p-4">
      <div className="space-y-2">
        <Label htmlFor="hiddenTag">Tag zum Verstecken</Label>
        <Input id="hiddenTag" name="hiddenTag" defaultValue={hiddenTag} className="max-w-xs" />
        <p className="text-sm text-muted-foreground">
          Items mit diesem Homebox-Tag erscheinen auf keiner Page, auch nicht ihr Inhalt (z. B. bei einem Koffer). Leer lassen,
          um nichts zu verstecken.
        </p>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Darstellung</legend>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["system", "Automatisch", "wie das Gerät"],
              ["light", "Immer hell", ""],
              ["dark", "Immer dunkel", ""],
            ] as const
          ).map(([value, label, hint]) => (
            <label
              key={value}
              className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-[var(--admin-active-bg)]"
            >
              <input type="radio" name="theme" value={value} defaultChecked={theme === value} className="size-4 accent-primary" />
              {label}
              {hint && <span>({hint})</span>}
            </label>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Gilt für alle Pages und die Verwaltung.</p>
      </fieldset>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          Speichern
        </Button>
        {state.ok && <p role="status" className="text-sm text-[var(--admin-success)]">{state.ok}</p>}
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      </div>
    </form>
  );
}
