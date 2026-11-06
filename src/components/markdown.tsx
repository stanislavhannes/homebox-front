import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Markdown aus Homebox (Beschreibung, Notizen) formatiert anzeigen.
 * HTML-Schnipsel im Text werden weggelassen (nie ausgeführt). Bilder aus dem Text werden nicht
 * geladen, damit Besucher keine fremden Server anfragen; Fotos kommen aus den Anhängen.
 */
const components: Components = {
  h1: ({ children }) => <h3 className="mt-5 mb-2 text-lg font-semibold first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mt-5 mb-2 text-base font-semibold first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-4 mb-1.5 font-semibold first:mt-0">{children}</h4>,
  h4: ({ children }) => <h5 className="mt-4 mb-1 font-medium first:mt-0">{children}</h5>,
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children, className }) => (
    <ul className={cn("my-2 space-y-1 pl-5", className?.includes("contains-task-list") ? "list-none pl-1" : "list-disc")}>
      {children}
    </ul>
  ),
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="pl-0.5 [&>input]:mr-2 [&>input]:align-middle">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary underline underline-offset-4 break-words"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 pl-3 text-muted-foreground italic">{children}</blockquote>
  ),
  code: ({ children, className }) =>
    className ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]">{children}</code>
    ),
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-sm">{children}</pre>
  ),
  hr: () => <hr className="my-4" />,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
  tr: ({ children }) => <tr className="border-b last:border-0">{children}</tr>,
  th: ({ children }) => <th className="px-3 py-2 text-left font-medium">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2 align-top">{children}</td>,
};

export function Markdown({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("min-w-0 [overflow-wrap:anywhere] max-md:hyphens-auto", className)} lang="de">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
        disallowedElements={["img"]}
        unwrapDisallowed
        skipHtml
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
