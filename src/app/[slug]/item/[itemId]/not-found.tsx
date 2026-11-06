"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftIcon, SearchXIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function ItemNotFound() {
  const slug = usePathname().split("/")[1] ?? "";
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center">
      <SearchXIcon className="size-10 text-muted-foreground" strokeWidth={1.25} />
      <h1 className="text-lg font-semibold">Dieses Teil gibt es hier nicht (mehr)</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Vielleicht wurde es weggeräumt oder umbenannt. In der Übersicht findest du alles, was gerade da ist.
      </p>
      {slug && (
        <Link href={`/${slug}`} className={buttonVariants({ variant: "outline", className: "mt-2 h-11 px-4" })}>
          <ArrowLeftIcon /> Zur Übersicht
        </Link>
      )}
    </main>
  );
}
