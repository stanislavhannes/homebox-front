export { cn } from "cn"

/** Für die Suche: klein, ohne Akzente („Bühne“ findet „buhne“) */
export function searchKey(s: string) {
  return s.toLocaleLowerCase("de").normalize("NFD").replace(/\p{Diacritic}/gu, "")
}
