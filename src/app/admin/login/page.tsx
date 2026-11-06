import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin-Login" };

export default function LoginPage() {
  return (
    <div className="admin-theme flex flex-1 flex-col">
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <LoginForm />
      </main>
    </div>
  );
}
