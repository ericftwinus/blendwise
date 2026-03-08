import { adminDb } from "./admin";
import { FieldValue } from "firebase-admin/firestore";

// Server-side email utility using Firebase Admin SDK.
// Writes to the `mail` collection — compatible with the
// "Trigger Email from Firestore" Firebase Extension.

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function queueEmail({ to, subject, html }: EmailOptions) {
  try {
    await adminDb.collection("mail").add({
      to,
      message: { subject, html },
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to queue email:", err);
  }
}

export async function notifyRdAssigned(patientEmail: string, rdName: string) {
  await queueEmail({
    to: patientEmail,
    subject: "You've been assigned a Registered Dietitian — BlendWise",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Great news!</h2>
        <p>You've been assigned to <strong>${escapeHtml(rdName)}</strong> as your Registered Dietitian on BlendWise.</p>
        <p>Your RD will review your assessment and set personalized nutrient targets.</p>
        <a href="https://blendwisenutrition.com/dashboard/messages"
           style="display: inline-block; background: #16a34a; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; margin-top: 12px;">
          Open Messages
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">BlendWise Nutrition</p>
      </div>`,
  });
}

export async function notifySymptomLog(rdEmail: string, patientName: string) {
  await queueEmail({
    to: rdEmail,
    subject: `New symptom log from ${patientName} — BlendWise`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Symptom Log</h2>
        <p><strong>${escapeHtml(patientName)}</strong> has submitted a new symptom log entry.</p>
        <p>Log in to review their latest symptoms, weight, and intake data.</p>
        <a href="https://blendwisenutrition.com/rd/patients"
           style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; margin-top: 12px;">
          View Patients
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">BlendWise Nutrition</p>
      </div>`,
  });
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
