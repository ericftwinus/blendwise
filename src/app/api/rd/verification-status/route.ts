import { getServerUser } from "@/lib/firebase/server-auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getServerUser();
  if (!user || user.role !== "rd") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rdProfile = await prisma.rdProfile.findUnique({
    where: { userId: user.uid },
    select: { verificationStatus: true },
  });

  return NextResponse.json({
    verificationStatus: rdProfile?.verificationStatus || "pending_verification",
  });
}
