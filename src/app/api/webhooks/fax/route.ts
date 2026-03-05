import { prisma } from "@/lib/db/prisma";
import { downloadFile, uploadFile } from "@/lib/gcs/storage";
import { sendFax } from "@/lib/fax/send";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const MAX_FAX_RETRIES = 3;

function verifyWebhookSignature(body: string, signature: string | null): boolean {
  const secret = process.env.FAX_WEBHOOK_SECRET;
  if (!secret) return false;
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature")
    || request.headers.get("x-documo-signature");

  // Verify HMAC signature
  if (process.env.FAX_WEBHOOK_SECRET && !verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = payload.event || payload.type || payload.eventType;
  const jobId = payload.id || payload.jobId || payload.faxId;
  const faxStatus = payload.status;

  // Map provider event to our event types
  let internalEvent: string;
  if (eventType === "fax.delivered" || faxStatus === "delivered" || faxStatus === "success") {
    internalEvent = "delivered";
  } else if (eventType === "fax.failed" || faxStatus === "failed" || faxStatus === "error") {
    internalEvent = "failed";
  } else if (eventType === "fax.received" || faxStatus === "received") {
    internalEvent = "received";
  } else {
    return NextResponse.json({ received: true, event: eventType });
  }

  // Find referral by fax_provider_id
  const referral = await prisma.doctorReferral.findFirst({
    where: { faxProviderId: jobId },
  });

  // Log the webhook event
  await prisma.faxLog.create({
    data: {
      referralId: referral?.id || null,
      eventType: internalEvent,
      providerJobId: jobId,
      toNumber: payload.to || payload.toNumber || null,
      fromNumber: payload.from || payload.fromNumber || null,
      pages: payload.pages || payload.pageCount || null,
      errorMessage: payload.errorMessage || payload.error || null,
      webhookPayload: payload,
      attemptNumber: referral?.faxAttempts || 1,
    },
  });

  if (!referral) {
    if (internalEvent === "received") {
      const senderFax = payload.from || payload.fromNumber;
      if (senderFax) {
        await handleInboundFax(senderFax, payload);
      }
    }
    return NextResponse.json({ received: true, matched: false });
  }

  // Handle each event type
  switch (internalEvent) {
    case "delivered":
      break;

    case "failed": {
      const attempts = referral.faxAttempts || 1;
      if (attempts < MAX_FAX_RETRIES && referral.pdfStoragePath && referral.doctorFax) {
        try {
          const pdfBuffer = await downloadFile(referral.pdfStoragePath);
          const retryResult = await sendFax({
            toNumber: referral.doctorFax,
            pdfBuffer,
            referralId: referral.id,
            attemptNumber: attempts + 1,
          });

          await prisma.doctorReferral.update({
            where: { id: referral.id },
            data: {
              faxAttempts: attempts + 1,
              lastFaxAttemptAt: new Date(),
              faxProviderId: retryResult.jobId || referral.faxProviderId,
              referralStatus: retryResult.success ? "sent" : "fax_failed",
              updatedAt: new Date(),
            },
          });
        } catch {
          await prisma.doctorReferral.update({
            where: { id: referral.id },
            data: { referralStatus: "fax_failed", updatedAt: new Date() },
          });
        }
      } else {
        await prisma.doctorReferral.update({
          where: { id: referral.id },
          data: { referralStatus: "fax_failed", updatedAt: new Date() },
        });
      }
      break;
    }

    case "received":
      await handleInboundFax(payload.from || payload.fromNumber, payload, referral);
      break;
  }

  return NextResponse.json({ received: true, event: internalEvent, referral_id: referral.id });
}

async function handleInboundFax(
  senderFax: string | null,
  payload: any,
  matchedReferral?: any
) {
  let referral = matchedReferral;

  if (!referral && senderFax) {
    const digits = senderFax.replace(/\D/g, "");
    const results = await prisma.doctorReferral.findMany({
      where: {
        referralStatus: "sent",
        doctorFax: { contains: digits.slice(-10) },
      },
    });
    if (results.length === 1) {
      referral = results[0];
    }
  }

  if (!referral) return;

  const documentUrl = payload.documentUrl || payload.mediaUrl || payload.fileUrl;
  if (documentUrl) {
    try {
      const res = await fetch(documentUrl);
      if (res.ok) {
        const pdfBuffer = Buffer.from(await res.arrayBuffer());
        const signedPath = `${referral.patientId}/${referral.id}_signed.pdf`;

        await uploadFile(signedPath, pdfBuffer, "application/pdf");

        await prisma.doctorReferral.update({
          where: { id: referral.id },
          data: {
            signedPdfStoragePath: signedPath,
            referralStatus: "signed",
            referralSignedAt: new Date(),
            updatedAt: new Date(),
          },
        });
        return;
      }
    } catch {
      // If download fails, still mark as signed
    }
  }

  await prisma.doctorReferral.update({
    where: { id: referral.id },
    data: {
      referralStatus: "signed",
      referralSignedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}
