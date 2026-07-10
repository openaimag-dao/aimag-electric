import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

/**
 * Route protection at the edge.
 * - /admin/*   → only ADMIN or MANAGER; others are sent to /login.
 * - /account/* → any signed-in user.
 * Unauthenticated users hitting either area are redirected to /login with a
 * callbackUrl so they return after signing in.
 */
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as string | undefined;

    if (pathname.startsWith("/admin")) {
      if (role !== "ADMIN" && role !== "MANAGER") {
        const url = new URL("/account", req.url);
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      // Returning true = authorized; false → redirect to signIn page.
      authorized: ({ token }) => Boolean(token),
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
