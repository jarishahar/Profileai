import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  const sessionCookie = getSessionCookie(request);

  // Check if user is authenticated
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Redirect /admin to /admin/page (if you want a default)
  if (pathname === "/admin") {
    return NextResponse.next(); // Let the admin layout handle access control
  }

  if (pathname === "/superadmin") {
    return NextResponse.next(); // Let the superadmin layout handle access control
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/auth|api/public|api/mcp|export|sign-in|sign-up).*)",
  ],
};
