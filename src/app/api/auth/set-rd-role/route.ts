import { adminAuth } from "@/lib/firebase/admin";
import { NextRequest, NextResponse } from "next/server";

// POST — Set role: "rd" custom claim on user
export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: "uid required" }, { status: 400 });
    }

    // Set custom claims
    await adminAuth.setCustomUserClaims(uid, { role: "rd" });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[set-rd-role] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
