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

  const updateData: Record<string, unknown> = {};
  if (body.fullName !== undefined) updateData.fullName = body.fullName;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.addressLine1 !== undefined) updateData.addressLine1 = body.addressLine1;
  if (body.addressCity !== undefined) updateData.addressCity = body.addressCity;
  if (body.addressState !== undefined) updateData.addressState = body.addressState;
  if (body.addressZip !== undefined) updateData.addressZip = body.addressZip;
  if (body.dateOfBirth !== undefined) updateData.dateOfBirth = body.dateOfBirth;
  if (body.notificationPreferences !== undefined) updateData.notificationPreferences = body.notificationPreferences;

  const profile = await prisma.profile.update({
    where: { userId: user.uid },
    data: updateData,
  });

  return NextResponse.json({ profile });
}
