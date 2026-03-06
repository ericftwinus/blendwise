import { getServerUser } from "@/lib/firebase/server-auth";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [consents, profile, referral] = await Promise.all([
    prisma.patientConsent.findMany({ where: { userId: user.uid } }),
    prisma.profile.findUnique({ where: { userId: user.uid } }),
    prisma.doctorReferral.findFirst({ where: { patientId: user.uid } }),
  ]);

  return NextResponse.json({ consents, profile, referral });
}

export async function POST(request: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action } = body;

  if (action === "consent") {
    const consent = await prisma.patientConsent.upsert({
      where: { userId_consentType: { userId: user.uid, consentType: body.consentType } },
      create: {
        userId: user.uid,
        consentType: body.consentType,
        consented: body.consented,
        initials: body.initials,
        signedAt: body.consented ? new Date() : null,
        ipAddress: body.ipAddress,
        userAgent: body.userAgent,
      },
      update: {
        consented: body.consented,
        initials: body.initials,
        signedAt: body.consented ? new Date() : null,
      },
    });
    return NextResponse.json({ consent });
  }

  if (action === "profile") {
    const profile = await prisma.profile.update({
      where: { userId: user.uid },
      data: {
        phone: body.phone,
        addressLine1: body.addressLine1,
        addressCity: body.addressCity,
        addressState: body.addressState,
        addressZip: body.addressZip,
        dateOfBirth: body.dateOfBirth,
        onboardingCompleted: body.onboardingCompleted,
      },
    });

    // Auto-assign patient to all active RDs when onboarding completes
    if (body.onboardingCompleted) {
      const rdProfiles = await prisma.rdProfile.findMany({
        select: { userId: true },
      });
      await Promise.all(
        rdProfiles.map((rd) =>
          prisma.rdPatientAssignment.upsert({
            where: { rdId_patientId: { rdId: rd.userId, patientId: user.uid } },
            create: { rdId: rd.userId, patientId: user.uid },
            update: {},
          })
        )
      );
    }

    return NextResponse.json({ profile });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
