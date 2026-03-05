import { getServerUser } from "@/lib/firebase/server-auth";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { userId: user.uid },
  });

  return NextResponse.json({ profile, email: user.email });
}

export async function PATCH(request: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const profile = await prisma.profile.update({
    where: { userId: user.uid },
    data: {
      fullName: body.fullName,
      phone: body.phone,
      addressLine1: body.addressLine1,
      addressCity: body.addressCity,
      addressState: body.addressState,
      addressZip: body.addressZip,
      dateOfBirth: body.dateOfBirth,
    },
  });

  return NextResponse.json({ profile });
}
