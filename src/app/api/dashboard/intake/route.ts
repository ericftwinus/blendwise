import { getServerUser } from "@/lib/firebase/server-auth";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const intake = await prisma.patientIntake.findUnique({
    where: { userId: user.uid },
  });

  return NextResponse.json({ intake });
}

export async function POST(request: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const intake = await prisma.patientIntake.upsert({
    where: { userId: user.uid },
    create: {
      userId: user.uid,
      sex: body.sex || null,
      heightCm: body.heightCm ? parseFloat(body.heightCm) : null,
      weightKg: body.weightKg ? parseFloat(body.weightKg) : null,
      medicalDiagnoses: body.medicalDiagnoses || null,
      currentMedications: body.currentMedications || null,
      medicationAllergies: body.medicationAllergies || null,
      foodAllergies: body.foodAllergies || null,
      surgicalHistory: body.surgicalHistory || null,
      hasRecentLabs: body.hasRecentLabs || false,
      oralIntakeDescription: body.oralIntakeDescription || null,
      tubeType: body.tubeType || null,
      tubeProfile: body.tubeProfile || null,
      extensionSetType: body.extensionSetType || null,
      frenchSize: body.frenchSize || null,
      unsureFrenchSize: body.unsureFrenchSize || false,
      lastTubeChangeDate: body.lastTubeChangeDate || null,
      currentFormula: body.currentFormula || null,
      deliveryMethods: body.deliveryMethods || null,
      waterFlushes: body.waterFlushes || null,
      oralFluidIntake: body.oralFluidIntake || null,
      hydrationNotes: body.hydrationNotes || null,
      giSymptoms: body.giSymptoms || [],
      giSymptomsOther: body.giSymptomsOther || null,
      foodPreferences: body.foodPreferences || null,
      diagnosedFoodAllergies: body.diagnosedFoodAllergies || null,
      kitchenEquipment: body.kitchenEquipment || [],
      kitchenOther: body.kitchenOther || null,
      additionalNotes: body.additionalNotes || null,
      completed: body.completed || false,
    },
    update: {
      sex: body.sex || null,
      heightCm: body.heightCm ? parseFloat(body.heightCm) : null,
      weightKg: body.weightKg ? parseFloat(body.weightKg) : null,
      medicalDiagnoses: body.medicalDiagnoses || null,
      currentMedications: body.currentMedications || null,
      medicationAllergies: body.medicationAllergies || null,
      foodAllergies: body.foodAllergies || null,
      surgicalHistory: body.surgicalHistory || null,
      hasRecentLabs: body.hasRecentLabs || false,
      oralIntakeDescription: body.oralIntakeDescription || null,
      tubeType: body.tubeType || null,
      tubeProfile: body.tubeProfile || null,
      extensionSetType: body.extensionSetType || null,
      frenchSize: body.frenchSize || null,
      unsureFrenchSize: body.unsureFrenchSize || false,
      lastTubeChangeDate: body.lastTubeChangeDate || null,
      currentFormula: body.currentFormula || null,
      deliveryMethods: body.deliveryMethods || null,
      waterFlushes: body.waterFlushes || null,
      oralFluidIntake: body.oralFluidIntake || null,
      hydrationNotes: body.hydrationNotes || null,
      giSymptoms: body.giSymptoms || [],
      giSymptomsOther: body.giSymptomsOther || null,
      foodPreferences: body.foodPreferences || null,
      diagnosedFoodAllergies: body.diagnosedFoodAllergies || null,
      kitchenEquipment: body.kitchenEquipment || [],
      kitchenOther: body.kitchenOther || null,
      additionalNotes: body.additionalNotes || null,
      completed: body.completed || false,
    },
  });

  // Auto-populate the Assessment with overlapping intake data
  if (body.completed) {
    const assessmentData: Record<string, unknown> = {
      diagnosis: body.medicalDiagnoses || null,
      tubeType: body.tubeType || null,
      currentFormula: body.currentFormula || null,
      dailyVolume: body.deliveryMethods?.totalDailyVolume || null,
      giSymptoms: body.giSymptoms || [],
      allergies: [body.foodAllergies, body.medicationAllergies].filter(Boolean).join("; ") || null,
      dietaryPreferences: [],
      hasBlender: (body.kitchenEquipment || []).some((e: string) => e.includes("blender")),
      blenderType: (body.kitchenEquipment || []).find((e: string) => e.includes("blender")) || null,
      hasFoodStorage: (body.kitchenEquipment || []).some((e: string) => e.includes("Refrigerator") || e.includes("Freezer")),
      hasKitchenScale: (body.kitchenEquipment || []).includes("Food scale"),
      additionalNotes: body.additionalNotes || null,
    };

    if (body.foodPreferences) {
      assessmentData.dietaryNotes = body.foodPreferences;
    }

    await prisma.assessment.upsert({
      where: { id: (await prisma.assessment.findFirst({ where: { userId: user.uid } }))?.id || "new" },
      create: { userId: user.uid, ...assessmentData, status: "submitted" },
      update: assessmentData,
    });
  }

  return NextResponse.json({ intake });
}
