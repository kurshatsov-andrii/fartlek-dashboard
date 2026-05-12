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
import { cn } from "@/lib/utils";

type EventCoverImageProps = {
  originalSrc: string;
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
 */
export function EventCoverImage({
  originalSrc,
  alt,
  titleHint = "Фото з Telegram-каналу @fartlekua",
  className,
  loading = "lazy",
}: EventCoverImageProps) {
  const proxiedUrl = useMemo(
    () => eventCoverImageUrl(originalSrc),
    [originalSrc],
  );
  const preferPostBody = useMemo(
    () => eventImagePreferPostBody(originalSrc),
    [originalSrc],
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
        body: JSON.stringify({ url: originalSrc }),
      });
      if (!res.ok) return null;
      const b = await res.blob();
      return URL.createObjectURL(b);
    } catch {
      return null;
    }
  }, [originalSrc]);

  useEffect(() => {
    postRecoverAttemptedRef.current = false;
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [originalSrc]);

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
  }, [preferPostBody, originalSrc, loadViaPost]);

  const candidates = useMemo(() => {
    if (blobUrl) return [blobUrl, originalSrc, EVENT_COVER_FALLBACK];
    if (preferPostBody)
      return [EVENT_COVER_FALLBACK, originalSrc, EVENT_COVER_FALLBACK];
    if (proxiedUrl !== originalSrc)
      return [proxiedUrl, originalSrc, EVENT_COVER_FALLBACK];
    return [originalSrc, EVENT_COVER_FALLBACK];
  }, [blobUrl, preferPostBody, proxiedUrl, originalSrc]);

  useEffect(() => {
    candidatesRef.current = candidates;
  }, [candidates]);

  const [index, setIndex] = useState(0);
  useEffect(() => {
    setIndex(0);
  }, [originalSrc, blobUrl]);

  const src = candidates[Math.min(index, candidates.length - 1)];

  const onError = useCallback(() => {
    void (async () => {
      if (
        proxiedUrl !== originalSrc &&
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
        if (pool.length <= 1) return i;
        return i + 1 < pool.length ? i + 1 : i;
      });
    })();
  }, [
    blobUrl,
    loadViaPost,
    preferPostBody,
    proxiedUrl,
    originalSrc,
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
