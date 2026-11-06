export type Token =
  | { type: "text"; value: string }
  | { type: "url" | "mail" | "phone" | "telegram"; value: string; href: string };

/**
 * Reihenfolge: URL, Mail, Telefon, Telegram-@name, nacktes t.me/name.
 * Telegram-Namen: 5–32 Zeichen, Buchstabe zuerst, dann Buchstaben, Ziffern, Unterstrich.
 * Mailadressen gewinnen, weil ihr Treffer früher im Text beginnt („info@x.de“ ist nie „@x“).
 */
const TOKEN_RE =
  /(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)|((?<![\w\d+])(?:\+|0)\d[\d /()-]*\d)|(?<![\w.@/])@([A-Za-z][A-Za-z0-9_]{4,31})(?!\w)|(?<![\w/.])(?:t\.me|telegram\.me)\/([A-Za-z][A-Za-z0-9_]{4,31})(?!\w)/g;

/**
 * Telefonnummern nur, wenn sie wie eine aussehen: Start mit + oder 0, 7–15 Ziffern, mindestens
 * ein Block mit 3 Ziffern. So bleiben Kanal-Listen („3/4/5/6/8/9/11/12“), Daten, Maße und
 * Modellnummern normaler Text.
 */
function isPhone(s: string) {
  const digits = s.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return false;
  if (!/\d{3}/.test(s)) return false;
  // „0 / 1 / 2“-artige Aufzählungen: zu viele Trennzeichen pro Ziffer
  const separators = (s.match(/[ /()-]+/g) ?? []).length;
  return separators <= Math.ceil(digits.length / 3);
}

export function tokenize(text: string): Token[] {
  const out: Token[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN_RE)) {
    const idx = m.index ?? 0;
    const [whole, url, mail, phone, tgHandle, tgLink] = m;
    if (phone && !isPhone(phone)) continue;
    if (idx > last) out.push({ type: "text", value: text.slice(last, idx) });
    if (url) out.push({ type: "url", value: whole, href: url });
    else if (mail) out.push({ type: "mail", value: whole, href: `mailto:${mail}` });
    else if (tgHandle || tgLink) out.push({ type: "telegram", value: whole, href: `https://t.me/${tgHandle || tgLink}` });
    else out.push({ type: "phone", value: whole, href: `tel:${phone.replace(/[^\d+]/g, "")}` });
    last = idx + whole.length;
  }
  if (last < text.length) out.push({ type: "text", value: text.slice(last) });
  return out;
}
