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
export function contactAction(contact: string, itemName?: string): ContactAction | null {
  const message = itemName
    ? `Hallo, ich würde mir gern „${itemName}“ ausleihen. Wann würde es passen?`
    : "Hallo, ich würde mir gern etwas bei euch ausleihen.";
  for (const t of tokenize(contact)) {
    if (t.type === "mail") {
      const subject = itemName ? `Ausleihen: ${itemName}` : "Ausleihen";
      return {
        href: `${t.href}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`,
        label: "Per Mail anfragen",
        external: false,
        kind: "mail",
      };
    }
    if (t.type === "url") {
      let host = "";
      try {
        host = new URL(t.href).hostname.replace(/^www\./, "");
      } catch {
        continue;
      }
      if (host === "wa.me" || host.endsWith("whatsapp.com")) {
        const u = new URL(t.href);
        u.searchParams.set("text", message);
        return { href: u.toString(), label: "Per WhatsApp anfragen", external: true, kind: "whatsapp" };
      }
      if (host === "signal.me" || host === "signal.group") return { href: t.href, label: "Per Signal anfragen", external: true, kind: "signal" };
      if (host === "t.me" || host === "telegram.me") return { href: t.href, label: "Per Telegram anfragen", external: true, kind: "telegram" };
      continue; // normale Webseiten sind kein Kontaktweg
    }
    if (t.type === "telegram") return { href: t.href, label: "Per Telegram anfragen", external: true, kind: "telegram" };
    if (t.type === "phone") return { href: t.href, label: "Anrufen", external: false, kind: "phone" };
  }
  return null;
}
