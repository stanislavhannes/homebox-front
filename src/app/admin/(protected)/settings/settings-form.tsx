"use client";

import { useActionState } from "react";
import { saveSettingsAction, type FormState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsForm({ hiddenTag }: { hiddenTag: string }) {
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
