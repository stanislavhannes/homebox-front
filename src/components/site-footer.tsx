import { AppLogo } from "@/components/app-logo";

export const REPO_URL = "https://github.com/stanislavhannes/homebox-front";

/** Schmale Fußzeile auf allen Seiten: Projektname und Link zum Quellcode */
export function SiteFooter() {
  return (
    <footer className="site-footer mt-auto border-t">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-4 text-xs text-muted-foreground">
        <AppLogo className="size-4" />
        <span>Homebox Front</span>
        <span aria-hidden>·</span>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-8 items-center underline-offset-4 hover:text-foreground hover:underline"
        >
          Open Source auf GitHub
        </a>
      </div>
    </footer>
  );
}
