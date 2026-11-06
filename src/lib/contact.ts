import { tokenize } from "./linkify";

export type ContactAction = { href: string; label: string; external: boolean };

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
        return { href: u.toString(), label: "Per WhatsApp anfragen", external: true };
      }
      if (host === "signal.me" || host === "signal.group") return { href: t.href, label: "Per Signal anfragen", external: true };
      if (host === "t.me" || host === "telegram.me") return { href: t.href, label: "Per Telegram anfragen", external: true };
      continue; // normale Webseiten sind kein Kontaktweg
    }
    if (t.type === "phone") return { href: t.href, label: "Anrufen", external: false };
  }
  return null;
}
