import { CloudOffIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RetryButton } from "./retry-button";

export function ShopSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6" aria-busy="true" aria-label="Lädt">
      <Skeleton className="h-9 w-64" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border">
            <Skeleton className="aspect-[4/3] rounded-none" />
            <div className="space-y-2 p-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HomeboxUnavailable() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center">
      <CloudOffIcon className="size-10 text-muted-foreground" strokeWidth={1.25} />
      <h1 className="text-lg font-semibold">Gerade nicht erreichbar</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Das Inventar lässt sich im Moment nicht laden. Bitte versuch es in ein paar Minuten noch einmal.
      </p>
      <RetryButton />
    </main>
  );
}
