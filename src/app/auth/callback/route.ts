import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // If an explicit next URL was provided, use it
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Otherwise, redirect based on role
      const { data: { user } } = await supabase.auth.getUser();
      const role = user?.user_metadata?.role || "patient";
      const destination = role === "rd" ? "/rd" : "/dashboard";
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
