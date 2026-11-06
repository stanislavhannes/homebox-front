import "server-only";

export type Env = {
  HOMEBOX_URL: string;
  HOMEBOX_TOKEN: string;
  HOMEBOX_MOCK: boolean;
  ADMIN_PASSWORD: string;
  SESSION_SECRET: string;
  DATABASE_PATH: string;
};

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const mock = process.env.HOMEBOX_MOCK === "1" || process.env.HOMEBOX_MOCK === "true";
  const e: Env = {
    HOMEBOX_URL: process.env.HOMEBOX_URL ?? "",
    HOMEBOX_TOKEN: process.env.HOMEBOX_TOKEN ?? "",
    HOMEBOX_MOCK: mock,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "",
    SESSION_SECRET: process.env.SESSION_SECRET ?? "",
    DATABASE_PATH: process.env.DATABASE_PATH ?? "data/app.db",
  };
  const missing: string[] = [];
  if (!mock && !e.HOMEBOX_URL) missing.push("HOMEBOX_URL");
  if (!mock && !e.HOMEBOX_TOKEN) missing.push("HOMEBOX_TOKEN");
  if (!e.ADMIN_PASSWORD) missing.push("ADMIN_PASSWORD");
  if (e.SESSION_SECRET.length < 32) missing.push("SESSION_SECRET (mind. 32 Zeichen)");
  if (missing.length) {
    throw new Error(
      `Fehlende Umgebungsvariablen: ${missing.join(", ")}. Siehe .env.example.`,
    );
  }
  cached = e;
  return e;
}
