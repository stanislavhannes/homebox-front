import { ContactIcon } from "@/components/contact-icon";
import { contactKind } from "@/lib/contact";
import { tokenize } from "@/lib/linkify";

/**
 * Text mit Zeilenumbrüchen; URLs, Mailadressen, Telefonnummern und Telegram-Namen werden klickbar.
 * Kontaktwege (Mail, Telegram, Telefon, WhatsApp, Signal) bekommen ein Symbol davor.
 */
export function LinkifiedText({ text, className }: { text: string; className?: string }) {
  return (
    <p className={className} style={{ whiteSpace: "pre-line" }}>
      {tokenize(text).map((t, i) => {
        if (t.type === "text") return t.value;
        const kind = contactKind(t.type, t.href);
        return (
          <a
            key={i}
            href={t.href}
            className="group/link font-medium text-primary [overflow-wrap:anywhere]"
            {...(t.type === "url" || t.type === "telegram" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            <ContactIcon kind={kind} className="mr-1 inline size-[1.05em] align-[-0.15em]" />
            <span className="underline underline-offset-4">{t.value}</span>
          </a>
        );
      })}
    </p>
  );
}
