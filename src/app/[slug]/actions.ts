"use server";

import { clearAttempts, clientIp, rateLimitedFor, rateLimitMessage, recordFailedAttempt, unlockPage, verifyPassword } from "@/lib/auth";
import { getPageBySlug } from "@/lib/pages";

export type UnlockState = { error?: string };

export async function unlockAction(_prev: UnlockState, formData: FormData): Promise<UnlockState> {
  const slug = String(formData.get("slug") ?? "");
  const password = String(formData.get("password") ?? "");
  const page = getPageBySlug(slug);
  if (!page || !page.published || !page.passwordHash) return { error: "Diese Seite gibt es nicht." };

  const ip = await clientIp();
  const scope = `unlock:${page.id}`;
  const locked = rateLimitedFor(scope, ip);
  if (locked) return { error: rateLimitMessage(locked) };
  if (!verifyPassword(password, page.passwordHash)) {
    recordFailedAttempt(scope, ip);
    return { error: "Das Passwort stimmt leider nicht." };
  }
  clearAttempts(scope, ip);
  await unlockPage(page);
  return {};
}
