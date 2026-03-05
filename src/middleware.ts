import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const sessionCookie = request.cookies.get("__session")?.value;

  // Redirect unauthenticated users away from protected routes
  if (!sessionCookie && (pathname.startsWith("/dashboard") || pathname.startsWith("/rd"))) {
    // Allow /rd/signup without auth
    if (pathname === "/rd/signup") return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // For authenticated users, verify the session and check role.
  // We decode the JWT payload without full verification (firebase-admin can't run in Edge).
  // Full verification happens in API routes via getServerUser().
  if (sessionCookie) {
    try {
      const payloadBase64 = sessionCookie.split(".")[1];
      const payload = JSON.parse(
        Buffer.from(payloadBase64, "base64").toString("utf-8")
      );
      const role = payload.role || "patient";

      // Prevent patients from accessing /rd routes
      if (role !== "rd" && role !== "admin" && pathname.startsWith("/rd")) {
        if (pathname === "/rd/signup") return NextResponse.next();
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }

      // Redirect RDs away from patient dashboard to /rd
      if (role === "rd" && pathname.startsWith("/dashboard")) {
        const url = request.nextUrl.clone();
        url.pathname = "/rd";
        return NextResponse.redirect(url);
      }
    } catch {
      // If cookie is malformed, clear it and redirect to login
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      const response = NextResponse.redirect(url);
      response.cookies.set("__session", "", { maxAge: 0, path: "/" });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
