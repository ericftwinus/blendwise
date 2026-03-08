import { getServerUser } from "@/lib/firebase/server-auth";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { notifySymptomLog } from "@/lib/firebase/server-mail";

export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const logs = await prisma.symptomLog.findMany({
    where: { userId: user.uid },
    orderBy: { date: "desc" },
    take: 20,
  });

  return NextResponse.json({ logs });
}

export async function POST(request: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const log = await prisma.symptomLog.create({
    data: {
      userId: user.uid,
      date: body.date,
      weight: body.weight ? parseFloat(body.weight) : null,
      symptoms: body.symptoms || [],
      severity: body.severity || 1,
      intakeCompleted: body.intakeCompleted ?? true,
      notes: body.notes || null,
    },
  });

  // Fire-and-forget: notify assigned RDs
  prisma.rdPatientAssignment
    .findMany({
      where: { patientId: user.uid, status: "active" },
      select: {
        rd: {
          select: {
            email: true,
            profile: { select: { notificationPreferences: true } },
          },
        },
      },
    })
    .then(async (assignments) => {
      const patientProfile = await prisma.profile.findUnique({
        where: { userId: user.uid },
        select: { fullName: true },
      });
      const patientName = patientProfile?.fullName || "A patient";
      for (const a of assignments) {
        notifySymptomLog(a.rd.email, patientName);
      }
    })
    .catch(() => {});

  return NextResponse.json({ log });
}
