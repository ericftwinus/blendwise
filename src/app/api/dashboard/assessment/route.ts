import { getServerUser } from "@/lib/firebase/server-auth";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assessment = await prisma.assessment.findFirst({
    where: { userId: user.uid },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ assessment });
}

export async function POST(request: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const assessment = await prisma.assessment.upsert({
    where: { id: body.id || "new" },
    create: { userId: user.uid, ...body },
    update: body,
  });

  return NextResponse.json({ assessment });
}
