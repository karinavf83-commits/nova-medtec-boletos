import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "./lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "./lib/auth/constants";

// Lightweight edge check: is there a validly-signed, non-expired session
// token? The authoritative check (session still exists in the DB, user is
// still an admin) happens server-side in /painel's layout.
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const payload = token ? await verifySessionToken(token) : null;

  if (!payload) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/painel/:path*"],
};
