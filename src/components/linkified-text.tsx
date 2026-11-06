import { tokenize } from "@/lib/linkify";

/** Text mit Zeilenumbrüchen; URLs, Mailadressen und Telefonnummern werden klickbar. */
export function LinkifiedText({ text, className }: { text: string; className?: string }) {
  return (
    <p className={className} style={{ whiteSpace: "pre-line" }}>
      {tokenize(text).map((t, i) =>
        t.type === "text" ? (
          t.value
        ) : (
          <a
            key={i}
            href={t.href}
            className="font-medium text-primary underline underline-offset-4 [overflow-wrap:anywhere]"
            {...(t.type === "url" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {t.value}
          </a>
        ),
      )}
    </p>
  );
}
