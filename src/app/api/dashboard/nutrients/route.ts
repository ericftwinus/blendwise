import { getServerUser } from "@/lib/firebase/server-auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const targets = await prisma.nutrientTarget.findFirst({
    where: { userId: user.uid },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ targets });
}
