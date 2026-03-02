import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

function getSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as any);
          });
        },
      },
    }
  );
}

// PATCH — Update referral status (RD marks as ready, sent, etc.)
export async function PATCH(request: NextRequest) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "rd") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { referral_id, status, notes } = body;

  if (!referral_id || !status) {
    return NextResponse.json(
      { error: "referral_id and status are required" },
      { status: 400 }
    );
  }

  const validStatuses = ["pending", "ready", "sent", "signed", "expired", "declined"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {
    referral_status: status,
    rd_id: user.id,
    updated_at: new Date().toISOString(),
  };

  if (status === "sent") {
    updateData.referral_sent_at = new Date().toISOString();
  }
  if (status === "signed") {
    updateData.referral_signed_at = new Date().toISOString();
  }
  if (notes !== undefined) {
    updateData.notes = notes;
  }

  const { data, error } = await supabase
    .from("doctor_referrals")
    .update(updateData)
    .eq("id", referral_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
