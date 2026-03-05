import { getServerUser } from "@/lib/firebase/server-auth";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const user = await getServerUser();
  if (!user || user.role !== "rd") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile, rdProfile] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: user.uid } }),
    prisma.rdProfile.findUnique({ where: { userId: user.uid } }),
  ]);

  return NextResponse.json({ profile, rdProfile, email: user.email });
}

export async function PATCH(request: NextRequest) {
  const user = await getServerUser();
  if (!user || user.role !== "rd") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const [profile, rdProfile] = await Promise.all([
    prisma.profile.update({
      where: { userId: user.uid },
      data: { fullName: body.fullName, phone: body.phone },
    }),
    prisma.rdProfile.update({
      where: { userId: user.uid },
      data: {
        licenseNumber: body.licenseNumber,
        licenseState: body.licenseState,
        specializations: body.specializations || [],
        bio: body.bio,
        acceptingPatients: body.acceptingPatients,
      },
    }),
  ]);

  return NextResponse.json({ profile, rdProfile });
}
