import { cn } from "@/lib/utils";

/**
 * Logo einer Page. Nie beschnitten. Im Dunkelmodus auf heller Kachel, damit dunkle Logos
 * (die meisten) auf dunklem Grund lesbar bleiben.
 */
export function PageLogo({ url, className }: { url: string | null; className?: string }) {
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- eigenes, kleines Bild
    <img
      src={url}
      alt=""
      className={cn("w-auto shrink-0 object-contain dark:rounded-md dark:bg-white dark:p-0.5", className)}
    />
  );
}
