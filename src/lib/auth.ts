import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
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

/**
 * Signierter Inhalt des Admin-Cookies. Hängt am Admin-Passwort: Wird ADMIN_PASSWORD geändert,
 * sind alle bestehenden Sessions (auch gestohlene Cookies) sofort ungültig.
 */
function adminSessionSig(exp: string) {
  return sign(`admin.${exp}.${sign(`pw.${env().ADMIN_PASSWORD}`)}`);
}

export async function startAdminSession() {
  const exp = String(Math.floor(Date.now() / 1000) + ADMIN_MAX_AGE);
  (await cookies()).set(ADMIN_COOKIE, `${exp}.${adminSessionSig(exp)}`, {
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
  return safeEqual(sig, adminSessionSig(exp));
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

/**
 * IP des Besuchers. Ein Reverse Proxy (Traefik, Caddy, nginx) hängt die echte Adresse hinten an
 * X-Forwarded-For an; alles davor kann der Client selbst mitschicken. Darum der letzte Eintrag.
 * Ohne Proxy ist der Header komplett frei wählbar, deshalb gibt es zusätzlich ein globales Limit.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean);
  return forwarded?.at(-1) || h.get("x-real-ip")?.trim() || "local";
}

type Bucket = { count: number; resetAt: number };
type Limit = { max: number; windowMs: number };

/**
 * Drei Stufen, damit niemand unbegrenzt Passwörter durchprobieren kann:
 *  - pro IP: 10 Fehlversuche in 10 Minuten
 *  - pro Bereich (Admin-Login bzw. eine Page) über alle IPs: 50 in 10 Minuten
 *  - pro Bereich am Tag: 200 Fehlversuche in 24 Stunden
 * Die globalen Stufen greifen auch bei gefälschten IPs und verteiltem Raten.
 */
const PER_IP: Limit = { max: 10, windowMs: 10 * 60_000 };
const GLOBAL: Limit = { max: 50, windowMs: 10 * 60_000 };
const DAILY: Limit = { max: 200, windowMs: 24 * 60 * 60_000 };
/** Obergrenze für gemerkte IPs, damit der Speicher nicht beliebig wächst */
const MAX_TRACKED = 5_000;

const perIp = new Map<string, Bucket>();
const global = new Map<string, Bucket>();
const daily = new Map<string, Bucket>();

/** Restliche Sperrzeit in ms, 0 = frei */
function lockedFor(map: Map<string, Bucket>, key: string, limit: Limit) {
  const entry = map.get(key);
  const now = Date.now();
  return entry && entry.resetAt >= now && entry.count >= limit.max ? entry.resetAt - now : 0;
}

function bump(map: Map<string, Bucket>, key: string, limit: Limit) {
  const now = Date.now();
  const entry = map.get(key);
  if (!entry || entry.resetAt < now) {
    map.delete(key);
    map.set(key, { count: 1, resetAt: now + limit.windowMs });
  } else entry.count++;
}

function prune() {
  if (perIp.size <= MAX_TRACKED) return;
  const now = Date.now();
  for (const [k, v] of perIp) if (v.resetAt < now) perIp.delete(k);
  // Immer noch zu viele: die ältesten zuerst vergessen (Map behält die Einfügereihenfolge)
  for (const k of perIp.keys()) {
    if (perIp.size <= MAX_TRACKED) break;
    perIp.delete(k);
  }
}

/** Wie lange (ms) noch gesperrt ist; 0 = Versuch erlaubt. Nur FEHLversuche zählen. */
export function rateLimitedFor(scope: string, ip: string): number {
  return Math.max(
    lockedFor(perIp, `${scope}:${ip}`, PER_IP),
    lockedFor(global, scope, GLOBAL),
    lockedFor(daily, scope, DAILY),
  );
}

export function isRateLimited(scope: string, ip: string): boolean {
  return rateLimitedFor(scope, ip) > 0;
}

/** Fehlermeldung für eine Sperre, z. B. „… in 7 Minuten …“ */
export function rateLimitMessage(ms: number): string {
  const minutes = Math.ceil(ms / 60_000);
  const wait = minutes >= 90 ? `${Math.ceil(minutes / 60)} Stunden` : minutes === 1 ? "einer Minute" : `${minutes} Minuten`;
  return `Zu viele falsche Versuche. Bitte in ${wait} noch mal probieren.`;
}

export function recordFailedAttempt(scope: string, ip: string) {
  bump(perIp, `${scope}:${ip}`, PER_IP);
  bump(global, scope, GLOBAL);
  bump(daily, scope, DAILY);
  prune();
}

/** Nach erfolgreicher Anmeldung: nur die Sperre dieser IP aufheben, die globalen Zähler bleiben */
export function clearAttempts(scope: string, ip: string) {
  perIp.delete(`${scope}:${ip}`);
}
