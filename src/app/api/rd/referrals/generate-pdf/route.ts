import { getServerUser } from "@/lib/firebase/server-auth";
import { prisma } from "@/lib/db/prisma";
import { uploadFile, getSignedUrl } from "@/lib/gcs/storage";
import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";

// ─── ICD-10 Auto-Mapping ───

const TUBE_ICD10: Record<string, { code: string; label: string }> = {
  "g-tube": { code: "Z93.1", label: "Gastrostomy (G-tube) status" },
  "gastrostomy": { code: "Z93.1", label: "Gastrostomy (G-tube) status" },
  "j-tube": { code: "Z93.4", label: "Jejunostomy (J-tube) status" },
  "jejunostomy": { code: "Z93.4", label: "Jejunostomy (J-tube) status" },
  "g-tube attention": { code: "Z43.1", label: "Attention to gastrostomy" },
  "j-tube attention": { code: "Z43.4", label: "Attention to other artificial GI opening" },
};

const DIAGNOSIS_ICD10: Record<string, { code: string; label: string }> = {
  "cancer": { code: "C80.1", label: "Head/neck or esophageal cancer" },
  "head and neck cancer": { code: "C76.0", label: "Head/neck cancer" },
  "esophageal cancer": { code: "C15.9", label: "Esophageal cancer" },
  "stroke": { code: "I69.391", label: "Stroke with dysphagia" },
  "als": { code: "G12.21", label: "ALS / Amyotrophic lateral sclerosis" },
  "amyotrophic lateral sclerosis": { code: "G12.21", label: "ALS" },
  "cerebral palsy": { code: "G80.9", label: "Cerebral palsy" },
  "cp": { code: "G80.9", label: "Cerebral palsy" },
  "tbi": { code: "S06.9X9S", label: "Traumatic brain injury sequela" },
  "traumatic brain injury": { code: "S06.9X9S", label: "Traumatic brain injury sequela" },
  "gastroparesis": { code: "K31.84", label: "Gastroparesis" },
  "crohn's": { code: "K50.90", label: "Crohn's disease" },
  "crohn's disease": { code: "K50.90", label: "Crohn's disease" },
  "parkinson's": { code: "G20", label: "Parkinson's disease" },
  "muscular dystrophy": { code: "G71.0", label: "Muscular dystrophy" },
  "multiple sclerosis": { code: "G35", label: "Multiple sclerosis" },
  "dysphagia": { code: "R13.10", label: "Dysphagia, unspecified" },
};

const GI_SYMPTOM_ICD10: Record<string, { code: string; label: string }> = {
  "nausea": { code: "R11.0", label: "Nausea" },
  "vomiting": { code: "R11.2", label: "Nausea and vomiting" },
  "diarrhea": { code: "R19.7", label: "Diarrhea" },
  "constipation": { code: "K59.00", label: "Constipation" },
  "bloating": { code: "R14.0", label: "Abdominal distension / Bloating" },
  "gas": { code: "R14.0", label: "Abdominal distension / Gas" },
  "reflux": { code: "K21.9", label: "GERD / Reflux" },
  "gerd": { code: "K21.9", label: "GERD / Reflux" },
  "abdominal pain": { code: "R10.9", label: "Abdominal pain" },
  "feeding difficulties": { code: "R63.39", label: "Feeding difficulties" },
  "malabsorption": { code: "K90.49", label: "Malabsorption due to intolerance" },
  "weight loss": { code: "R63.4", label: "Abnormal weight loss" },
  "dysphagia": { code: "R13.10", label: "Dysphagia" },
};

function mapIcd10Codes(tubeType: string | null, diagnosis: string | null, giSymptoms: string[] | null) {
  const codes: string[] = [];
  const allCodes: { code: string; label: string; category: string }[] = [];

  // Tube type
  if (tubeType) {
    const key = tubeType.toLowerCase();
    const match = TUBE_ICD10[key];
    if (match && !codes.includes(match.code)) {
      codes.push(match.code);
      allCodes.push({ ...match, category: "tube" });
    }
  }

  // Primary diagnosis
  let primaryDiagnosisIcd10: string | null = null;
  if (diagnosis) {
    const key = diagnosis.toLowerCase();
    // Try exact match first, then partial
    const match = DIAGNOSIS_ICD10[key] || Object.entries(DIAGNOSIS_ICD10).find(([k]) => key.includes(k))?.[1];
    if (match) {
      primaryDiagnosisIcd10 = match.code;
      if (!codes.includes(match.code)) {
        codes.push(match.code);
        allCodes.push({ ...match, category: "diagnosis" });
      }
    }
  }

  // GI symptoms
  const supportingCodes: string[] = [];
  if (giSymptoms && giSymptoms.length > 0) {
    for (const symptom of giSymptoms) {
      const key = symptom.toLowerCase();
      const match = GI_SYMPTOM_ICD10[key] || Object.entries(GI_SYMPTOM_ICD10).find(([k]) => key.includes(k))?.[1];
      if (match && !codes.includes(match.code)) {
        codes.push(match.code);
        supportingCodes.push(match.code);
        allCodes.push({ ...match, category: "gi" });
      }
    }
  }

  return { icd10Codes: codes, primaryDiagnosisIcd10, supportingInfoCodes: supportingCodes, allCodes };
}

function checkbox(checked: boolean): string {
  return checked ? "☑" : "☐";
}

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

  // Update status to generating
  await prisma.doctorReferral.update({
    where: { id: referral_id },
    data: { referralStatus: "generating" },
  });

  try {

  // Fetch patient profile
  const patient = await prisma.profile.findUnique({
    where: { userId: referral.patientId },
    select: { fullName: true, email: true, phone: true, addressLine1: true, addressCity: true, addressState: true, addressZip: true, dateOfBirth: true, mrn: true },
  });

  // Fetch latest assessment
  const assessment = await prisma.assessment.findFirst({
    where: { userId: referral.patientId },
    orderBy: { createdAt: "desc" },
    select: { diagnosis: true, tubeType: true, currentFormula: true, dailyVolume: true, giSymptoms: true, insuranceProvider: true, feedingGoal: true },
  });

  // Fetch latest weight from symptom logs
  const latestLog = await prisma.symptomLog.findFirst({
    where: { userId: referral.patientId, weight: { not: null } },
    orderBy: { date: "desc" },
    select: { weight: true, date: true },
  });

  // Fetch RD profile
  const rdProfile = await prisma.rdProfile.findUnique({
    where: { userId: user.uid },
    select: { licenseNumber: true, licenseState: true },
  });

  // Map ICD-10 codes
  const tubeType = referral.patientTubeType || assessment?.tubeType || null;
  const diagnosis = referral.patientDiagnosis || assessment?.diagnosis || null;
  const giSymptoms = referral.giSymptoms || assessment?.giSymptoms || [];
  const { icd10Codes, primaryDiagnosisIcd10, supportingInfoCodes, allCodes } = mapIcd10Codes(tubeType, diagnosis, giSymptoms);

  // Generate MRN from patient ID if not set
  const mrn = patient?.mrn || `BW-${referral.patientId.slice(0, 8).toUpperCase()}`;

  // ─── Build PDF ───
  const doc = new PDFDocument({ size: "LETTER", margin: 50 });
  const chunks: Uint8Array[] = [];

  doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));

  const pdfReady = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const patientName = patient?.fullName || "Unknown Patient";
  const patientDob = referral.patientDob || patient?.dateOfBirth || "N/A";
  const insurance = referral.insurance || assessment?.insuranceProvider || "N/A";
  const policyNumber = referral.policyNumber || "N/A";
  const currentFormula = referral.currentFormula || assessment?.currentFormula || "N/A";
  const dailyVolume = referral.dailyVolume || assessment?.dailyVolume || "N/A";
  const rdName = user.email || "Registered Dietitian";
  const rdLicense = rdProfile?.licenseNumber ? `License #${rdProfile.licenseNumber} (${rdProfile.licenseState || "CA"})` : "";

  // Header
  doc.fontSize(14).font("Helvetica-Bold").text("PHYSICIAN REFERRAL FORM", { align: "center" });
  doc.fontSize(10).font("Helvetica").text("Nutrition Counseling for Blenderized Tube Feedings (BTF)", { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(9).text(`Date: ${today}`, { align: "right" });
  doc.moveDown(0.5);

  // Patient Information
  doc.fontSize(11).font("Helvetica-Bold").text("Patient Information");
  doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
  doc.moveDown(0.3);
  doc.fontSize(9).font("Helvetica");
  doc.text(`Name: ${patientName}        DOB: ${patientDob}`);
  doc.text(`MRN: ${mrn}        Phone: ${patient?.phone || "N/A"}`);
  if (patient?.addressLine1) {
    doc.text(`Address: ${patient.addressLine1}, ${patient.addressCity || ""} ${patient.addressState || ""} ${patient.addressZip || ""}`);
  }
  doc.text(`Insurance: ${insurance}        Policy #: ${policyNumber}`);
  doc.moveDown(0.5);

  // Referring Physician
  doc.fontSize(11).font("Helvetica-Bold").text("Referring Physician");
  doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
  doc.moveDown(0.3);
  doc.fontSize(9).font("Helvetica");
  doc.text(`Name: ${referral.doctorName}${referral.doctorCredential ? `, ${referral.doctorCredential}` : ""}        NPI: ${referral.doctorNpi || "N/A"}`);
  doc.text(`Clinic: ${referral.doctorPractice || "N/A"}        Phone: ${referral.doctorPhone || "N/A"}`);
  doc.text(`Fax: ${referral.doctorFax || "N/A"}        Email: ${referral.doctorEmail || "N/A"}`);
  if (referral.doctorAddressLine1) {
    doc.text(`Address: ${referral.doctorAddressLine1}, ${referral.doctorAddressCity || ""} ${referral.doctorAddressState || ""} ${referral.doctorAddressZip || ""}`);
  }
  doc.moveDown(0.5);

  // Reason for Referral
  doc.fontSize(11).font("Helvetica-Bold").text("Reason for Referral");
  doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
  doc.moveDown(0.3);
  doc.fontSize(9).font("Helvetica");
  doc.text(`${checkbox(true)} Transition from commercial tube feeding formula to blenderized tube feeding (BTF) due to intolerance`);
  doc.text(`${checkbox(true)} Nutrition counseling for initiation / optimization of blenderized tube feeding`);
  doc.moveDown(0.5);

  // Clinical Information
  doc.fontSize(11).font("Helvetica-Bold").text("Clinical Information");
  doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
  doc.moveDown(0.3);

  // 1. Tube Status
  doc.fontSize(9).font("Helvetica-Bold").text("1. Tube Status");
  doc.font("Helvetica");
  const tubeKey = (tubeType || "").toLowerCase();
  doc.text(`${checkbox(tubeKey.includes("g-tube") || tubeKey.includes("gastrostomy"))} Z93.1 Gastrostomy (G-tube) status`);
  doc.text(`${checkbox(tubeKey.includes("j-tube") || tubeKey.includes("jejunostomy"))} Z93.4 Jejunostomy (J-tube) status`);
  doc.text(`${checkbox(false)} Z43.1 Attention to gastrostomy`);
  doc.text(`${checkbox(false)} Z43.4 Attention to other artificial GI opening`);
  doc.moveDown(0.3);

  // 2. Primary Diagnosis
  doc.font("Helvetica-Bold").text("2. Primary Diagnosis");
  doc.font("Helvetica");
  const dx = (diagnosis || "").toLowerCase();
  doc.text(`${checkbox(dx.includes("cancer"))} Head/neck or esophageal cancer (C00-C15, C32)`);
  doc.text(`${checkbox(dx.includes("stroke"))} Stroke with dysphagia (I69.391)`);
  doc.text(`${checkbox(dx.includes("als") || dx.includes("amyotrophic"))} ALS or other neuromuscular disease (G12.21, G20)`);
  doc.text(`${checkbox(dx.includes("cerebral palsy") || dx === "cp")} Cerebral palsy (G80.9)`);
  doc.text(`${checkbox(dx.includes("tbi") || dx.includes("traumatic brain"))} Traumatic brain injury sequela (S06.9X9S)`);

  // Check if diagnosis doesn't match any known one
  const knownDx = ["cancer", "stroke", "als", "amyotrophic", "cerebral palsy", "cp", "tbi", "traumatic brain"];
  const isOtherDx = diagnosis && !knownDx.some(k => dx.includes(k));
  doc.text(`${checkbox(!!isOtherDx)} Other: ${isOtherDx ? diagnosis : ""}${primaryDiagnosisIcd10 && isOtherDx ? ` (ICD-10: ${primaryDiagnosisIcd10})` : ""}`);
  doc.moveDown(0.3);

  // 3. Supporting Information
  doc.font("Helvetica-Bold").text("3. Supporting Information");
  doc.font("Helvetica");
  const giArr = (giSymptoms || []).map((s: string) => s.toLowerCase());
  doc.text(`${checkbox(giArr.includes("dysphagia"))} R13.10 Dysphagia`);
  doc.text(`${checkbox(giArr.includes("diarrhea"))} R19.7 Diarrhea`);
  doc.text(`${checkbox(giArr.includes("constipation"))} K59.00 Constipation`);
  doc.text(`${checkbox(giArr.includes("nausea") || giArr.includes("vomiting"))} R11.2 Nausea / vomiting`);
  doc.text(`${checkbox(giArr.includes("bloating") || giArr.includes("gas"))} R14.0 Bloating / gas`);
  doc.text(`${checkbox(giArr.includes("feeding difficulties"))} R63.39 Feeding difficulties`);
  doc.text(`${checkbox(giArr.includes("reflux") || giArr.includes("gerd"))} K21.9 GERD / Reflux`);
  doc.text(`${checkbox(giArr.includes("weight loss"))} R63.4 Abnormal weight loss`);
  doc.moveDown(0.3);

  // Additional Notes
  doc.font("Helvetica-Bold").text("Additional Notes");
  doc.font("Helvetica");
  doc.text(`Current formula: ${currentFormula}        Daily volume: ${dailyVolume}`);
  if (latestLog?.weight) {
    doc.text(`Latest weight: ${latestLog.weight} lbs (${latestLog.date || "recent"})`);
  }
  doc.moveDown(0.5);

  // Physician Attestation
  doc.fontSize(11).font("Helvetica-Bold").text("Physician Attestation");
  doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
  doc.moveDown(0.3);
  doc.fontSize(8).font("Helvetica");
  doc.text(
    "I certify that the above patient has a permanent impairment (\u22653 months) preventing adequate oral intake, " +
    "the GI tract is functional for tube feeding, and blenderized tube feeding is medically necessary due to " +
    "intolerance of commercial formulas. Documentation is available upon request.",
    { width: 512 }
  );
  doc.moveDown(0.5);
  doc.fontSize(9);
  doc.text("Physician Signature: ________________________________        Date: _______________");
  doc.moveDown(0.3);
  doc.text(`Printed Name: ${referral.doctorName}        NPI: ${referral.doctorNpi || "________"}`);
  doc.moveDown(0.5);

  // HIPAA Notice
  doc.fontSize(7).font("Helvetica-Bold").text("HIPAA CONFIDENTIALITY NOTICE", { align: "center" });
  doc.font("Helvetica").text(
    "This fax transmission contains individually identifiable protected health information (PHI). " +
    "It is intended only for the use of the individual or entity named above. If you are not the intended recipient, " +
    "you are hereby notified that any review, dissemination, distribution, or copying of this communication is strictly " +
    "prohibited. If you have received this transmission in error, please immediately notify the sender by telephone and " +
    "destroy the original transmission.",
    { align: "center", width: 512 }
  );
  doc.moveDown(0.3);
  doc.fontSize(8).text(`Prepared by: ${rdName}${rdLicense ? ` | ${rdLicense}` : ""} | BlendWise Nutrition`, { align: "center" });

  doc.end();
  const pdfBuffer = await pdfReady;

  // Upload to GCS
  const storagePath = `${referral.patientId}/${referral_id}.pdf`;

  await uploadFile(storagePath, pdfBuffer, "application/pdf");

  // Update referral with PDF path, ICD-10 codes, and status
  await prisma.doctorReferral.update({
    where: { id: referral_id },
    data: {
      pdfStoragePath: storagePath,
      referralStatus: "ready",
      icd10Codes: icd10Codes,
      primaryDiagnosisIcd10: primaryDiagnosisIcd10,
      supportingInfoCodes: supportingInfoCodes,
      rdId: user.uid,
      updatedAt: new Date(),
    },
  });

  // Generate signed URL for preview (1 hour)
  const signedUrl = await getSignedUrl(storagePath, 3600);

  return NextResponse.json({
    success: true,
    pdf_url: signedUrl,
    icd10_codes: icd10Codes,
  });

  } catch (err: any) {
    console.error("[generate-pdf] Error:", err.message);
    // Always revert status on any failure
    await prisma.doctorReferral.update({
      where: { id: referral_id },
      data: { referralStatus: "pending" },
    }).catch(() => {});
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
