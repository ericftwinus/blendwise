import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as any)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Redirect unauthenticated users away from protected routes
  if (!user && (pathname.startsWith("/dashboard") || pathname.startsWith("/rd"))) {
    // Allow /rd/signup without auth
    if (pathname === "/rd/signup") return supabaseResponse;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const role = user.user_metadata?.role || "patient";

    // Prevent patients from accessing /rd routes
    if (role !== "rd" && role !== "admin" && pathname.startsWith("/rd")) {
      // Allow anyone to view /rd/signup
      if (pathname === "/rd/signup") return supabaseResponse;
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
  }

  return supabaseResponse;
}
