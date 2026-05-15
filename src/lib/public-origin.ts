import { FARTLEK_SITE_ORIGIN } from "@/lib/event-detail";

/** Хости, які можна підміняти на фактичний origin відповіді. */
const LEGACY_EVENT_HOSTS = ["fartlek.events", "www.fartlek.events"];

function tryParseOrigin(candidate: string): string | null {
  const trimmed = candidate.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(
      trimmed.startsWith("http://") || trimmed.startsWith("https://") ?
        trimmed
      : `https://${trimmed}`,
    );
    return u.origin.replace(/\/$/, "");
  } catch {
    return null;
  }
}

/**
 * Чи можна довіряти origin з браузера (Origin / Referer / clientOrigin) для URL у чаті.
 */
export function isAllowedPublicOriginHint(candidate: string): boolean {
  const origin = tryParseOrigin(candidate);
  if (!origin) return false;
  let hostname: string;
  try {
    hostname = new URL(origin).hostname.toLowerCase();
  } catch {
    return false;
  }
  if (hostname === "localhost" || hostname.endsWith(".localhost")) return true;
  if (hostname.startsWith("127.")) return true;
  if (hostname.endsWith(".vercel.app")) return true;
  if (hostname === "fartlek.events" || hostname.endsWith(".fartlek.events")) {
    return true;
  }

  const envRaw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envRaw) {
    const envOrigin = tryParseOrigin(envRaw);
    if (envOrigin) {
      try {
        if (new URL(envOrigin).hostname.toLowerCase() === hostname) return true;
      } catch {
        /* */
      }
    }
  }
  return false;
}

/**
 * Публічний origin за заголовками проксі / запиту (без підказки з браузера).
 */
export function publicOriginFromRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const proto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";
  if (forwarded) {
    return `${proto}://${forwarded}`.replace(/\/$/, "");
  }

  try {
    const u = new URL(req.url);
    const h = u.hostname;
    const internal =
      h === "0.0.0.0" ||
      h === "127.0.0.1" ||
      h.endsWith(".internal") ||
      /^10\.\d+\.\d+\.\d+$/.test(h) ||
      /^169\.254\./.test(h);
    if (h && !internal) {
      return u.origin.replace(/\/$/, "");
    }
  } catch {
    /* ignore */
  }

  const host = req.headers.get("host")?.trim();
  if (host) {
    const scheme =
      host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
    return `${scheme}://${host}`.replace(/\/$/, "");
  }

  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (env) return env;

  return FARTLEK_SITE_ORIGIN.replace(/\/$/, "");
}

function refererOrigin(req: Request): string | null {
  const ref = req.headers.get("referer")?.trim();
  if (!ref) return null;
  try {
    return new URL(ref).origin;
  } catch {
    return null;
  }
}

/**
 * Найнадійніший origin для посилань у відповіді асистента:
 * підказка з клієнта, заголовки Origin / Referer, далі — проксі / host.
 */
export function resolvePublicOrigin(
  req: Request,
  hints: Array<string | null | undefined>,
): string {
  const merged: string[] = [];
  for (const h of hints) {
    if (typeof h === "string" && h.trim()) merged.push(h.trim());
  }

  for (const raw of merged) {
    if (!isAllowedPublicOriginHint(raw)) continue;
    const o = tryParseOrigin(raw);
    if (o) return o;
  }
  return publicOriginFromRequest(req);
}

/** Підмішує заголовки браузера до списку підказок для origin. */
export function requestOriginHints(
  req: Request,
  extra: Array<string | null | undefined>,
): Array<string | null | undefined> {
  return [
    ...extra,
    req.headers.get("origin"),
    refererOrigin(req),
  ];
}

/** Підміняє канонічні / застарілі хости в тексті на фактичний origin. */
export function alignAssistantLinksToOrigin(
  text: string,
  publicOrigin: string,
): string {
  const base = publicOrigin.replace(/\/$/, "");
  let out = text;
  for (const host of LEGACY_EVENT_HOSTS) {
    out = out.replaceAll(`https://${host}`, base);
    out = out.replaceAll(`http://${host}`, base);
  }
  try {
    const canon = new URL(FARTLEK_SITE_ORIGIN).hostname;
    if (!LEGACY_EVENT_HOSTS.includes(canon)) {
      out = out.replaceAll(`https://${canon}`, base);
      out = out.replaceAll(`http://${canon}`, base);
    }
  } catch {
    /* */
  }
  return out;
}
