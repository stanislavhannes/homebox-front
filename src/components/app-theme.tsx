import { connection } from "next/server";
import { ThemeProvider } from "@/components/theme-provider";
import { getSettings } from "@/lib/pages";

/**
 * Hell/Dunkel aus den Einstellungen. „system“ folgt dem Gerät, sonst fest erzwungen.
 * Liest die Einstellung pro Anfrage, damit eine Änderung sofort gilt.
 */
export async function AppTheme({ children }: { children: React.ReactNode }) {
  await connection();
  const theme = getSettings().theme;
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      forcedTheme={theme === "system" ? undefined : theme}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
