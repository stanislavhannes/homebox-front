"use client";

import { useActionState, useState } from "react";
import { deletePageAction, savePageAction, type FormState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LocationNode } from "@/lib/catalog";
import type { PageConfig, VisibleField } from "@/lib/pages";
import { ACCENT_PRESETS, accentForeground, avoidStatusHues } from "@/lib/theme";
import { cn } from "@/lib/utils";

type Props = {
  page: (Omit<PageConfig, "passwordHash"> & { hasPassword: boolean; logoUrl: string | null }) | null;
  locations: LocationNode[];
  fieldOptions: readonly { key: VisibleField; label: string }[];
  defaultFields: VisibleField[];
  homeboxError?: string;
};

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-b py-6 md:grid-cols-[14rem_1fr]">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function LocationTree({
  nodes,
  selected,
  toggle,
  depth = 0,
}: {
  nodes: LocationNode[];
  selected: Set<string>;
  toggle: (id: string) => void;
  depth?: number;
}) {
  return (
    <ul className={cn(depth > 0 && "ml-5 border-l pl-3")}>
      {nodes.map((n) => (
        <li key={n.id}>
          <label className="flex cursor-pointer items-center gap-2 rounded-md py-1 text-sm hover:bg-muted/50">
            <input
              type="checkbox"
              name="locationIds"
              value={n.id}
              checked={selected.has(n.id)}
              onChange={() => toggle(n.id)}
              className="size-4 accent-primary"
            />
            {n.name}
          </label>
          {n.children.length > 0 && (
            <LocationTree nodes={n.children} selected={selected} toggle={toggle} depth={depth + 1} />
          )}
        </li>
      ))}
    </ul>
  );
}

export function PageForm({ page, locations, fieldOptions, defaultFields, homeboxError }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePageAction, {});
  const [selected, setSelected] = useState(() => new Set(page?.locationIds ?? []));
  const [layout, setLayout] = useState<"A" | "B" | "C">(page?.layout ?? "A");
  const [removePassword, setRemovePassword] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [accent, setAccent] = useState(page?.accent ?? "");
  const isPreset = ACCENT_PRESETS.some((p) => p.value === accent);
  const shifted = accent ? avoidStatusHues(accent) : null;
  const shown = shifted?.color || "#18181b";
  const shownLogo = removeLogo ? null : (logoPreview ?? page?.logoUrl ?? null);
  const visible = new Set(page?.visibleFields ?? defaultFields);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Lagerorte, die in Homebox nicht mehr existieren, trotzdem mitschicken, damit sie nicht still verschwinden
  const knownIds = new Set<string>();
  const collect = (nodes: LocationNode[]) => nodes.forEach((n) => (knownIds.add(n.id), collect(n.children)));
  collect(locations);
  const unknownSelected = [...selected].filter((id) => !knownIds.has(id));

  return (
    <div>
      <form action={action}>
        {page && <input type="hidden" name="id" value={page.id} />}

        <Section title="Allgemein">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input id="title" name="title" defaultValue={page?.title} required placeholder="Kollektiv Party-Stuff" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Link</Label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">/</span>
              <Input id="slug" name="slug" defaultValue={page?.slug} placeholder="wird aus dem Titel erzeugt" className="font-mono" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="intro">Einleitungstext</Label>
            <Textarea id="intro" name="intro" defaultValue={page?.intro} rows={3} placeholder="Alles, was wir verleihen. Frag einfach!" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="published" defaultChecked={page?.published ?? true} className="size-4 accent-primary" />
            Veröffentlicht (sonst nur für dich sichtbar)
          </label>
        </Section>

        <Section title="Logo" hint="Optional. Erscheint oben auf der Page und beim Passwort. PNG, JPG, WebP oder SVG, max. 2 MB. Quer- oder quadratisch, am besten mit transparentem Hintergrund.">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-20 w-40 items-center justify-center rounded-lg border bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:16px_16px] p-2">
              {shownLogo ? (
                // eslint-disable-next-line @next/next/no-img-element -- Vorschau, auch blob:-URLs
                <img src={shownLogo} alt="Logo-Vorschau" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-xs text-muted-foreground">Kein Logo</span>
              )}
            </div>
            <div className="space-y-2">
              <Input
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                disabled={removeLogo}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setLogoPreview(file ? URL.createObjectURL(file) : null);
                }}
                className="max-w-xs"
              />
              {page?.logoUrl && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="removeLogo"
                    checked={removeLogo}
                    onChange={(e) => setRemoveLogo(e.target.checked)}
                    className="size-4 accent-primary"
                  />
                  Logo entfernen
                </label>
              )}
            </div>
          </div>
        </Section>

        <Section title="Lagerorte" hint="Unterorte und alles darin werden automatisch mit angezeigt.">
          {homeboxError ? (
            <p className="text-sm text-destructive">{homeboxError}</p>
          ) : locations.length === 0 ? (
            <p className="text-sm text-muted-foreground">In Homebox gibt es noch keine Lagerorte.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto rounded-lg border p-3">
              <LocationTree nodes={locations} selected={selected} toggle={toggle} />
            </div>
          )}
          {unknownSelected.map((id) => (
            <p key={id} className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
              <input type="hidden" name="locationIds" value={id} />
              Ein gewählter Lagerort ({id.slice(0, 8)}…) wurde in Homebox nicht gefunden.
              <button type="button" className="underline" onClick={() => toggle(id)}>
                Entfernen
              </button>
            </p>
          ))}
        </Section>

        <Section title="Layout">
          <input type="hidden" name="layout" value={layout} />
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ["A", "Klassischer Shop", "Seitenleiste mit Lagerorten und Filter, Kachelraster. Gut bei vielen Teilen."],
                ["B", "Schaufenster", "Großer Header mit Einleitung, Lagerorte als Chips, Kontakt unten. Persönlicher."],
                ["C", "Kompakte Liste", "Zeilen statt Kacheln, kleines Bild. Schnell zu überfliegen, eher Katalog als Shop."],
              ] as const
            ).map(([value, label, desc]) => (
              <button
                key={value}
                type="button"
                onClick={() => setLayout(value)}
                aria-pressed={layout === value}
                className={cn(
                  "rounded-xl border-2 p-4 text-left transition",
                  layout === value ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                )}
              >
                <span className="font-medium">
                  {value} · {label}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">{desc}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Farbe" hint="Akzentfarbe für Buttons, Filter und den Header im Schaufenster. Rot und Grün sind für den Verfügbarkeits-Status reserviert.">
          <input type="hidden" name="accent" value={accent} />
          <div className="flex flex-wrap items-center gap-2">
            {ACCENT_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setAccent(p.value)}
                aria-pressed={accent === p.value}
                title={p.label}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm transition",
                  accent === p.value ? "border-foreground ring-2 ring-foreground/20" : "hover:bg-muted/50",
                )}
              >
                <span className="size-7 rounded-full border border-black/10" style={{ background: p.swatch }} />
                {p.label}
              </button>
            ))}
            <label
              className={cn(
                "flex h-9 cursor-pointer items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm transition",
                accent && !isPreset ? "border-foreground ring-2 ring-foreground/20" : "hover:bg-muted/50",
              )}
            >
              <input
                type="color"
                value={accent || "#18181b"}
                onChange={(e) => setAccent(e.target.value)}
                className="size-7 cursor-pointer rounded-full border-0 bg-transparent p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-black/10 [&::-webkit-color-swatch-wrapper]:p-0"
                aria-label="Eigene Farbe"
              />
              Eigene{accent && !isPreset ? `: ${accent}` : ""}
            </label>
          </div>
          {shifted?.zone && (
            <p className="text-sm text-muted-foreground">
              {shifted.zone} steht auf den Pages für {shifted.zone === "Rot" ? "„verliehen“" : "„verfügbar“"}. Damit niemand Button und
              Status verwechselt, wird deine Farbe leicht verschoben angezeigt (Vorschau unten).
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-muted-foreground">Vorschau:</span>
            <span
              className="rounded-lg px-3 py-1.5 font-medium"
              style={{ background: shown, color: accentForeground(shown) }}
            >
              Button
            </span>
            <span
              className="rounded-full px-3 py-1"
              style={{ background: shown, color: accentForeground(shown) }}
            >
              Filter aktiv
            </span>
          </div>
        </Section>

        <Section title="Angezeigte Infos" hint="Name, Bild und Verfügbarkeit sind immer sichtbar. An wen etwas verliehen ist, sieht nie jemand.">
          <div className="grid gap-2 sm:grid-cols-2">
            {fieldOptions.map((f) => (
              <label key={f.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="visibleFields"
                  value={f.key}
                  defaultChecked={visible.has(f.key)}
                  className="size-4 accent-primary"
                />
                {f.label}
              </label>
            ))}
          </div>
        </Section>

        <Section
          title="Kontakt & Ablauf"
          hint="Links, Mailadressen und Telefonnummern werden klickbar. Der erste Kontaktweg wird auf jeder Detailseite zum Button „Anfragen“."
        >
          <div className="space-y-2">
            <Label htmlFor="contact">Kontakt</Label>
            <Textarea
              id="contact"
              name="contact"
              defaultValue={page?.contact}
              rows={3}
              placeholder={"verleih@example.org oder https://signal.me/#p/…"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="howto">So läuft&apos;s</Label>
            <Textarea
              id="howto"
              name="howto"
              defaultValue={page?.howto}
              rows={4}
              placeholder={"Abholung in Leipzig-Plagwitz nach Absprache. Meist für ein Wochenende, gegen kleine Spende. Bitte sauber zurückbringen."}
            />
            <p className="text-sm text-muted-foreground">
              {page?.howto
                ? "Steht im Kontaktkasten und als Kurzinfo neben dem Anfrage-Button. Der erste Satz sollte das Wichtigste sagen."
                : "Noch leer. Wer euch nicht kennt, weiß sonst nicht, ob Ausleihen etwas kostet und wie die Abholung läuft. Der erste Satz erscheint direkt neben dem Anfrage-Button."}
            </p>
          </div>
        </Section>

        <Section
          title="Passwort"
          hint={page?.hasPassword ? "Diese Page ist geschützt. Ein neues Passwort sperrt alle bisherigen Besucher aus." : "Optional. Ohne Passwort kann jeder mit dem Link die Page sehen."}
        >
          <Input
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder={page?.hasPassword ? "Neues Passwort (leer = unverändert)" : "Passwort (optional)"}
            disabled={removePassword}
          />
          {page?.hasPassword && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="removePassword"
                checked={removePassword}
                onChange={(e) => setRemovePassword(e.target.checked)}
                className="size-4 accent-primary"
              />
              Passwortschutz entfernen
            </label>
          )}
        </Section>

        <div className="flex flex-wrap items-center gap-3 py-6">
          <Button type="submit" disabled={pending}>
            {pending ? "Speichert…" : "Speichern"}
          </Button>
          {state.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}
        </div>
      </form>

      {page && (
        <form
          action={deletePageAction}
          onSubmit={(e) => {
            if (!confirm(`Page „${page.title}“ wirklich löschen? Das betrifft nur diese App, nicht Homebox.`)) e.preventDefault();
          }}
          className="border-t pt-6"
        >
          <input type="hidden" name="id" value={page.id} />
          <Button type="submit" variant="destructive">
            Page löschen
          </Button>
        </form>
      )}
    </div>
  );
}
