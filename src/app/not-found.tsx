import { SearchXIcon } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center">
      <SearchXIcon className="size-10 text-muted-foreground" strokeWidth={1.25} />
      <h1 className="text-lg font-semibold">Nicht gefunden</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Diese Seite gibt es nicht (mehr). Prüf bitte den Link, den du bekommen hast.
      </p>
    </main>
  );
}
