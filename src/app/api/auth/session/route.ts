import { adminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// POST — Create session cookie from Firebase ID token
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "idToken required" }, { status: 400 });
    }

    // Verify the ID token
    const decoded = await adminAuth.verifyIdToken(idToken);

    // Create session cookie (14 days)
    const expiresIn = 60 * 60 * 24 * 14 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Set the cookie
    const cookieStore = cookies();
    cookieStore.set("__session", sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.json({ uid: decoded.uid });
  } catch (err: any) {
    console.error("[session POST] Error:", err.message);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

// DELETE — Clear session cookie
export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.set("__session", "", {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.json({ success: true });
}
