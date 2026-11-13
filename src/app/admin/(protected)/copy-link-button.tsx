"use client";

import { CheckIcon, KeyRoundIcon, LinkIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Kopiert den vollen Link einer Page, z. B. zum Weiterschicken per Messenger.
 * Mit accessKey: Link, der eine passwortgeschützte Page ohne Eingabe öffnet.
 */
export function CopyLinkButton({ slug, accessKey }: { slug: string; accessKey?: string }) {
  const [done, setDone] = useState(false);
  // Nach erfolgreichem Kopieren den Schlüssel nicht anzeigen; nur wenn Kopieren scheitert, steht der Link im Toast
  const { Icon, label, path, copied } = accessKey
    ? {
        Icon: KeyRoundIcon,
        label: "Zugangslink kopieren",
        path: `/${slug}/zugang?k=${encodeURIComponent(accessKey)}`,
        copied: () => "Zugangslink kopiert – öffnet die Page ohne Passwort.",
      }
    : { Icon: LinkIcon, label: "Link kopieren", path: `/${slug}`, copied: (url: string) => `Link kopiert: ${url}` };
  return (
    <Button
      variant="outline"
      size="sm"
      className="max-md:h-10"
      onClick={async () => {
        const url = window.location.origin + path;
        try {
          await navigator.clipboard.writeText(url);
          setDone(true);
          toast.success(copied(url));
          setTimeout(() => setDone(false), 2000);
        } catch {
          toast.error(`Kopieren ging nicht. Link: ${url}`);
        }
      }}
    >
      {done ? <CheckIcon /> : <Icon />} {label}
    </Button>
  );
}
