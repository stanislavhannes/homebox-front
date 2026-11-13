import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { env } from "@/lib/env";
import type { PageConfig } from "@/lib/pages";

const ADMIN_COOKIE = "hf_admin";
const ADMIN_MAX_AGE = 60 * 60 * 24 * 30; // 30 Tage
const UNLOCK_MAX_AGE = 60 * 60 * 24 * 90; // 90 Tage

function sign(value: string): string {
  return createHmac("sha256", env().SESSION_SECRET).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

// ---------- Passwörter ----------

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 32);
  return `scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const actual = scryptSync(password, Buffer.from(salt, "base64url"), 32);
  return safeEqual(actual.toString("base64url"), hash);
}

// ---------- Admin ----------

export function checkAdminPassword(password: string): boolean {
  // Hash beider Seiten, damit der Vergleich unabhängig von der Länge zeitkonstant ist
  return safeEqual(sign(`pw.${password}`), sign(`pw.${env().ADMIN_PASSWORD}`));
}

export async function startAdminSession() {
  const exp = Math.floor(Date.now() / 1000) + ADMIN_MAX_AGE;
  (await cookies()).set(ADMIN_COOKIE, `${exp}.${sign(`admin.${exp}`)}`, {
    ...cookieBase,
    maxAge: ADMIN_MAX_AGE,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  // Prüft Ablaufzeit gegen die aktuelle Uhrzeit → nur zur Anfragezeit
  await connection();
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!value) return false;
  const [exp, sig] = value.split(".");
  if (!exp || !sig || Number(exp) * 1000 < Date.now()) return false;
  return safeEqual(sig, sign(`admin.${exp}`));
}

// ---------- Page-Passwörter ----------

function unlockCookieName(pageId: number) {
  return `hf_unlock_${pageId}`;
}

/** Der Wert hängt am Passwort-Hash: neues Passwort = alle Freischaltungen ungültig */
function unlockToken(page: PageConfig) {
  return sign(`unlock.${page.id}.${page.passwordHash}`);
}

export async function isPageUnlocked(page: PageConfig): Promise<boolean> {
  // Danach wird mit "heute" gerechnet → nur zur Anfragezeit
  await connection();
  if (!page.passwordHash) return true;
  const value = (await cookies()).get(unlockCookieName(page.id))?.value;
  return !!value && safeEqual(value, unlockToken(page));
}

/**
 * Schlüssel für Direktlinks (/<slug>/zugang?k=…), die eine Page ohne Passworteingabe öffnen.
 * Hängt wie das Cookie am Passwort-Hash: neues Passwort = alte Links ungültig.
 */
export function pageAccessKey(page: PageConfig): string | null {
  return page.passwordHash ? sign(`link.${page.id}.${page.passwordHash}`) : null;
}

export function verifyPageAccessKey(page: PageConfig, key: string): boolean {
  const expected = pageAccessKey(page);
  return !!expected && safeEqual(key, expected);
}

export async function unlockPage(page: PageConfig) {
  (await cookies()).set(unlockCookieName(page.id), unlockToken(page), {
    ...cookieBase,
    maxAge: UNLOCK_MAX_AGE,
  });
}

// ---------- einfaches Rate-Limit (im Speicher, reicht für eine Instanz) ----------

const attempts = new Map<string, { count: number; resetAt: number }>();

/** true = Versuch erlaubt. 10 Versuche pro 10 Minuten und Schlüssel. */
/** Gesperrt, wenn in den letzten 10 Minuten zu viele FEHLversuche kamen. Erfolgreiche zählen nicht. */
export function isRateLimited(key: string, max = 10): boolean {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < Date.now()) return false;
  return entry.count >= max;
}

export function recordFailedAttempt(key: string, windowMs = 10 * 60_000) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) attempts.set(key, { count: 1, resetAt: now + windowMs });
  else entry.count++;
}

export function clearAttempts(key: string) {
  attempts.delete(key);
}
