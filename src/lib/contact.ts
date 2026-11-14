import { tokenize } from "./linkify";

/** Überschrift über dem Kontakt, pro Page einstellbar. Leer = Standard. */
export const DEFAULT_CONTACT_TITLE = "Ausleihen? Frag einfach";
export const CONTACT_TITLE_SUGGESTIONS = [
  DEFAULT_CONTACT_TITLE,
  "Brauchst du was davon? Melde dich",
  "Interesse? Sag Bescheid",
  "Leihen statt kaufen: frag uns",
  "Du brauchst was? Schreib mir",
  "Was dabei? Schreib uns",
] as const;
export const CONTACT_TITLE_MAX = 60;
/** Ansprechpartner pro Item: Länge von Name und Hinweis */
export const CONTACT_NAME_MAX = 80;
export const CONTACT_NOTE_MAX = 500;

export function contactTitle(value: string | null | undefined) {
  return value?.trim() || DEFAULT_CONTACT_TITLE;
}

export type ContactKind = "mail" | "telegram" | "whatsapp" | "signal" | "phone" | "web";
export type ContactAction = { href: string; label: string; external: boolean; kind: ContactKind };

/** Art eines Links aus dem Kontaktfeld (für Symbole und Button-Text) */
export function contactKind(type: "url" | "mail" | "phone" | "telegram", href: string): ContactKind {
  if (type !== "url") return type;
  let host = "";
  try {
    host = new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return "web";
  }
  if (host === "wa.me" || host.endsWith("whatsapp.com")) return "whatsapp";
  if (host === "signal.me" || host === "signal.group") return "signal";
  if (host === "t.me" || host === "telegram.me") return "telegram";
  return "web";
}

/**
 * Erster Kontaktweg aus dem Kontaktfeld der Page als Button-Ziel, mit vorausgefüllter Nachricht.
 * Mail bekommt Betreff und Text, WhatsApp den Text. Sonst null (kein Button).
 */
/**
 * Alle Kontaktwege aus dem Kontaktfeld als Button-Ziele, in der Reihenfolge des Felds, ohne
 * Doppelte. Mail bekommt Betreff und Text, WhatsApp den Text. Normale Webseiten zählen nicht.
 */
export function contactActions(contact: string, itemName?: string): ContactAction[] {
  const message = itemName
    ? `Hallo, ich würde mir gern „${itemName}“ ausleihen. Wann würde es passen?`
    : "Hallo, ich würde mir gern etwas bei euch ausleihen.";
  const out: ContactAction[] = [];
  const seen = new Set<string>();
  const add = (a: ContactAction) => {
    if (seen.has(a.kind + a.href)) return;
    seen.add(a.kind + a.href);
    out.push(a);
  };
  for (const t of tokenize(contact)) {
    if (t.type === "text") continue;
    const kind = contactKind(t.type, t.href);
    if (kind === "mail") {
      const subject = itemName ? `Ausleihen: ${itemName}` : "Ausleihen";
      add({
        href: `${t.href}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`,
        label: "Per Mail anfragen",
        external: false,
        kind,
      });
    } else if (kind === "whatsapp") {
      const u = new URL(t.href);
      u.searchParams.set("text", message);
      add({ href: u.toString(), label: "Per WhatsApp anfragen", external: true, kind });
    } else if (kind === "signal") add({ href: t.href, label: "Per Signal anfragen", external: true, kind });
    else if (kind === "telegram") add({ href: t.href, label: "Per Telegram anfragen", external: true, kind });
    else if (kind === "phone") add({ href: t.href, label: "Anrufen", external: false, kind });
  }
  return out;
}

/** Die drei eigenen Kontaktfelder einer Page (normalisiert gespeichert) */
export type ContactFields = { telegram: string; mail: string; phone: string };

/** „@name“, „t.me/name“, „https://t.me/name“ oder „name“ → „name“. Ungültig → null. */
export function normalizeTelegram(input: string): string | null {
  const v = input.trim().replace(/^https?:\/\//i, "").replace(/^(?:t|telegram)\.me\//i, "").replace(/^@/, "");
  return /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(v) ? v : null;
}

export function normalizeMail(input: string): string | null {
  const v = input.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null;
}

/** Telefonnummer: Ziffern, Leerzeichen, + / ( ) -, 6–15 Ziffern. Gespeichert wie eingegeben (lesbar). */
export function normalizePhone(input: string): string | null {
  const v = input.trim().replace(/\s+/g, " ");
  const digits = v.replace(/\D/g, "");
  return /^[+\d][\d ()/-]*$/.test(v) && digits.length >= 6 && digits.length <= 15 ? v : null;
}

/** Telegram, Mail und Telefon prüfen und normalisieren. Leere Felder bleiben leer. */
export function parseContactFields(raw: { telegram: string; mail: string; phone: string }): { fields: ContactFields } | { error: string } {
  const tg = raw.telegram.trim() ? normalizeTelegram(raw.telegram) : "";
  const mail = raw.mail.trim() ? normalizeMail(raw.mail) : "";
  const phone = raw.phone.trim() ? normalizePhone(raw.phone) : "";
  if (tg === null) return { error: "Telegram-Name: 5–32 Zeichen, Buchstabe zuerst, z. B. @stani_hannes." };
  if (mail === null) return { error: "Die Mailadresse sieht nicht richtig aus." };
  if (phone === null) return { error: "Die Telefonnummer sieht nicht richtig aus (6–15 Ziffern)." };
  return { fields: { telegram: tg, mail, phone } };
}

/** Kontaktwege aus den eigenen Feldern, Reihenfolge Telegram, Mail, Telefon */
export function fieldActions(f: ContactFields, itemName?: string): ContactAction[] {
  const parts: string[] = [];
  if (f.telegram) parts.push(`@${f.telegram}`);
  if (f.mail) parts.push(f.mail);
  if (f.phone) parts.push(f.phone);
  return contactActions(parts.join("\n"), itemName);
}

/** Alle Wege für Buttons: erst die eigenen Felder, dann was in „Weitere Hinweise“ steht */
export function allContactActions(f: ContactFields, freeText: string, itemName?: string): ContactAction[] {
  const seen = new Set<string>();
  return [...fieldActions(f, itemName), ...contactActions(freeText, itemName)].filter((a) => {
    const k = a.kind + a.href.split("?")[0];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Erster Kontaktweg (Hauptbutton) */
export function contactAction(contact: string, itemName?: string): ContactAction | null {
  return contactActions(contact, itemName)[0] ?? null;
}
