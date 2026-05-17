"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  EVENT_COVER_FALLBACK,
  eventCoverImageUrl,
  eventImagePreferPostBody,
} from "@/lib/event-image";
import { FARTLEK_PUBLIC_TELEGRAM_URL } from "@/lib/fartlek-telegram-public";
import { cn } from "@/lib/utils";

type EventCoverImageProps = {
  originalSrc: string;
  /** Наприклад `event.registrationLink` (`https://t.me/channel/NNN`) — для оновлення застарілого CDN-превʼю. */
  telegramPostUrl?: string | null;
  alternateSrcs?: readonly string[];
  alt: string;
  /** Підказка при наведенні — звідки фото */
  titleHint?: string;
  className?: string;
  loading?: "lazy" | "eager";
};

function isFallbackCoverSrc(src: string): boolean {
  const t = src.trim();
  return (
    t === EVENT_COVER_FALLBACK ||
    t.endsWith("/telegram-channel-cover.svg")
  );
}

/**
 * Превʼю через /api/event-image (CDN Telegram / Telegraph).
 * — Для довгих проксі-рядків спершу POST → blob (інколи GET у <img> не працює).
 * — SVG-плейсхолдер не показуємо, доки тримається POST для таких URL.
 * — Запасні URL з допису (`alternateSrcs`), якщо основне превʼю недоступне.
 */
export function EventCoverImage({
  originalSrc,
  telegramPostUrl,
  alternateSrcs,
  alt,
  titleHint = `Фото з Telegram-каналу ${FARTLEK_PUBLIC_TELEGRAM_URL}`,
  className,
  loading = "lazy",
}: EventCoverImageProps) {
  /** Якщо в БД лише локальний SVG — один раз знімаємо превʼю з публічної сторінки поста. */
  const chainIsOnlyFallback = useMemo(() => {
    const seq = [originalSrc, ...(alternateSrcs ?? [])]
      .map((u) => u?.trim())
      .filter(Boolean);
    if (seq.length === 0) return true;
    return seq.every((t) => isFallbackCoverSrc(t));
  }, [originalSrc, alternateSrcs]);

  const [posterFromPost, setPosterFromPost] = useState<string | null>(null);
  const [posterHydrateDone, setPosterHydrateDone] = useState(
    () => !chainIsOnlyFallback,
  );

  useEffect(() => {
    setPosterFromPost(null);
    setPosterHydrateDone(!chainIsOnlyFallback);
  }, [
    chainIsOnlyFallback,
    telegramPostUrl,
    originalSrc,
    alternateSrcs,
  ]);

  useEffect(() => {
    const tg = telegramPostUrl?.trim();
    if (!tg || !chainIsOnlyFallback) {
      setPosterHydrateDone(true);
      return;
    }

    let cancelled = false;
    setPosterHydrateDone(false);

    void (async () => {
      try {
        const res = await fetch("/api/telegram-post-cover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telegramPost: tg }),
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { urls?: unknown };
        const urls = Array.isArray(data.urls)
          ? data.urls.filter((x): x is string => typeof x === "string")
          : [];
        const first = urls.find((u) => /^https:\/\//i.test(u.trim()));
        if (first && !cancelled) setPosterFromPost(first.trim());
      } finally {
        if (!cancelled) setPosterHydrateDone(true);
      }
    })();

    return () => {
      cancelled = true;
      setPosterHydrateDone(true);
    };
  }, [chainIsOnlyFallback, telegramPostUrl]);

  const originChain = useMemo(() => {
    const seen = new Set<string>();
    const raw: string[] = [];
    const pf = posterFromPost?.trim();
    if (pf) {
      seen.add(pf);
      raw.push(pf);
    }
    for (const u of [originalSrc, ...(alternateSrcs ?? [])]) {
      const t = u?.trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      raw.push(t);
    }
    const preferred = raw.filter((s) => !isFallbackCoverSrc(s));
    return preferred.length > 0 ? preferred : raw;
  }, [originalSrc, alternateSrcs, posterFromPost]);

  const originChainRef = useRef(originChain);
  originChainRef.current = originChain;

  const [originIndex, setOriginIndex] = useState(0);
  const activeOriginal =
    originChain[Math.min(originIndex, Math.max(0, originChain.length - 1))] ??
    originalSrc.trim();

  useEffect(() => {
    setOriginIndex(0);
  }, [originChain]);

  const proxiedUrl = useMemo(
    () => eventCoverImageUrl(activeOriginal, telegramPostUrl),
    [activeOriginal, telegramPostUrl],
  );
  const preferPostBody = useMemo(
    () => eventImagePreferPostBody(activeOriginal, telegramPostUrl),
    [activeOriginal, telegramPostUrl],
  );

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const postRecoverAttemptedRef = useRef(false);
  const candidatesRef = useRef<string[]>([]);

  const loadViaPost = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/event-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: activeOriginal,
          ...(telegramPostUrl?.trim()
            ? { telegramPost: telegramPostUrl.trim() }
            : {}),
        }),
      });
      if (!res.ok) return null;
      const b = await res.blob();
      return URL.createObjectURL(b);
    } catch {
      return null;
    }
  }, [activeOriginal, telegramPostUrl]);

  /** Довгі проксі-URL: один POST у blob перед показом <img>, щоб не «залипати» на SVG */
  const [longProxyResolved, setLongProxyResolved] = useState(false);

  useEffect(() => {
    postRecoverAttemptedRef.current = false;
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    if (!preferPostBody) {
      setLongProxyResolved(true);
      return;
    }

    setLongProxyResolved(false);
    let cancelled = false;
    let created: string | null = null;

    void (async () => {
      const u = await loadViaPost();
      if (cancelled) return;
      setLongProxyResolved(true);
      if (!u) return;
      created = u;
      setBlobUrl(u);
    })();

    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [preferPostBody, activeOriginal, loadViaPost]);

  const candidates = useMemo(() => {
    if (blobUrl) return [blobUrl, activeOriginal, EVENT_COVER_FALLBACK];
    if (preferPostBody)
      return [activeOriginal, proxiedUrl, EVENT_COVER_FALLBACK];
    if (proxiedUrl !== activeOriginal)
      return [proxiedUrl, activeOriginal, EVENT_COVER_FALLBACK];
    return [activeOriginal, EVENT_COVER_FALLBACK];
  }, [blobUrl, preferPostBody, proxiedUrl, activeOriginal]);

  useEffect(() => {
    candidatesRef.current = candidates;
  }, [candidates]);

  const [index, setIndex] = useState(0);
  useEffect(() => {
    setIndex(0);
  }, [activeOriginal, blobUrl]);

  const src = candidates[Math.min(index, candidates.length - 1)];

  const onError = useCallback(() => {
    void (async () => {
      if (
        proxiedUrl !== activeOriginal &&
        blobUrl === null &&
        !preferPostBody &&
        !postRecoverAttemptedRef.current
      ) {
        postRecoverAttemptedRef.current = true;
        const u = await loadViaPost();
        if (u) {
          setBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return u;
          });
          setIndex(0);
          return;
        }
      }

      setIndex((i) => {
        const pool = candidatesRef.current;
        if (i + 1 < pool.length) return i + 1;
        queueMicrotask(() =>
          setOriginIndex((o) =>
            o + 1 < originChainRef.current.length ? o + 1 : o,
          ),
        );
        return 0;
      });
    })();
  }, [
    activeOriginal,
    blobUrl,
    loadViaPost,
    preferPostBody,
    proxiedUrl,
  ]);

  const awaitingLongProxyBlob =
    preferPostBody && blobUrl === null && !longProxyResolved;

  const awaitingPosterHydrate =
    chainIsOnlyFallback &&
    Boolean(telegramPostUrl?.trim()) &&
    !posterHydrateDone;

  if (awaitingPosterHydrate || awaitingLongProxyBlob) {
    return (
      <div className={cn(className, "bg-ink-900/90")} aria-hidden />
    );
  }

  return (
    <img
      key={src}
      src={src}
      alt={alt}
      title={titleHint}
      loading={loading}
      decoding="async"
      onError={onError}
      className={cn(className)}
    />
  );
}
