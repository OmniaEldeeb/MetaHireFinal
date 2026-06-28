"use client";

/**
 * SmartImage / SmartVideo
 * =======================
 * Media that survives a flaky backend/tunnel. When a load fails (even though the
 * server may have logged a 200, the connection can stall mid-transfer), it
 * retries on a backoff schedule: 30s → 1m → 2m → 4m. After the last attempt it
 * stops and shows a "Retry" affordance; refreshing the page (which remounts the
 * component) re-arms the schedule automatically.
 *
 * Each retry appends a cache-busting query param so the browser actually
 * re-requests instead of reusing the failed response.
 */

import { useEffect, useRef, useState } from "react";
import { ImageOff, RefreshCw, VideoOff } from "lucide-react";

const BACKOFF_MS = [30_000, 60_000, 120_000, 240_000]; // 30s, 1m, 2m, 4m

function useMediaRetry(src: string) {
  const attemptRef = useRef(0);
  const [, force] = useState(0);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Reset when the source changes.
  useEffect(() => {
    attemptRef.current = 0;
    setFailed(false);
    if (timer.current) clearTimeout(timer.current);
  }, [src]);

  // Clear any pending timer on unmount.
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const onError = () => {
    const a = attemptRef.current;
    if (a >= BACKOFF_MS.length) {
      setFailed(true);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      attemptRef.current = a + 1;
      force((n) => n + 1);
    }, BACKOFF_MS[a]);
  };

  const retryNow = () => {
    if (timer.current) clearTimeout(timer.current);
    attemptRef.current = 0;
    setFailed(false);
    force((n) => n + 1);
  };

  const url =
    attemptRef.current === 0
      ? src
      : `${src}${src.includes("?") ? "&" : "?"}_r=${attemptRef.current}`;

  return { url, failed, onError, retryNow };
}

function RetryBox({
  className,
  onRetry,
  video,
}: {
  className?: string;
  onRetry: () => void;
  video?: boolean;
}) {
  return (
    <div className={`grid min-h-[140px] place-items-center gap-2 bg-elevated text-center ${className ?? ""}`}>
      {video ? <VideoOff className="h-6 w-6 text-faint" /> : <ImageOff className="h-6 w-6 text-faint" />}
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRetry(); }}
        className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
      >
        <RefreshCw className="h-3 w-3" /> Retry
      </button>
    </div>
  );
}

export function SmartImage({
  src,
  alt = "",
  className = "",
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  const { url, failed, onError, retryNow } = useMediaRetry(src);
  if (failed) return <RetryBox className={className} onRetry={retryNow} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} onError={onError} />;
}

export function SmartVideo({
  src,
  className = "",
  controls = true,
}: {
  src: string;
  className?: string;
  controls?: boolean;
}) {
  const { url, failed, onError, retryNow } = useMediaRetry(src);
  if (failed) return <RetryBox className={className} onRetry={retryNow} video />;
  return <video src={url} controls={controls} className={className} onError={onError} />;
}