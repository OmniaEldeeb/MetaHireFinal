import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Rewrites image URLs from the Laravel backend.
 *
 * Laravel's asset() helper uses APP_URL which on local dev is
 * http://localhost:8001 — unreachable from the browser.
 * All storage URLs must go through the ngrok tunnel instead.
 *
 * NEXT_PUBLIC_API_BASE_URL = https://ngrok-domain.ngrok-free.dev/api
 * Asset base               = https://ngrok-domain.ngrok-free.dev  (strip /api)
 *
 * Also handles:
 *  - null/undefined → returns null (caller shows fallback)
 *  - Already absolute external URLs (starts with https://) → returned as-is
 *  - Relative paths (e.g. "storage/logos/abc.jpg") → prepend asset base
 */
export function imgUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Get the ngrok/production base (strip trailing /api)
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const assetBase = apiBase.replace(/\/api\/?$/, "");

  // Localhost URL from Laravel asset() → replace host with ngrok host
  if (url.startsWith("http://localhost") || url.startsWith("http://127.0.0.1")) {
    try {
      const u = new URL(url);
      url = assetBase + u.pathname;
    } catch {
      return null;
    }
  }

  // Relative path (e.g. "storage/logos/abc.jpg") → prepend asset base
  if (!url.startsWith("http")) {
    url = `${assetBase}/${url.replace(/^\//, "")}`;
  }

  // Route storage URLs through our proxy to bypass ngrok browser warning.
  // ngrok returns an HTML warning page for browser <img> requests without
  // the ngrok-skip-browser-warning header. The proxy adds it server-side.
  if (assetBase && url.startsWith(assetBase) && url.includes("/storage/")) {
    return `/api/storage?url=${encodeURIComponent(url)}`;
  }

  return url;
}