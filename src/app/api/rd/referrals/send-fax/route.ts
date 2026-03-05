import { getServerUser } from "@/lib/firebase/server-auth";
import { prisma } from "@/lib/db/prisma";
import { downloadFile } from "@/lib/gcs/storage";
import { sendFax } from "@/lib/fax/send";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const user = await getServerUser();

  if (!user || user.role !== "rd") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { referral_id } = body;

  if (!referral_id) {
    return NextResponse.json({ error: "referral_id required" }, { status: 400 });
  }

  // Fetch referral
  const referral = await prisma.doctorReferral.findUnique({
    where: { id: referral_id },
  });

  if (!referral) {
    return NextResponse.json({ error: "Referral not found" }, { status: 404 });
  }

  // Validate state
  if (referral.referralStatus !== "ready" && referral.referralStatus !== "fax_failed") {
    return NextResponse.json(
      { error: `Cannot send fax: referral status is "${referral.referralStatus}", must be "ready" or "fax_failed"` },
      { status: 400 }
    );
  }

  if (!referral.doctorFax) {
    return NextResponse.json({ error: "No fax number on file for this doctor" }, { status: 400 });
  }

  if (!referral.pdfStoragePath) {
    return NextResponse.json({ error: "PDF not yet generated" }, { status: 400 });
  }

  // Download PDF from GCS
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await downloadFile(referral.pdfStoragePath);
  } catch (err: any) {
    return NextResponse.json({ error: `Failed to download PDF: ${err.message}` }, { status: 500 });
  }

  const attemptNumber = (referral.faxAttempts || 0) + 1;

  // Send fax
  const result = await sendFax({
    toNumber: referral.doctorFax,
    pdfBuffer,
    referralId: referral_id,
    attemptNumber,
  });

  if (!result.success) {
    await prisma.doctorReferral.update({
      where: { id: referral_id },
      data: {
        referralStatus: "fax_failed",
        faxAttempts: attemptNumber,
        lastFaxAttemptAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return NextResponse.json({ error: result.error, fax_failed: true }, { status: 502 });
  }

  // Success
  await prisma.doctorReferral.update({
    where: { id: referral_id },
    data: {
      referralStatus: "sent",
      faxAttempts: attemptNumber,
      lastFaxAttemptAt: new Date(),
      faxProviderId: result.jobId || null,
      referralSentAt: new Date(),
      rdId: user.uid,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, job_id: result.jobId });
}
