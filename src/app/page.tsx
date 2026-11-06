import Link from "next/link";
import { AppLogo } from "@/components/app-logo";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <AppLogo className="size-16" />
      <h1 className="text-xl font-semibold">Homebox Front</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Hier gibt es nichts zu sehen. Wenn dir jemand einen Link geschickt hat, öffne bitte genau diesen.
      </p>
      <Link href="/admin" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
        Verwaltung
      </Link>
    </main>
  );
}
