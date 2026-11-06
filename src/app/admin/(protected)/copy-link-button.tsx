"use client";

import { CheckIcon, LinkIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Kopiert den vollen Link einer Page, z. B. zum Weiterschicken per Messenger. */
export function CopyLinkButton({ slug }: { slug: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      className="max-md:h-10"
      onClick={async () => {
        const url = `${window.location.origin}/${slug}`;
        try {
          await navigator.clipboard.writeText(url);
          setDone(true);
          toast.success(`Link kopiert: ${url}`);
          setTimeout(() => setDone(false), 2000);
        } catch {
          toast.error(`Kopieren ging nicht. Link: ${url}`);
        }
      }}
    >
      {done ? <CheckIcon /> : <LinkIcon />} Link kopieren
    </Button>
  );
}
