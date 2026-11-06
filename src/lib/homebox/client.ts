import "server-only";
import { env } from "@/lib/env";
import { mockApi } from "./mock";
import type { HbEntity, HbTreeItem } from "./types";

export type HomeboxApi = {
  getTree(withItems: boolean): Promise<HbTreeItem[]>;
  getEntity(id: string): Promise<HbEntity>;
  putEntity(id: string, body: Record<string, unknown>): Promise<HbEntity>;
  getAttachment(
    entityId: string,
    attachmentId: string,
  ): Promise<{ body: ArrayBuffer; contentType: string | null }>;
};

export class HomeboxError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "HomeboxError";
  }
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const { HOMEBOX_URL, HOMEBOX_TOKEN } = env();
  const url = `${HOMEBOX_URL.replace(/\/$/, "")}/api/v1${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${HOMEBOX_TOKEN}`,
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      signal: init.signal ?? AbortSignal.timeout(15_000),
    });
  } catch (err) {
    throw new HomeboxError(`Homebox nicht erreichbar (${(err as Error).message})`);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new HomeboxError(
      `Homebox ${init.method ?? "GET"} ${path} → HTTP ${res.status} ${text.slice(0, 200)}`,
      res.status,
    );
  }
  return res;
}

const realApi: HomeboxApi = {
  async getTree(withItems) {
    const res = await request(`/entities/tree?withItems=${withItems}`);
    return (await res.json()) as HbTreeItem[];
  },
  async getEntity(id) {
    const res = await request(`/entities/${encodeURIComponent(id)}`);
    return (await res.json()) as HbEntity;
  },
  async putEntity(id, body) {
    const res = await request(`/entities/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return (await res.json()) as HbEntity;
  },
  async getAttachment(entityId, attachmentId) {
    const res = await request(
      `/entities/${encodeURIComponent(entityId)}/attachments/${encodeURIComponent(attachmentId)}`,
      { headers: { Accept: "*/*" } },
    );
    return { body: await res.arrayBuffer(), contentType: res.headers.get("content-type") };
  },
};

export function homebox(): HomeboxApi {
  return env().HOMEBOX_MOCK ? mockApi : realApi;
}

/** Promise.all mit begrenzter Parallelität */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
