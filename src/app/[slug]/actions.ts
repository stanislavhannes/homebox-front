"use server";

import { checkPasswordAttempt, unlockPage, verifyPassword } from "@/lib/auth";
import { getPageBySlug } from "@/lib/pages";

export type UnlockState = { error?: string };

export async function unlockAction(_prev: UnlockState, formData: FormData): Promise<UnlockState> {
  const slug = String(formData.get("slug") ?? "");
  const password = String(formData.get("password") ?? "");
  const page = getPageBySlug(slug);
  if (!page || !page.published || !page.passwordHash) return { error: "Diese Seite gibt es nicht." };

  const hash = page.passwordHash;
  const error = await checkPasswordAttempt(
    `unlock:${page.id}`,
    () => verifyPassword(password, hash),
    "Das Passwort stimmt leider nicht.",
  );
  if (error) return { error };
  await unlockPage(page);
  return {};
}
