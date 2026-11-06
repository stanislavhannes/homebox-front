import { MailIcon, MessageCircleIcon, PhoneIcon, SendIcon } from "lucide-react";
import type { ContactKind } from "@/lib/contact";
import { cn } from "@/lib/utils";

/** Symbol je Kontaktweg. Papierflieger = Telegram. Normale Webseiten bekommen keins. */
export function ContactIcon({ kind, className }: { kind: ContactKind; className?: string }) {
  const Icon =
    kind === "mail"
      ? MailIcon
      : kind === "telegram"
        ? SendIcon
        : kind === "phone"
          ? PhoneIcon
          : kind === "whatsapp" || kind === "signal"
            ? MessageCircleIcon
            : null;
  if (!Icon) return null;
  return <Icon aria-hidden className={cn("shrink-0", className)} />;
}
