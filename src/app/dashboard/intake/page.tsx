"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  Save,
  CheckCircle2,
  User,
  Stethoscope,
  Utensils,
  Droplets,
  HeartPulse,
  Apple,
  ChefHat,
  FileText,
} from "lucide-react";

const GI_SYMPTOMS = [
  "Nausea", "Vomiting", "Diarrhea", "Constipation", "Bloating",
  "Gas", "Reflux", "Early satiety", "Abdominal pain", "Tube clogging issues",
];

const KITCHEN_EQUIPMENT = [
  "High-powered blender (e.g., Vitamix, Blendtec)",
  "Standard blender",
  "Food scale",
  "Measuring cups/spoons",
  "Refrigerator space for storing blends",
  "Freezer space for storing blends",
  "Ability to batch-prep blends",
  "Ability to safely store food",
  "Reliable electricity",
  "Clean water source",
  "Caregiver support available",
];

const TUBE_TYPES = [
  "G-tube (Gastric)",
  "GJ-tube (Gastrojejunal)",
  "J-tube (Jejunal)",
  "Naso-gastric (NG) tube",
  "Other / Not sure",
];

interface DeliveryMethods {
  bolus: boolean;
  bolusFeeds: string;
  bolusVolume: string;
  gravity: boolean;
  gravityFreq: string;
  gravityVolume: string;
  pump: boolean;
  pumpRate: string;
  pumpHours: string;
  totalDailyVolume: string;
}

export default function IntakePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Section 1: Patient Info
  const [sex, setSex] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  // Section 2: Medical Background
  const [medicalDiagnoses, setMedicalDiagnoses] = useState("");
  const [currentMedications, setCurrentMedications] = useState("");
  const [medicationAllergies, setMedicationAllergies] = useState("");
  const [foodAllergies, setFoodAllergies] = useState("");
  const [surgicalHistory, setSurgicalHistory] = useState("");
  const [hasRecentLabs, setHasRecentLabs] = useState(false);

  // Section 3: Nutrition & Tube
  const [oralIntakeDescription, setOralIntakeDescription] = useState("");
  const [tubeType, setTubeType] = useState("");
  const [tubeProfile, setTubeProfile] = useState("");
  const [extensionSetType, setExtensionSetType] = useState("");
  const [frenchSize, setFrenchSize] = useState("");
  const [unsureFrenchSize, setUnsureFrenchSize] = useState(false);
  const [lastTubeChangeDate, setLastTubeChangeDate] = useState("");
  const [currentFormula, setCurrentFormula] = useState("");
  const [delivery, setDelivery] = useState<DeliveryMethods>({
    bolus: false, bolusFeeds: "", bolusVolume: "",
    gravity: false, gravityFreq: "", gravityVolume: "",
    pump: false, pumpRate: "", pumpHours: "",
    totalDailyVolume: "",
  });

  // Section 4: Hydration
  const [waterFlushes, setWaterFlushes] = useState("");
  const [oralFluidIntake, setOralFluidIntake] = useState("");
  const [hydrationNotes, setHydrationNotes] = useState("");

  // Section 5: GI Symptoms
  const [giSymptoms, setGiSymptoms] = useState<string[]>([]);
  const [giSymptomsOther, setGiSymptomsOther] = useState("");

  // Section 6: Food Preferences
  const [foodPreferences, setFoodPreferences] = useState("");
  const [diagnosedFoodAllergies, setDiagnosedFoodAllergies] = useState("");

  // Section 7: Kitchen Setup
  const [kitchenEquipment, setKitchenEquipment] = useState<string[]>([]);
  const [kitchenOther, setKitchenOther] = useState("");

  // Section 8: Additional Notes
  const [additionalNotes, setAdditionalNotes] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/dashboard/intake");
      if (!res.ok) { setLoading(false); return; }
      const { intake } = await res.json();
      if (intake) {
        if (intake.completed) { setCompleted(true); }
        setSex(intake.sex || "");
        setHeightCm(intake.heightCm?.toString() || "");
        setWeightKg(intake.weightKg?.toString() || "");
        setMedicalDiagnoses(intake.medicalDiagnoses || "");
        setCurrentMedications(intake.currentMedications || "");
        setMedicationAllergies(intake.medicationAllergies || "");
        setFoodAllergies(intake.foodAllergies || "");
        setSurgicalHistory(intake.surgicalHistory || "");
        setHasRecentLabs(intake.hasRecentLabs || false);
        setOralIntakeDescription(intake.oralIntakeDescription || "");
        setTubeType(intake.tubeType || "");
        setTubeProfile(intake.tubeProfile || "");
        setExtensionSetType(intake.extensionSetType || "");
        setFrenchSize(intake.frenchSize || "");
        setUnsureFrenchSize(intake.unsureFrenchSize || false);
        setLastTubeChangeDate(intake.lastTubeChangeDate || "");
        setCurrentFormula(intake.currentFormula || "");
        if (intake.deliveryMethods) setDelivery(intake.deliveryMethods);
        setWaterFlushes(intake.waterFlushes || "");
        setOralFluidIntake(intake.oralFluidIntake || "");
        setHydrationNotes(intake.hydrationNotes || "");
        setGiSymptoms(intake.giSymptoms || []);
        setGiSymptomsOther(intake.giSymptomsOther || "");
        setFoodPreferences(intake.foodPreferences || "");
        setDiagnosedFoodAllergies(intake.diagnosedFoodAllergies || "");
        setKitchenEquipment(intake.kitchenEquipment || []);
        setKitchenOther(intake.kitchenOther || "");
        setAdditionalNotes(intake.additionalNotes || "");
      }
      setLoading(false);
    }
    load();
  }, []);

  function toggleSymptom(s: string) {
    setGiSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  function toggleEquipment(e: string) {
    setKitchenEquipment((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]);
  }

  async function handleSubmit() {
    setSaving(true);
    await fetch("/api/dashboard/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sex, heightCm, weightKg,
        medicalDiagnoses, currentMedications, medicationAllergies, foodAllergies,
        surgicalHistory, hasRecentLabs,
        oralIntakeDescription, tubeType, tubeProfile, extensionSetType,
        frenchSize, unsureFrenchSize, lastTubeChangeDate, currentFormula,
        deliveryMethods: delivery,
        waterFlushes, oralFluidIntake, hydrationNotes,
        giSymptoms, giSymptomsOther,
        foodPreferences, diagnosedFoodAllergies,
        kitchenEquipment, kitchenOther,
        additionalNotes,
        completed: true,
      }),
    });
    setSaving(false);
    setCompleted(true);
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm";

  const steps = [
    {
      title: "Patient Information",
      icon: User,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Basic information to help your RD personalize your care.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
            <div className="flex gap-3">
              {["Male", "Female", "Prefer not to say"].map((opt) => (
                <button key={opt} type="button" onClick={() => setSex(opt)}
                  className={`text-sm px-4 py-2 rounded-lg border transition ${sex === opt ? "bg-brand-50 border-brand-300 text-brand-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                >{opt}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
              <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className={inputClass} placeholder="e.g., 170" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className={inputClass} placeholder="e.g., 65" />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Medical Background",
      icon: Stethoscope,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medical Diagnoses</label>
            <textarea value={medicalDiagnoses} onChange={(e) => setMedicalDiagnoses(e.target.value)} className={inputClass} rows={2} placeholder="List all current medical diagnoses..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Medications</label>
            <textarea value={currentMedications} onChange={(e) => setCurrentMedications(e.target.value)} className={inputClass} rows={2} placeholder="List all current medications and dosages..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allergies (Medication or Food)</label>
            <textarea value={medicationAllergies} onChange={(e) => setMedicationAllergies(e.target.value)} className={inputClass} rows={2} placeholder="List any medication or food allergies..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Surgical History</label>
            <textarea value={surgicalHistory} onChange={(e) => setSurgicalHistory(e.target.value)} className={inputClass} rows={2} placeholder="List any prior surgeries..." />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={hasRecentLabs} onChange={(e) => setHasRecentLabs(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
            <span className="text-sm text-gray-700">I have attached/uploaded my recent lab results</span>
          </label>
        </div>
      ),
    },
    {
      title: "Nutrition & Tube Status",
      icon: Utensils,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Eating Pattern (Oral Intake)</label>
            <textarea value={oralIntakeDescription} onChange={(e) => setOralIntakeDescription(e.target.value)} className={inputClass} rows={2}
              placeholder="Describe what you typically eat and drink in a day..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tube Type</label>
            <select value={tubeType} onChange={(e) => setTubeType(e.target.value)} className={inputClass}>
              <option value="">Select tube type</option>
              {TUBE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tube Profile</label>
              <select value={tubeProfile} onChange={(e) => setTubeProfile(e.target.value)} className={inputClass}>
                <option value="">Select profile</option>
                <option value="Low-profile (button)">Low-profile (button)</option>
                <option value="Standard / Long Tube">Standard / Long Tube</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Extension Set Type</label>
              <select value={extensionSetType} onChange={(e) => setExtensionSetType(e.target.value)} className={inputClass}>
                <option value="">Select type</option>
                <option value="Right-angle">Right-angle extension set</option>
                <option value="Straight">Straight extension set</option>
                <option value="Not sure">Not sure</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">French Size (Fr)</label>
              <input type="text" value={frenchSize} onChange={(e) => setFrenchSize(e.target.value)} className={inputClass} placeholder='e.g., 14 Fr' />
              <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                <input type="checkbox" checked={unsureFrenchSize} onChange={(e) => setUnsureFrenchSize(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-600" />
                <span className="text-xs text-gray-500">I&apos;m unsure</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Tube Change</label>
              <input type="date" value={lastTubeChangeDate} onChange={(e) => setLastTubeChangeDate(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Formula or Blend</label>
            <input type="text" value={currentFormula} onChange={(e) => setCurrentFormula(e.target.value)} className={inputClass}
              placeholder="e.g., Jevity 1.5, Kate Farms, homemade blend..." />
          </div>
        </div>
      ),
    },
    {
      title: "Delivery Method & Hydration",
      icon: Droplets,
      content: (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Delivery Method (select all that apply)</label>
            <div className="space-y-4">
              {/* Bolus */}
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer mb-2">
                  <input type="checkbox" checked={delivery.bolus} onChange={(e) => setDelivery((p) => ({ ...p, bolus: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-brand-600" />
                  <span className="text-sm font-medium text-gray-700">Bolus / Syringe</span>
                </label>
                {delivery.bolus && (
                  <div className="grid grid-cols-2 gap-3 ml-8">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Feeds per day</label>
                      <input type="number" value={delivery.bolusFeeds} onChange={(e) => setDelivery((p) => ({ ...p, bolusFeeds: e.target.value }))} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Volume per feed (mL)</label>
                      <input type="number" value={delivery.bolusVolume} onChange={(e) => setDelivery((p) => ({ ...p, bolusVolume: e.target.value }))} className={inputClass} />
                    </div>
                  </div>
                )}
              </div>
              {/* Gravity */}
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer mb-2">
                  <input type="checkbox" checked={delivery.gravity} onChange={(e) => setDelivery((p) => ({ ...p, gravity: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-brand-600" />
                  <span className="text-sm font-medium text-gray-700">Gravity</span>
                </label>
                {delivery.gravity && (
                  <div className="grid grid-cols-2 gap-3 ml-8">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Frequency per day</label>
                      <input type="number" value={delivery.gravityFreq} onChange={(e) => setDelivery((p) => ({ ...p, gravityFreq: e.target.value }))} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Volume per feed (mL)</label>
                      <input type="number" value={delivery.gravityVolume} onChange={(e) => setDelivery((p) => ({ ...p, gravityVolume: e.target.value }))} className={inputClass} />
                    </div>
                  </div>
                )}
              </div>
              {/* Pump */}
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer mb-2">
                  <input type="checkbox" checked={delivery.pump} onChange={(e) => setDelivery((p) => ({ ...p, pump: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-brand-600" />
                  <span className="text-sm font-medium text-gray-700">Pump</span>
                </label>
                {delivery.pump && (
                  <div className="grid grid-cols-2 gap-3 ml-8">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Rate (mL/hr)</label>
                      <input type="number" value={delivery.pumpRate} onChange={(e) => setDelivery((p) => ({ ...p, pumpRate: e.target.value }))} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Hours per day</label>
                      <input type="number" value={delivery.pumpHours} onChange={(e) => setDelivery((p) => ({ ...p, pumpHours: e.target.value }))} className={inputClass} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Daily Volume Goal (mL)</label>
            <input type="number" value={delivery.totalDailyVolume} onChange={(e) => setDelivery((p) => ({ ...p, totalDailyVolume: e.target.value }))} className={inputClass} placeholder="e.g., 1500" />
          </div>
          <hr className="border-gray-200" />
          <h3 className="text-sm font-semibold text-gray-900">Hydration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Water flushes through tube (mL/day)</label>
              <input type="text" value={waterFlushes} onChange={(e) => setWaterFlushes(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Oral fluid intake</label>
              <input type="text" value={oralFluidIntake} onChange={(e) => setOralFluidIntake(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Other hydration notes</label>
            <input type="text" value={hydrationNotes} onChange={(e) => setHydrationNotes(e.target.value)} className={inputClass} />
          </div>
        </div>
      ),
    },
    {
      title: "GI Symptoms",
      icon: HeartPulse,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Check any symptoms you currently experience:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {GI_SYMPTOMS.map((s) => (
              <button key={s} type="button" onClick={() => toggleSymptom(s)}
                className={`text-sm px-3 py-2 rounded-lg border transition text-left ${giSymptoms.includes(s) ? "bg-brand-50 border-brand-300 text-brand-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
              >{s}</button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Other symptoms</label>
            <input type="text" value={giSymptomsOther} onChange={(e) => setGiSymptomsOther(e.target.value)} className={inputClass} placeholder="Describe any other symptoms..." />
          </div>
        </div>
      ),
    },
    {
      title: "Food Preferences & Allergies",
      icon: Apple,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Foods you prefer or wish to avoid</label>
            <textarea value={foodPreferences} onChange={(e) => setFoodPreferences(e.target.value)} className={inputClass} rows={3}
              placeholder="List foods you enjoy, dislike, or want to avoid..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosed Food Allergies</label>
            <textarea value={diagnosedFoodAllergies} onChange={(e) => setDiagnosedFoodAllergies(e.target.value)} className={inputClass} rows={3}
              placeholder="List any diagnosed food allergies (e.g., peanuts, shellfish, dairy, eggs)..." />
          </div>
        </div>
      ),
    },
    {
      title: "Kitchen Setup & Equipment",
      icon: ChefHat,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">This helps your RD design a blend plan that fits your home setup.</p>
          <div className="space-y-2">
            {KITCHEN_EQUIPMENT.map((item) => (
              <label key={item} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={kitchenEquipment.includes(item)} onChange={() => toggleEquipment(item)}
                  className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                <span className="text-sm text-gray-700">{item}</span>
              </label>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Other equipment</label>
            <input type="text" value={kitchenOther} onChange={(e) => setKitchenOther(e.target.value)} className={inputClass} placeholder="Any other equipment you have..." />
          </div>
        </div>
      ),
    },
    {
      title: "Additional Notes",
      icon: FileText,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Is there anything else you&apos;d like your RD to know?</label>
            <textarea value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} className={inputClass} rows={5}
              placeholder="Share any concerns, goals, lifestyle factors, or questions for your dietitian..." />
          </div>
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className="text-center py-16 text-gray-400">Loading intake form...</div>;
  }

  if (completed) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-brand-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Intake Form Submitted</h2>
        <p className="text-gray-600 mb-6">
          Thank you for completing your intake form. Your information has been shared with your Registered Dietitian to prepare your personalized assessment and nutrition plan.
        </p>
        <button onClick={() => router.push("/dashboard")}
          className="bg-brand-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 transition">
          Go to Dashboard
        </button>
      </div>
    );
  }

  const StepIcon = steps[step].icon;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-brand-600" />
          Patient Intake Form
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Please complete this form prior to your assessment. This information helps your RD safely design a custom tube feeding and blend plan.
        </p>
      </div>

      <div className="flex items-center gap-1 mb-6">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition ${i <= step ? "bg-brand-600" : "bg-gray-200"}`} />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <StepIcon className="w-5 h-5 text-brand-600" />
          {steps[step].title}
        </h2>
        <div className="text-sm text-gray-500 mb-5">Step {step + 1} of {steps.length}</div>
        {steps[step].content}

        <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-100">
          <button onClick={() => setStep((s) => s - 1)} disabled={step === 0}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 transition">
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          {step < steps.length - 1 ? (
            <button onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-1 bg-brand-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 transition">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className="flex items-center gap-1 bg-brand-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition">
              <Save className="w-4 h-4" />
              {saving ? "Submitting..." : "Submit Intake Form"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
