/** YYYY-MM-DD in n Tagen ab `today` (Rechnung in UTC-Mittag, ohne Zeitzonen-Sprung) */
export function addDays(today: string, n: number) {
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function nextSunday(today: string) {
  const day = new Date(`${today}T12:00:00Z`).getUTCDay(); // 0 = Sonntag
  return addDays(today, day === 0 ? 7 : 7 - day);
}

/** Schnellwahl fürs Rückgabedatum */
export function datePresets(today: string) {
  return [
    { label: "Bis Sonntag", value: nextSunday(today) },
    { label: "1 Woche", value: addDays(today, 7) },
    { label: "2 Wochen", value: addDays(today, 14) },
  ];
}
