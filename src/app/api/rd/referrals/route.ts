import { getServerUser } from "@/lib/firebase/server-auth";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const user = await getServerUser();
  if (!user || user.role !== "rd") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const referrals = await prisma.doctorReferral.findMany({
    orderBy: { createdAt: "desc" },
  });

  const patientIds = Array.from(new Set(referrals.map((r) => r.patientId)));
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
    referrals: referrals.map((r) => ({
      ...r,
      profiles: profileMap[r.patientId] || { fullName: null, email: null },
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const data = {
    doctorName: body.doctorName || "",
    doctorFax: body.doctorFax || null,
    doctorPhone: body.doctorPhone || null,
    doctorEmail: body.doctorEmail || null,
    doctorPractice: body.doctorPractice || null,
    doctorNpi: body.doctorNpi || null,
    doctorCredential: body.doctorCredential || null,
    doctorTaxonomy: body.doctorTaxonomy || null,
    doctorAddressLine1: body.doctorAddressLine1 || null,
    doctorAddressCity: body.doctorAddressCity || null,
    doctorAddressState: body.doctorAddressState || null,
    doctorAddressZip: body.doctorAddressZip || null,
    patientDiagnosis: body.patientDiagnosis || null,
    patientDob: body.patientDob || null,
    patientTubeType: body.patientTubeType || null,
    clinicalGoal: body.clinicalGoal || null,
    currentFormula: body.currentFormula || null,
    dailyVolume: body.dailyVolume || null,
    giSymptoms: body.giSymptoms || [],
    insurance: body.insurance || null,
    referralStatus: body.referralStatus || "pending",
  };

  const referral = await prisma.doctorReferral.upsert({
    where: { patientId: user.uid },
    create: { patientId: user.uid, ...data },
    update: data,
  });

  return NextResponse.json(referral);
}

export async function PATCH(request: NextRequest) {
  const user = await getServerUser();
  if (!user || user.role !== "rd") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { referral_id, status, notes, doctorFax } = body;

  if (!referral_id) {
    return NextResponse.json({ error: "referral_id is required" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {
    rdId: user.uid,
  };

  if (status) {
    const validStatuses = ["pending", "generating", "ready", "sent", "signed", "expired", "declined", "fax_failed"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
    }
    updateData.referralStatus = status;
    if (status === "sent") updateData.referralSentAt = new Date();
    if (status === "signed") updateData.referralSignedAt = new Date();
  }

  if (notes !== undefined) updateData.notes = notes;
  if (doctorFax !== undefined) updateData.doctorFax = doctorFax || null;

  const referral = await prisma.doctorReferral.update({
    where: { id: referral_id },
    data: updateData,
  });

  return NextResponse.json(referral);
}
