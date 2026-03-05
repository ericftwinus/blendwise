import { getServerUser } from "@/lib/firebase/server-auth";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Auth: accept Bearer token (from Cloud Function) or valid session cookie (from signup pages)
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.AUTH_WEBHOOK_SECRET;
  const hasBearerAuth = expectedSecret && authHeader === `Bearer ${expectedSecret}`;
  const sessionUser = !hasBearerAuth ? await getServerUser() : null;

  if (!hasBearerAuth && !sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { uid, email, displayName, role } = body;

  if (!uid || !email) {
    return NextResponse.json({ error: "uid and email are required" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    // Create user record
    await tx.user.upsert({
      where: { id: uid },
      create: { id: uid, email },
      update: { email },
    });

    // Create profile
    await tx.profile.upsert({
      where: { userId: uid },
      create: {
        userId: uid,
        fullName: displayName || null,
        email,
        role: role || "patient",
      },
      update: {
        fullName: displayName || null,
        email,
      },
    });

    // Create RD profile if role is rd
    if (role === "rd") {
      await tx.rdProfile.upsert({
        where: { userId: uid },
        create: { userId: uid },
        update: {},
      });
    }
  });

  return NextResponse.json({ success: true });
}
