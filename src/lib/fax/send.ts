import { prisma } from "@/lib/db/prisma";

const FAX_API_BASE = "https://api.documo.com/v1";

export interface FaxSendResult {
  success: boolean;
  jobId?: string;
  error?: string;
}

/**
 * Format fax number to E.164 (+1XXXXXXXXXX).
 */
export function formatFaxNumber(fax: string): string {
  const digits = fax.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

/**
 * Send a PDF via fax using the Documo API.
 */
export async function sendFax(params: {
  toNumber: string;
  pdfBuffer: Buffer;
  referralId: string;
  attemptNumber: number;
}): Promise<FaxSendResult> {
  const { toNumber, pdfBuffer, referralId, attemptNumber } = params;
  const apiKey = process.env.FAX_API_KEY;
  const fromNumber = process.env.FAX_FROM_NUMBER;
  const sandbox = process.env.FAX_SANDBOX === "true";

  if (!apiKey || !fromNumber) {
    return { success: false, error: "Fax API not configured (FAX_API_KEY / FAX_FROM_NUMBER missing)" };
  }

  const formattedTo = formatFaxNumber(toNumber);

  try {
    const formData = new FormData();
    formData.append("to", formattedTo);
    formData.append("from", fromNumber);
    formData.append("coverPage", "false");
    if (sandbox) {
      formData.append("sandbox", "true");
    }
    const blob = new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" });
    formData.append("file", blob, `referral-${referralId}.pdf`);

    const res = await fetch(`${FAX_API_BASE}/faxes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    const data = await res.json();

    // Log the attempt
    await prisma.faxLog.create({
      data: {
        referralId,
        eventType: res.ok ? "send_attempt" : "failed",
        providerJobId: data.id || data.jobId || null,
        toNumber: formattedTo,
        fromNumber,
        errorMessage: res.ok ? null : (data.message || data.error || "Unknown error"),
        attemptNumber,
      },
    });

    if (!res.ok) {
      return { success: false, error: data.message || data.error || `HTTP ${res.status}` };
    }

    return { success: true, jobId: data.id || data.jobId };
  } catch (err: any) {
    await prisma.faxLog.create({
      data: {
        referralId,
        eventType: "failed",
        toNumber: formattedTo,
        fromNumber,
        errorMessage: err.message || "Network error",
        attemptNumber,
      },
    });

    return { success: false, error: err.message || "Network error" };
  }
}
