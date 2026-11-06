"use server";

import { headers } from "next/headers";
import { allowAttempt, unlockPage, verifyPassword } from "@/lib/auth";
import { getPageBySlug } from "@/lib/pages";

export type UnlockState = { error?: string };

export async function unlockAction(_prev: UnlockState, formData: FormData): Promise<UnlockState> {
  const slug = String(formData.get("slug") ?? "");
  const password = String(formData.get("password") ?? "");
  const page = getPageBySlug(slug);
  if (!page || !page.published || !page.passwordHash) return { error: "Diese Seite gibt es nicht." };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allowAttempt(`unlock:${page.id}:${ip}`)) {
    return { error: "Zu viele Versuche. Bitte in ein paar Minuten noch mal probieren." };
  }
  if (!verifyPassword(password, page.passwordHash)) {
    return { error: "Das Passwort stimmt leider nicht." };
  }
  await unlockPage(page);
  return {};
}
