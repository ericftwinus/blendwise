import { getServerUser } from "@/lib/firebase/server-auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile, assessment, targets, grocery, logs, rdAssignment] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: user.uid }, select: { fullName: true, subscriptionTier: true, onboardingCompleted: true } }),
    prisma.assessment.findFirst({ where: { userId: user.uid }, select: { id: true } }),
    prisma.nutrientTarget.findFirst({ where: { userId: user.uid }, select: { id: true } }),
    prisma.groceryList.findFirst({ where: { userId: user.uid }, select: { id: true } }),
    prisma.symptomLog.findMany({ where: { userId: user.uid }, orderBy: { date: "desc" }, take: 30, select: { date: true, weight: true } }),
    prisma.rdPatientAssignment.findFirst({
      where: { patientId: user.uid, status: "active" },
      select: {
        rd: {
          select: {
            id: true,
            email: true,
            profile: { select: { fullName: true, phone: true } },
            rdProfile: { select: { specializations: true, bio: true } },
          },
        },
      },
    }),
  ]);

  // Calculate streak
  let streak = 0;
  if (logs.length > 0) {
    const today = new Date();
    for (let i = 0; i < logs.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      if (logs[i].date === expected.toISOString().split("T")[0]) {
        streak++;
      } else break;
    }
  }

  const assignedRd = rdAssignment
    ? {
        id: rdAssignment.rd.id,
        name: rdAssignment.rd.profile?.fullName || null,
        email: rdAssignment.rd.email,
        phone: rdAssignment.rd.profile?.phone || null,
        specializations: rdAssignment.rd.rdProfile?.specializations || [],
        bio: rdAssignment.rd.rdProfile?.bio || null,
      }
    : null;

  return NextResponse.json({
    userName: profile?.fullName || "",
    onboardingCompleted: profile?.onboardingCompleted ?? false,
    hasAssessment: !!assessment,
    hasNutrientTargets: !!targets,
    hasGroceryList: !!grocery,
    lastWeight: logs[0]?.weight ? `${logs[0].weight} lbs` : null,
    logStreak: streak,
    tier: profile?.subscriptionTier ?? 1,
    assignedRd,
  });
}
