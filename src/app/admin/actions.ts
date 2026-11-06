"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  clearAttempts,
  isRateLimited,
  recordFailedAttempt,
  checkAdminPassword,
  endAdminSession,
  hashPassword,
  isAdmin,
  startAdminSession,
} from "@/lib/auth";
import { HOMEBOX_TAG } from "@/lib/catalog";
import { sniffContentType } from "@/lib/sniff";
import { normalizeAccent } from "@/lib/theme";
import { CONTACT_TITLE_MAX, normalizeMail, normalizePhone, normalizeTelegram } from "@/lib/contact";
import { shrinkLogo } from "@/lib/logo-image";
import { updateLoans } from "@/lib/loan-service";
import { formatLoan, isActive, todayInBerlin, computeAvailability } from "@/lib/loans";
import {
  createPage,
  deletePage,
  FIELD_OPTIONS,
  getPage,
  getPageBySlug,
  RESERVED_SLUGS,
  LOGO_MAX_BYTES,
  LOGO_TYPES,
  PAGE_LAYOUTS,
  THEME_SETTINGS,
  saveSettings,
  setPageLogo,
  updatePage,
  type PageInput,
  type VisibleField,
} from "@/lib/pages";

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

// ---------- Login ----------

/** field = Abschnitt im Formular, zu dem der Fehler gehört (Scroll + Markierung) */
export type FormState = { error?: string; ok?: string; field?: "allgemein" | "lagerorte" | "logo" | "passwort" | "kontakt" };

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `admin:${ip}`;
  if (isRateLimited(key)) {
    return { error: "Zu viele Versuche. Bitte in ein paar Minuten noch mal probieren." };
  }
  if (!checkAdminPassword(String(formData.get("password") ?? ""))) {
    recordFailedAttempt(key);
    return { error: "Falsches Passwort." };
  }
  clearAttempts(key);
  await startAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await endAdminSession();
  redirect("/admin/login");
}

// ---------- Pages ----------

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function savePageAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(formData.get("id") || 0) || null;
  const title = String(formData.get("title") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? "") || title);
  const allowedFields = new Set<string>(FIELD_OPTIONS.map((f) => f.key));

  const input: PageInput = {
    title,
    slug,
    intro: String(formData.get("intro") ?? "").trim(),
    layout: PAGE_LAYOUTS.find((l) => l === formData.get("layout")) ?? "A",
    locationIds: [...new Set(formData.getAll("locationIds").map(String))].filter(Boolean),
    contact: String(formData.get("contact") ?? "").trim(),
    visibleFields: formData
      .getAll("visibleFields")
      .map(String)
      .filter((f): f is VisibleField => allowedFields.has(f)),
    published: formData.get("published") === "on",
    accent: normalizeAccent(formData.get("accent")),
    howto: String(formData.get("howto") ?? "").trim(),
    contactTitle: String(formData.get("contactTitle") ?? "").trim().slice(0, CONTACT_TITLE_MAX),
    contactFields: { telegram: "", mail: "", phone: "" },
  };

  if (!title) return { error: "Bitte einen Titel angeben.", field: "allgemein" };
  if (!slug) return { error: "Der Link braucht mindestens einen Buchstaben oder eine Zahl.", field: "allgemein" };
  if (RESERVED_SLUGS.has(slug)) return { error: `„${slug}“ ist reserviert, bitte einen anderen Link wählen.`, field: "allgemein" };
  const existing = getPageBySlug(slug);
  if (existing && existing.id !== id) return { error: `Der Link „/${slug}“ ist schon vergeben.`, field: "allgemein" };
  if (input.locationIds.length === 0) return { error: "Bitte mindestens einen Lagerort auswählen.", field: "lagerorte" };

  const rawTg = String(formData.get("contactTelegram") ?? "").trim();
  const rawMail = String(formData.get("contactMail") ?? "").trim();
  const rawPhone = String(formData.get("contactPhone") ?? "").trim();
  const tg = rawTg ? normalizeTelegram(rawTg) : "";
  const mail = rawMail ? normalizeMail(rawMail) : "";
  const phone = rawPhone ? normalizePhone(rawPhone) : "";
  if (tg === null) return { error: "Telegram-Name: 5–32 Zeichen, Buchstabe zuerst, z. B. @stani_hannes.", field: "kontakt" };
  if (mail === null) return { error: "Die Mailadresse sieht nicht richtig aus.", field: "kontakt" };
  if (phone === null) return { error: "Die Telefonnummer sieht nicht richtig aus (6–15 Ziffern).", field: "kontakt" };
  input.contactFields = { telegram: tg, mail, phone };

  const newPassword = String(formData.get("password") ?? "");
  const removePassword = formData.get("removePassword") === "on";
  let passwordHash: string | null | undefined = undefined;
  if (removePassword) passwordHash = null;
  else if (newPassword) {
    if (newPassword.length < 4) return { error: "Das Passwort sollte mindestens 4 Zeichen haben.", field: "passwort" };
    passwordHash = hashPassword(newPassword);
  }

  // Logo: undefined = unverändert, null = entfernen
  let logo: { bytes: Uint8Array; type: string } | null | undefined = undefined;
  const logoFile = formData.get("logo");
  if (formData.get("removeLogo") === "on") logo = null;
  else if (logoFile instanceof File && logoFile.size > 0) {
    if (logoFile.size > LOGO_MAX_BYTES) return { error: "Das Logo ist zu groß (max. 2 MB).", field: "logo" };
    const buf = await logoFile.arrayBuffer();
    const type = sniffContentType(buf, null);
    if (!LOGO_TYPES.includes(type)) return { error: "Das Logo muss ein PNG, JPG, WebP, GIF oder SVG sein.", field: "logo" };
    logo = await shrinkLogo(new Uint8Array(buf), type);
  }

  let pageId = id;
  if (id) {
    if (!getPage(id)) return { error: "Diese Page gibt es nicht mehr." };
    updatePage(id, input, passwordHash);
  } else {
    pageId = createPage(input, passwordHash ?? null);
  }
  if (logo !== undefined && pageId) setPageLogo(pageId, logo);
  redirect(`/admin/pages/${pageId}?saved=1`);
}

export async function deletePageAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (id) deletePage(id);
  redirect("/admin");
}

// ---------- Einstellungen ----------

export async function saveSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const theme = THEME_SETTINGS.find((t) => t === formData.get("theme")) ?? "system";
  saveSettings({ hiddenTag: String(formData.get("hiddenTag") ?? ""), theme });
  updateTag(HOMEBOX_TAG);
  return { ok: "Gespeichert." };
}

export async function refreshHomeboxAction() {
  await requireAdmin();
  updateTag(HOMEBOX_TAG);
}

// ---------- Verleih ----------

export type LoanResult = { error?: string; ok?: string; loanText?: string };

export async function lendAction(_prev: LoanResult, formData: FormData): Promise<LoanResult> {
  await requireAdmin();
  const itemId = String(formData.get("itemId") ?? "");
  const quantity = Math.floor(Number(formData.get("quantity") || 1));
  const until = String(formData.get("until") ?? "");
  const borrower = String(formData.get("borrower") ?? "").trim().slice(0, 80);
  const today = todayInBerlin();

  if (!itemId) return { error: "Item fehlt." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(until)) return { error: "Bitte ein Rückgabedatum wählen." };
  if (until < today) return { error: "Das Rückgabedatum liegt in der Vergangenheit." };
  if (!(quantity >= 1)) return { error: "Die Menge muss mindestens 1 sein." };

  try {
    const { loanText } = await updateLoans(itemId, (current, total) => {
      const a = computeAvailability(total, current.loans, today);
      if (quantity > a.available) {
        throw new Error(
          a.available === 0
            ? "Gerade ist nichts davon verfügbar."
            : `Es sind nur noch ${a.available} von ${a.total} verfügbar.`,
        );
      }
      return {
        loans: [...current.loans, { quantity, until, ...(borrower ? { borrower } : {}) }],
        invalid: current.invalid,
      };
    });
    updateTag(HOMEBOX_TAG);
    const [y, m, d] = until.split("-");
    return { ok: `${quantity}× verliehen bis ${d}.${m}.${y}${borrower ? ` an ${borrower}` : ""}.`, loanText };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

/** index = Position im geparsten Verleih-Array; loan = formatierter Eintrag zur Sicherheit */
export async function returnLoanAction(itemId: string, loan: string): Promise<LoanResult> {
  await requireAdmin();
  try {
    const { loanText } = await updateLoans(itemId, (current) => {
      const idx = current.loans.findIndex((l) => formatLoan(l) === loan);
      if (idx === -1) {
        throw new Error("Dieser Verleih wurde inzwischen geändert. Bitte die Seite neu laden.");
      }
      return { loans: current.loans.filter((_, i) => i !== idx), invalid: current.invalid };
    });
    updateTag(HOMEBOX_TAG);
    return { ok: "Als zurückgegeben markiert.", loanText };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function cleanupExpiredAction(itemId: string): Promise<LoanResult> {
  await requireAdmin();
  const today = todayInBerlin();
  try {
    const { loanText } = await updateLoans(itemId, (current) => ({
      loans: current.loans.filter((l) => isActive(l, today)),
      invalid: current.invalid,
    }));
    updateTag(HOMEBOX_TAG);
    return { ok: "Abgelaufene Einträge entfernt.", loanText };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
