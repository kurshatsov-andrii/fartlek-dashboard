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
  alternateSrcs?: readonly string[];
  alt: string;
  /** Підказка при наведенні — звідки фото */
  titleHint?: string;
  className?: string;
  loading?: "lazy" | "eager";
};

/**
 * Превʼю через /api/event-image (CDN Telegram / Telegraph).
 * — Для довгих URL (великий `?url=`) — POST + blob, без обрізання query-string.
 * — При помилці GET пробуємо один раз постовий запит.
 * — Є запасні URL з того ж допису (`alternateSrcs`), якщо основне превʼю недоступне.
 */
export function EventCoverImage({
  originalSrc,
  alternateSrcs,
  alt,
  titleHint = `Фото з Telegram-каналу ${FARTLEK_PUBLIC_TELEGRAM_URL}`,
  className,
  loading = "lazy",
}: EventCoverImageProps) {
  const originChain = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const u of [originalSrc, ...(alternateSrcs ?? [])]) {
      const t = u?.trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      out.push(t);
    }
    return out;
  }, [originalSrc, alternateSrcs]);

  const originChainRef = useRef(originChain);
  originChainRef.current = originChain;

  const [originIndex, setOriginIndex] = useState(0);
  const activeOriginal =
    originChain[Math.min(originIndex, Math.max(0, originChain.length - 1))] ??
    originalSrc;

  useEffect(() => {
    setOriginIndex(0);
  }, [originalSrc, alternateSrcs]);

  const proxiedUrl = useMemo(
    () => eventCoverImageUrl(activeOriginal),
    [activeOriginal],
  );
  const preferPostBody = useMemo(
    () => eventImagePreferPostBody(activeOriginal),
    [activeOriginal],
  );

  /** blob: URL створений із відповіді POST /api/event-image */
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const postRecoverAttemptedRef = useRef(false);
  const candidatesRef = useRef<string[]>([]);

  const loadViaPost = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/event-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: activeOriginal }),
      });
      if (!res.ok) return null;
      const b = await res.blob();
      return URL.createObjectURL(b);
    } catch {
      return null;
    }
  }, [activeOriginal]);

  useEffect(() => {
    postRecoverAttemptedRef.current = false;
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [activeOriginal]);

  /** Довгі URL — лише POST, без завеликого GET */
  useEffect(() => {
    if (!preferPostBody) return;
    let cancelled = false;
    let created: string | null = null;
    void (async () => {
      const u = await loadViaPost();
      if (!u || cancelled) return;
      created = u;
      setBlobUrl(u);
    })();
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
      setBlobUrl(null);
    };
  }, [preferPostBody, activeOriginal, loadViaPost]);

  const candidates = useMemo(() => {
    if (blobUrl) return [blobUrl, activeOriginal, EVENT_COVER_FALLBACK];
    if (preferPostBody)
      return [EVENT_COVER_FALLBACK, activeOriginal, EVENT_COVER_FALLBACK];
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
