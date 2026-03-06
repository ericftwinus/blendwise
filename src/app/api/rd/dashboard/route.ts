import { getServerUser } from "@/lib/firebase/server-auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getServerUser();
  if (!user || user.role !== "rd") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assignments = await prisma.rdPatientAssignment.findMany({
    where: { rdId: user.uid, status: "active" },
    select: { patientId: true },
  });

  const patientIds = assignments.map((a) => a.patientId);
  const activePatients = patientIds.length;

  let pendingAssessments = 0;
  let recentLogs = 0;

  if (patientIds.length > 0) {
    pendingAssessments = await prisma.assessment.count({
      where: { userId: { in: patientIds }, status: "submitted" },
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    recentLogs = await prisma.symptomLog.count({
      where: { userId: { in: patientIds }, createdAt: { gte: weekAgo } },
    });
  }

  const rdProfileData = await prisma.profile.findUnique({
    where: { userId: user.uid },
    select: { fullName: true },
  });

  return NextResponse.json({
    rdName: rdProfileData?.fullName || user.email,
    activePatients,
    pendingAssessments,
    recentLogs,
  });
}
