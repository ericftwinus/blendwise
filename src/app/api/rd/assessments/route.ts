import { getServerUser } from "@/lib/firebase/server-auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getServerUser();
  if (!user || user.role !== "rd") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const assignments = await prisma.rdPatientAssignment.findMany({
    where: { rdId: user.uid, status: "active" },
    select: { patientId: true },
  });

  if (assignments.length === 0) {
    return NextResponse.json({ assessments: [] });
  }

  const patientIds = assignments.map((a) => a.patientId);

  const [assessments, profiles] = await Promise.all([
    prisma.assessment.findMany({
      where: { userId: { in: patientIds } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        diagnosis: true,
        tubeType: true,
        feedingGoal: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.profile.findMany({
      where: { userId: { in: patientIds } },
      select: { userId: true, fullName: true, email: true },
    }),
  ]);

  const profileMap = Object.fromEntries(
    profiles.map((p) => [p.userId, { fullName: p.fullName, email: p.email }])
  );

  return NextResponse.json({
    assessments: assessments.map((a) => ({
      ...a,
      patientName: profileMap[a.userId]?.fullName || null,
      patientEmail: profileMap[a.userId]?.email || null,
    })),
  });
}
