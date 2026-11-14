"use client";

import { useActionState, useId, useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
import { deleteContactAction, saveContactAction, type FormState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_NAME_MAX, CONTACT_NOTE_MAX } from "@/lib/contact";
import type { ItemContact } from "@/lib/contacts";
import { searchKey } from "@/lib/utils";

/** Item für die Checkliste; owner = Name eines anderen Ansprechpartners, falls schon zugewiesen */
export type ContactFormItem = { id: string; name: string; locationPath: string; owner: string | null };

export function ContactForm({
  contact,
  items,
  assigned,
  homeboxError,
}: {
  contact: ItemContact | null;
  items: ContactFormItem[];
  /** IDs der Items, die diesem Ansprechpartner gerade zugewiesen sind */
  assigned: string[];
  homeboxError?: string;
}) {
  const uid = useId();
  const fid = (name: string) => `${uid}-${name}`;
  // Kontrolliert, damit ein Fehler beim Speichern die Eingaben nicht zurücksetzt
  const [values, setValues] = useState({
    name: contact?.name ?? "",
    telegram: contact?.fields.telegram ? `@${contact.fields.telegram}` : "",
    mail: contact?.fields.mail ?? "",
    phone: contact?.fields.phone ?? "",
    note: contact?.note ?? "",
  });
  const set = (key: keyof typeof values) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));
  const [picked, setPicked] = useState(() => new Set(assigned));
  const [query, setQuery] = useState("");
  const [state, action, pending] = useActionState<FormState, FormData>(saveContactAction, {});

  // Beim Öffnen Zugewiesene oben; Haken setzen sortiert bewusst nicht um
  const sorted = useMemo(() => {
    const initial = new Set(assigned);
    return [...items].sort((a, b) => Number(initial.has(b.id)) - Number(initial.has(a.id)));
  }, [items, assigned]);
  const terms = searchKey(query).split(/\s+/).filter(Boolean);
  const shown = sorted.filter((it) => terms.every((t) => searchKey(`${it.name} ${it.locationPath}`).includes(t)));

  const toggle = (id: string) =>
    setPicked((p) => {
      const next = new Set(p);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="mt-6 space-y-8">
      <form action={action} className="space-y-6">
        {contact && <input type="hidden" name="id" value={contact.id} />}
        {[...picked].map((id) => (
          <input key={id} type="hidden" name="itemIds" value={id} />
        ))}

        <div className="space-y-4 rounded-xl border p-4">
          <div className="space-y-2">
            <Label htmlFor={fid("name")}>Name</Label>
            <Input id={fid("name")} name="name" value={values.name} onChange={set("name")} maxLength={CONTACT_NAME_MAX} required />
          </div>
          <p className="text-sm text-muted-foreground">
            Mindestens ein Weg. Jeder ausgefüllte wird auf der Detailseite zu einem Button, in der Reihenfolge Telegram, Mail,
            Telefon.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor={fid("telegram")}>Telegram</Label>
              <Input id={fid("telegram")} name="telegram" value={values.telegram} onChange={set("telegram")} placeholder="@name" autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor={fid("mail")}>Mail</Label>
              <Input id={fid("mail")} name="mail" type="email" value={values.mail} onChange={set("mail")} autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor={fid("phone")}>Telefon</Label>
              <Input id={fid("phone")} name="phone" type="tel" value={values.phone} onChange={set("phone")} autoComplete="off" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={fid("note")}>Hinweis (optional)</Label>
            <Textarea
              id={fid("note")}
              name="note"
              value={values.note}
              onChange={set("note")}
              maxLength={CONTACT_NOTE_MAX}
              rows={2}
              placeholder="z. B. meist abends erreichbar"
            />
            <p className="text-sm text-muted-foreground">Ersetzt bei diesen Items die „Weiteren Hinweise“ der Page.</p>
          </div>
        </div>

        <fieldset className="space-y-3 rounded-xl border p-4">
          <legend className="px-1 text-sm font-semibold">Items ({picked.size})</legend>
          <p className="text-sm text-muted-foreground">
            Diese Items zeigen den Ansprechpartner statt des Page-Kontakts. Ist ein Item schon jemand anderem zugewiesen,
            wechselt es beim Speichern hierher.
          </p>
          {homeboxError ? (
            <p className="text-sm text-destructive">{homeboxError}</p>
          ) : (
            <>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Item oder Lagerort…"
                  aria-label="Items suchen"
                  className="h-11 pl-9 text-base md:h-9 md:text-sm"
                />
              </div>
              <ul className="max-h-96 divide-y overflow-y-auto rounded-lg border">
                {shown.map((it) => (
                  <li key={it.id}>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50">
                      <input type="checkbox" checked={picked.has(it.id)} onChange={() => toggle(it.id)} className="size-4 shrink-0 accent-primary" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium [overflow-wrap:anywhere]">{it.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {it.locationPath}
                          {it.owner && !picked.has(it.id) && <> · gerade bei {it.owner}</>}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
                {shown.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">Nichts gefunden.</li>}
              </ul>
            </>
          )}
        </fieldset>

        <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80">
          <Button type="submit" disabled={pending} className="h-10 px-4">
            {pending ? "Speichert…" : "Speichern"}
          </Button>
          {state.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}
        </div>
      </form>

      {contact && (
        <form
          action={deleteContactAction}
          onSubmit={(e) => {
            const n = assigned.length;
            const what = n === 1 ? "1 Item bekommt" : `${n} Items bekommen`;
            const msg = n > 0 ? `„${contact.name}“ löschen? ${what} dann wieder den Page-Kontakt.` : `„${contact.name}“ löschen?`;
            if (!confirm(msg)) e.preventDefault();
          }}
          className="border-t pt-6"
        >
          <input type="hidden" name="id" value={contact.id} />
          <Button type="submit" variant="destructive">
            Ansprechpartner löschen
          </Button>
        </form>
      )}
    </div>
  );
}
