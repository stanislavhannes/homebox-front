"use server";

import { headers } from "next/headers";
import { clearAttempts, isRateLimited, recordFailedAttempt, unlockPage, verifyPassword } from "@/lib/auth";
import { getPageBySlug } from "@/lib/pages";

export type UnlockState = { error?: string };

export async function unlockAction(_prev: UnlockState, formData: FormData): Promise<UnlockState> {
  const slug = String(formData.get("slug") ?? "");
  const password = String(formData.get("password") ?? "");
  const page = getPageBySlug(slug);
  if (!page || !page.published || !page.passwordHash) return { error: "Diese Seite gibt es nicht." };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `unlock:${page.id}:${ip}`;
  if (isRateLimited(key)) {
    return { error: "Zu viele Versuche. Bitte in ein paar Minuten noch mal probieren." };
  }
  if (!verifyPassword(password, page.passwordHash)) {
    recordFailedAttempt(key);
    return { error: "Das Passwort stimmt leider nicht." };
  }
  clearAttempts(key);
  await unlockPage(page);
  return {};
}
