import { createHash } from "crypto";
import { mkdir, readFile, stat, unlink, writeFile } from "fs/promises";
import { join } from "path";

const DISABLED =
  process.env.EVENT_IMAGE_CACHE === "0" ||
  process.env.EVENT_IMAGE_CACHE === "false";

function cacheRootDir(): string {
  if (process.env.EVENT_IMAGE_CACHE_DIR?.trim()) {
    return process.env.EVENT_IMAGE_CACHE_DIR.trim();
  }
  if (process.env.VERCEL) {
    return join("/tmp", "event-image-cache");
  }
  return join(process.cwd(), ".cache", "event-images");
}

function maxAgeMs(): number {
  const raw = process.env.EVENT_IMAGE_CACHE_MAX_AGE_SEC;
  if (raw && /^\d+$/.test(raw)) {
    return Math.max(60, Number.parseInt(raw, 10)) * 1000;
  }
  return 7 * 24 * 60 * 60 * 1000;
}

export function eventImageCacheKey(remoteUrl: string): string {
  return createHash("sha256").update(remoteUrl.trim()).digest("hex");
}

type Meta = { contentType: string; savedAt: number };

export async function readEventImageCache(
  key: string,
): Promise<{ body: Uint8Array; contentType: string } | null> {
  if (DISABLED) return null;
  const root = cacheRootDir();
  const binPath = join(root, `${key}.bin`);
  const metaPath = join(root, `${key}.json`);
  try {
    const st = await stat(binPath);
    if (Date.now() - st.mtimeMs > maxAgeMs()) {
      void unlink(binPath).catch(() => {});
      void unlink(metaPath).catch(() => {});
      return null;
    }
    const [metaRaw, buf] = await Promise.all([
      readFile(metaPath, "utf-8"),
      readFile(binPath),
    ]);
    const meta = JSON.parse(metaRaw) as Meta;
    if (!meta?.contentType?.startsWith("image/")) return null;
    return { body: new Uint8Array(buf), contentType: meta.contentType };
  } catch {
    return null;
  }
}

export async function writeEventImageCache(
  key: string,
  body: Uint8Array,
  contentType: string,
): Promise<void> {
  if (DISABLED) return;
  if (!contentType.startsWith("image/") || body.byteLength === 0) return;
  const root = cacheRootDir();
  await mkdir(root, { recursive: true });
  const binPath = join(root, `${key}.bin`);
  const metaPath = join(root, `${key}.json`);
  const meta: Meta = {
    contentType,
    savedAt: Date.now(),
  };
  await writeFile(binPath, body);
  await writeFile(metaPath, JSON.stringify(meta), "utf-8");
}
