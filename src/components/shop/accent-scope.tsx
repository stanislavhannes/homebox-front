import { accentStyle } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Setzt die Akzentfarbe einer Page für alles darin (Buttons, Chips, Fokusrahmen, Header B). */
export function AccentScope({ accent, children }: { accent: string | null; children: React.ReactNode }) {
  return (
    <div style={accentStyle(accent)} className={cn("public-scope flex flex-1 flex-col", accent && "accent-custom")}>
      {children}
    </div>
  );
}
