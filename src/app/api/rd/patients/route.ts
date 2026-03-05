import { getServerUser } from "@/lib/firebase/server-auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getServerUser();
  if (!user || user.role !== "rd") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const assignments = await prisma.rdPatientAssignment.findMany({
    where: { rdId: user.uid },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      patientId: true,
      status: true,
      createdAt: true,
    },
  });

  const patientIds = assignments.map((a) => a.patientId);
  const profiles = patientIds.length > 0
    ? await prisma.profile.findMany({
        where: { userId: { in: patientIds } },
        select: { userId: true, fullName: true, email: true },
      })
    : [];

  const profileMap = Object.fromEntries(
    profiles.map((p) => [p.userId, { fullName: p.fullName, email: p.email }])
  );

  return NextResponse.json({
    assignments: assignments.map((a) => ({
      ...a,
      profiles: profileMap[a.patientId] || { fullName: null, email: null },
    })),
  });
}
