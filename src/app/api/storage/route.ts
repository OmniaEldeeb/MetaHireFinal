/**
 * Image proxy — bypasses the ngrok browser warning page.
 *
 * ngrok shows a warning HTML page for any browser request that doesn't
 * include the `ngrok-skip-browser-warning` header. <img> tags can't send
 * custom headers, so we proxy all storage images through this Next.js route
 * which adds the header server-side.
 *
 * Usage: /api/storage?url=https://xxx.ngrok-free.dev/storage/avatars/...
 */
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url param", { status: 400 });
  }

  // Only proxy requests to our own ngrok/backend domain
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const assetBase = apiBase.replace(/\/api\/?$/, "");

  if (!url.startsWith(assetBase) && assetBase) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        // This bypasses ngrok's browser warning page
        "ngrok-skip-browser-warning": "true",
        "User-Agent": "MetaHire-App/1.0",
      },
      // Don't follow to HTML warning page
      redirect: "follow",
    });

    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    
    // Only proxy actual images/videos, not HTML warning pages
    if (contentType.includes("text/html")) {
      return new NextResponse("Not an image", { status: 502 });
    }

    const blob = await res.blob();
    
    return new NextResponse(blob, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse("Fetch failed", { status: 502 });
  }
}