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

  const { patient_id } = await request.json();
  if (!patient_id) {
    return NextResponse.json(
      { error: "patient_id is required" },
      { status: 400 }
    );
  }

  // Check if assignment already exists
  const { data: existing } = await supabase
    .from("rd_patient_assignments")
    .select("id, status")
    .eq("rd_id", user.id)
    .eq("patient_id", patient_id)
    .single();

  if (existing) {
    if (existing.status === "active") {
      return NextResponse.json(
        { error: "This patient is already assigned to you" },
        { status: 409 }
      );
    }
    // Re-activate a paused/discharged assignment
    const { error } = await supabase
      .from("rd_patient_assignments")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to reactivate assignment" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, reactivated: true });
  }

  // Create new assignment
  const { error } = await supabase.from("rd_patient_assignments").insert({
    rd_id: user.id,
    patient_id,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to assign patient" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
