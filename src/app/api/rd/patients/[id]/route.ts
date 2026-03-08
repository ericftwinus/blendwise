import { getServerUser } from "@/lib/firebase/server-auth";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser();
  if (!user || user.role !== "rd") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: patientId } = await params;

  // Verify this RD is assigned to this patient
  const assignment = await prisma.rdPatientAssignment.findUnique({
    where: { rdId_patientId: { rdId: user.uid, patientId } },
  });
  if (!assignment) {
    return NextResponse.json({ error: "Patient not assigned to you" }, { status: 403 });
  }

  const [profile, assessment, targets, logs] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId: patientId },
      select: { fullName: true, email: true },
    }),
    prisma.assessment.findFirst({
      where: { userId: patientId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.nutrientTarget.findFirst({
      where: { userId: patientId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.symptomLog.findMany({
      where: { userId: patientId },
      orderBy: { date: "desc" },
      take: 30,
    }),
  ]);

  return NextResponse.json({
    profile,
    assessment,
    targets,
    logs,
    assignmentStatus: assignment.status,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser();
  if (!user || user.role !== "rd") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: patientId } = await params;
  const body = await request.json();

  if (body.action === "review") {
    const assessment = await prisma.assessment.update({
      where: { id: body.assessmentId },
      data: {
        status: body.status,
        reviewedBy: user.uid,
        reviewedAt: new Date(),
      },
    });
    return NextResponse.json({ assessment });
  }

  if (body.action === "targets") {
    const targetData = {
      caloriesMin: body.caloriesMin,
      caloriesMax: body.caloriesMax,
      proteinMin: body.proteinMin,
      proteinMax: body.proteinMax,
      carbsMin: body.carbsMin,
      carbsMax: body.carbsMax,
      fatMin: body.fatMin,
      fatMax: body.fatMax,
      fiberMin: body.fiberMin,
      fiberMax: body.fiberMax,
      fluidsMin: body.fluidsMin,
      fluidsMax: body.fluidsMax,
      feedingSchedule: body.feedingSchedule,
      safetyNotes: body.safetyNotes,
      rdNotes: body.rdNotes,
      setBy: user.uid,
    };

    if (body.targetId) {
      const targets = await prisma.nutrientTarget.update({
        where: { id: body.targetId },
        data: targetData,
      });
      return NextResponse.json({ targets });
    } else {
      const targets = await prisma.nutrientTarget.create({
        data: { userId: patientId, ...targetData },
      });
      return NextResponse.json({ targets });
    }
  }

  if (body.action === "assignment") {
    const validStatuses = ["active", "paused", "discharged"];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await prisma.rdPatientAssignment.update({
      where: { rdId_patientId: { rdId: user.uid, patientId } },
      data: { status: body.status },
    });

    return NextResponse.json({ status: body.status });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
