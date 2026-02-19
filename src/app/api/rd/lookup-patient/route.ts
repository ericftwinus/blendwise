import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify caller is an RD
  if (user.user_metadata?.role !== "rd" && user.user_metadata?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Search for patient by email
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("email", email.toLowerCase().trim())
    .eq("role", "patient")
    .single();

  if (error || !profile) {
    return NextResponse.json(
      { error: "No patient found with that email address" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: profile.id,
    full_name: profile.full_name || "Unknown",
    email: profile.email,
  });
}
