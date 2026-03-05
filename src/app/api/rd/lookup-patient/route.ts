import { getServerUser } from "@/lib/firebase/server-auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "rd" && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const profile = await prisma.profile.findFirst({
    where: { email: email.toLowerCase().trim(), role: "patient" },
    select: { userId: true, fullName: true, email: true },
  });

  if (!profile) {
    return NextResponse.json({ error: "No patient found with that email address" }, { status: 404 });
  }

  return NextResponse.json({
    id: profile.userId,
    full_name: profile.fullName || "Unknown",
    email: profile.email,
  });
}
