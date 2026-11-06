"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LockIcon } from "lucide-react";
import { unlockAction, type UnlockState } from "@/app/[slug]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLogo } from "./page-logo";

export function PasswordForm({ slug, title, logoUrl }: { slug: string; title: string; logoUrl?: string | null }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<UnlockState, FormData>(
    async (prev, fd) => {
      const result = await unlockAction(prev, fd);
      if (!result.error) router.refresh();
      return result;
    },
    {},
  );

  useEffect(() => {
    document.getElementById("page-password")?.focus();
  }, []);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <form action={action} className="w-full max-w-sm space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          {logoUrl ? (
            <PageLogo url={logoUrl} className="h-14 max-w-48" />
          ) : (
            <span className="flex size-11 items-center justify-center rounded-full bg-muted">
              <LockIcon className="size-5" />
            </span>
          )}
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground">Diese Seite ist mit einem Passwort geschützt.</p>
          </div>
        </div>
        <input type="hidden" name="slug" value={slug} />
        <div className="space-y-2">
          <Label htmlFor="page-password">Passwort</Label>
          <Input
            id="page-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={!!state.error}
            aria-describedby={state.error ? "page-password-error" : undefined}
            className="h-10"
          />
          {state.error && (
            <p id="page-password-error" role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}
        </div>
        <Button type="submit" className="h-10 w-full" disabled={pending}>
          {pending ? "Prüfe…" : "Öffnen"}
        </Button>
      </form>
    </main>
  );
}
