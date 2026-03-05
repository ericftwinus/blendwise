import { getServerUser } from "@/lib/firebase/server-auth";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getServerUser();
  if (!user || user.role !== "rd") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const referralId = request.nextUrl.searchParams.get("referralId");
  if (!referralId) {
    return NextResponse.json({ error: "referralId is required" }, { status: 400 });
  }

  const logs = await prisma.faxLog.findMany({
    where: { referralId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ logs });
}
