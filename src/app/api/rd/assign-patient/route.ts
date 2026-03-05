import { getServerUser } from "@/lib/firebase/server-auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "rd" && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { patient_id } = await request.json();
  if (!patient_id) return NextResponse.json({ error: "patient_id is required" }, { status: 400 });

  const existing = await prisma.rdPatientAssignment.findUnique({
    where: { rdId_patientId: { rdId: user.uid, patientId: patient_id } },
  });

  if (existing) {
    if (existing.status === "active") {
      return NextResponse.json({ error: "This patient is already assigned to you" }, { status: 409 });
    }
    await prisma.rdPatientAssignment.update({
      where: { id: existing.id },
      data: { status: "active" },
    });
    return NextResponse.json({ success: true, reactivated: true });
  }

  await prisma.rdPatientAssignment.create({
    data: { rdId: user.uid, patientId: patient_id },
  });

  return NextResponse.json({ success: true });
}
