import { getServerUser } from "@/lib/firebase/server-auth";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const list = await prisma.groceryList.findFirst({
    where: { userId: user.uid },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ list });
}

export async function POST(request: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const list = await prisma.groceryList.upsert({
    where: { userId_weekStart: { userId: user.uid, weekStart: weekStart.toISOString().split("T")[0] } },
    create: {
      userId: user.uid,
      weekStart: weekStart.toISOString().split("T")[0],
      items: body.items,
    },
    update: { items: body.items },
  });

  return NextResponse.json({ list });
}
