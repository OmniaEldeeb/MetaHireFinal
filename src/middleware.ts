import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = [
  "/dashboard",
  "/settings",
  "/profile",
  "/applications",
  "/cv",
  "/interviews",
  "/network",
  "/messages",
  "/notifications",
  "/company",
  "/users",
  "/companies",
  "/invitations",
  "/saved-jobs",
  "/feed",
  "/search",
  "/support",
];

const AUTH_ONLY = ["/login", "/register", "/forgot-password"];
const COOKIE = "mh_token";

export function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  const { pathname } = req.nextUrl;

  // /users and /companies under (public) are read-only public views — skip
  // protection for those. The (app) versions live at the same paths but are
  // inside the AuthGuard client-side.
  if (
    !token &&
    PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"))
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (
    token &&
    AUTH_ONLY.some((p) => pathname === p || pathname.startsWith(p + "/"))
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/profile/:path*",
    "/applications/:path*",
    "/cv/:path*",
    "/interviews/:path*",
    "/network/:path*",
    "/messages/:path*",
    "/notifications/:path*",
    "/company/:path*",
    "/users/:path*",
    "/companies/:path*",
    "/invitations/:path*",
    "/login",
    "/register/:path*",
    "/forgot-password",
  ],
};
