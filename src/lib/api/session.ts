/**
 * Token access. Per the API docs we must NOT use localStorage.
 * Foundation: in-memory + a cookie mirror so a refresh keeps the session.
 * Stage 1 upgrades this to an httpOnly cookie set by a Next.js Route Handler.
 */
const COOKIE = "mh_token";
let memoryToken: string | null = null;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function getToken(): string | null {
  if (memoryToken) return memoryToken;
  memoryToken = readCookie(COOKIE);
  return memoryToken;
}

export function setToken(token: string) {
  memoryToken = token;
  if (typeof document !== "undefined") {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=2592000; SameSite=Lax${secure}`;
  }
}

export function clearToken() {
  memoryToken = null;
  if (typeof document !== "undefined") {
    document.cookie = `${COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}
