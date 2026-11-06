"use client";

import { useActionState } from "react";
import { AppLogo } from "@/components/app-logo";
import { loginAction, type FormState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={action} className="w-full max-w-sm space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex flex-col items-center gap-3 text-center">
        <AppLogo className="size-12" />
        <div>
          <h1 className="text-lg font-semibold">Homebox Front</h1>
          <p className="text-sm text-muted-foreground">Verwaltung</p>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-password">Admin-Passwort</Label>
        <Input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          aria-invalid={!!state.error}
          className="h-10"
        />
        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
      </div>
      <Button type="submit" className="h-10 w-full" disabled={pending}>
        {pending ? "Prüfe…" : "Anmelden"}
      </Button>
    </form>
  );
}
