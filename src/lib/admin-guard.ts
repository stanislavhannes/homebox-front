import "server-only";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";

/** In jeder Admin-Page aufrufen: Layout und Page rendern parallel, ein Check im Layout reicht nicht. */
export async function requireAdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
}
