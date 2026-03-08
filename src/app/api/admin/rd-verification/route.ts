import { getServerUser } from "@/lib/firebase/server-auth";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const user = await getServerUser();
  if (!user || !user.admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rdProfiles = await prisma.rdProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          email: true,
          profile: { select: { fullName: true } },
        },
      },
    },
  });

  return NextResponse.json({
    rdProfiles: rdProfiles.map((rd) => ({
      id: rd.id,
      userId: rd.userId,
      fullName: rd.user.profile?.fullName || null,
      email: rd.user.email,
      licenseNumber: rd.licenseNumber,
      licenseState: rd.licenseState,
      verificationStatus: rd.verificationStatus,
      createdAt: rd.createdAt,
    })),
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getServerUser();
  if (!user || !user.admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rdProfileId, status } = await request.json();

  if (!rdProfileId || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const updated = await prisma.rdProfile.update({
    where: { id: rdProfileId },
    data: { verificationStatus: status },
  });

  return NextResponse.json({ rdProfile: updated });
}
