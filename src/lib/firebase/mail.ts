import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./client";

// Writes to the Firestore `mail` collection.
// Compatible with the "Trigger Email from Firestore" Firebase Extension.
// When the extension is installed, it picks up new docs and sends the email via SMTP.

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  const mailRef = collection(db, "mail");
  await addDoc(mailRef, {
    to,
    message: {
      subject,
      html,
      text: text || "",
    },
    createdAt: serverTimestamp(),
  });
}

export async function sendRdAssignedEmail(patientEmail: string, rdName: string) {
  await sendEmail({
    to: patientEmail,
    subject: "You've been assigned a Registered Dietitian — BlendWise",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Great news!</h2>
        <p>You've been assigned to <strong>${rdName}</strong> as your Registered Dietitian on BlendWise.</p>
        <p>Your RD will review your assessment and set personalized nutrient targets for your blenderized tube feedings.</p>
        <p>You can message your RD directly from your dashboard.</p>
        <a href="https://blendwisenutrition.com/dashboard/messages" style="display: inline-block; background: #16a34a; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; margin-top: 12px;">Open Messages</a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">BlendWise Nutrition</p>
      </div>
    `,
  });
}

export async function sendSymptomLogEmail(rdEmail: string, patientName: string) {
  await sendEmail({
    to: rdEmail,
    subject: `New symptom log from ${patientName} — BlendWise`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Symptom Log</h2>
        <p><strong>${patientName}</strong> has submitted a new symptom log entry.</p>
        <p>Log in to review their latest symptoms, weight, and intake data.</p>
        <a href="https://blendwisenutrition.com/rd/patients" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; margin-top: 12px;">View Patients</a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">BlendWise Nutrition</p>
      </div>
    `,
  });
}
