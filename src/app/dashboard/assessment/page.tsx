"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  Save,
  AlertCircle,
} from "lucide-react";

const feedingTypes = [
  "G-tube (Gastrostomy)",
  "GJ-tube (Gastrojejunostomy)",
  "J-tube (Jejunostomy)",
  "NG-tube (Nasogastric)",
  "NJ-tube (Nasojejunal)",
  "Other",
];

const giSymptoms = [
  "Nausea",
  "Vomiting",
  "Diarrhea",
  "Constipation",
  "Bloating",
  "Abdominal pain",
  "Reflux/GERD",
  "Gas",
  "Dumping syndrome",
  "None",
];

const dietaryPreferences = [
  "No restrictions",
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Dairy-free",
  "Low-sodium",
  "Kosher",
  "Halal",
  "Other",
];

export default function AssessmentPage() {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    // Medical History
    diagnosis: "",
    tubeType: "",
    tubePlacementDate: "",
    currentFormula: "",
    feedingSchedule: "",
    dailyVolume: "",
    // GI Symptoms
    giSymptoms: [] as string[],
    giNotes: "",
    // Allergies
    allergies: "",
    intolerances: "",
    // Dietary Preferences
    dietaryPreferences: [] as string[],
    dietaryNotes: "",
    // Equipment
    hasBlender: false,
    blenderType: "",
    hasFoodStorage: false,
    hasKitchenScale: false,
    // Goals
    feedingGoal: "",
    additionalNotes: "",
    // Payment
    paymentMethod: "",
    insuranceProvider: "",
  });

  function updateField(field: string, value: string | boolean | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleSymptom(symptom: string) {
    setForm((prev) => ({
      ...prev,
      giSymptoms: prev.giSymptoms.includes(symptom)
        ? prev.giSymptoms.filter((s) => s !== symptom)
        : [...prev.giSymptoms, symptom],
    }));
  }

  function togglePref(pref: string) {
    setForm((prev) => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.includes(pref)
        ? prev.dietaryPreferences.filter((p) => p !== pref)
        : [...prev.dietaryPreferences, pref],
    }));
  }

  async function handleSubmit() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("assessments").upsert({
        user_id: user.id,
        ...form,
        gi_symptoms: form.giSymptoms,
        dietary_preferences: form.dietaryPreferences,
        updated_at: new Date().toISOString(),
      });
    }

    setSaving(false);
    setSaved(true);
  }

  const steps = [
    {
      title: "Medical History",
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Diagnosis</label>
            <input type="text" value={form.diagnosis} onChange={(e) => updateField("diagnosis", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="e.g., Head and neck cancer, cerebral palsy, stroke..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Feeding Tube Type</label>
            <select value={form.tubeType} onChange={(e) => updateField("tubeType", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            >
              <option value="">Select tube type</option>
              {feedingTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tube Placement Date (approximate)</label>
            <input type="date" value={form.tubePlacementDate} onChange={(e) => updateField("tubePlacementDate", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Formula (if applicable)</label>
            <input type="text" value={form.currentFormula} onChange={(e) => updateField("currentFormula", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="e.g., Jevity 1.5, Osmolite, Kate Farms..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Feeding Schedule</label>
              <input type="text" value={form.feedingSchedule} onChange={(e) => updateField("feedingSchedule", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="e.g., Bolus 4x/day, continuous overnight..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Volume (mL)</label>
              <input type="text" value={form.dailyVolume} onChange={(e) => updateField("dailyVolume", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="e.g., 1500 mL"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "GI Symptoms",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Select all current GI symptoms you experience:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {giSymptoms.map((symptom) => (
              <button
                key={symptom}
                type="button"
                onClick={() => toggleSymptom(symptom)}
                className={`text-sm px-3 py-2 rounded-lg border transition text-left ${
                  form.giSymptoms.includes(symptom)
                    ? "bg-brand-50 border-brand-300 text-brand-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {symptom}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea value={form.giNotes} onChange={(e) => updateField("giNotes", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              rows={3}
              placeholder="Describe the frequency and severity of your symptoms..."
            />
          </div>
        </div>
      ),
    },
    {
      title: "Allergies & Intolerances",
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Food Allergies</label>
            <textarea value={form.allergies} onChange={(e) => updateField("allergies", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              rows={3}
              placeholder="List any food allergies (e.g., peanuts, tree nuts, shellfish, eggs...)&#10;Type 'None' if no allergies."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Food Intolerances</label>
            <textarea value={form.intolerances} onChange={(e) => updateField("intolerances", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              rows={3}
              placeholder="List any food intolerances (e.g., lactose, fructose, high-FODMAP foods...)&#10;Type 'None' if no intolerances."
            />
          </div>
        </div>
      ),
    },
    {
      title: "Dietary Preferences",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Select all that apply:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {dietaryPreferences.map((pref) => (
              <button
                key={pref}
                type="button"
                onClick={() => togglePref(pref)}
                className={`text-sm px-3 py-2 rounded-lg border transition text-left ${
                  form.dietaryPreferences.includes(pref)
                    ? "bg-brand-50 border-brand-300 text-brand-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {pref}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea value={form.dietaryNotes} onChange={(e) => updateField("dietaryNotes", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              rows={2}
              placeholder="Any other dietary preferences or cultural food considerations..."
            />
          </div>
        </div>
      ),
    },
    {
      title: "Equipment & Setup",
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.hasBlender} onChange={(e) => updateField("hasBlender", e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-700">I have a high-powered blender</span>
            </label>
            {form.hasBlender && (
              <input type="text" value={form.blenderType} onChange={(e) => updateField("blenderType", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="Blender type (e.g., Vitamix, Ninja, NutriBullet...)"
              />
            )}
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.hasFoodStorage} onChange={(e) => updateField("hasFoodStorage", e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-700">I have proper food storage containers</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.hasKitchenScale} onChange={(e) => updateField("hasKitchenScale", e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-700">I have a kitchen food scale</span>
            </label>
          </div>
        </div>
      ),
    },
    {
      title: "Goals & Payment",
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Feeding Goal</label>
            <select value={form.feedingGoal} onChange={(e) => updateField("feedingGoal", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            >
              <option value="">Select your goal</option>
              <option value="full">Fully transition to homemade BTF</option>
              <option value="hybrid">Hybrid approach (commercial + BTF)</option>
              <option value="supplement">Supplement current regimen with occasional BTF</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes for Your RD</label>
            <textarea value={form.additionalNotes} onChange={(e) => updateField("additionalNotes", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              rows={3}
              placeholder="Anything else you'd like your Registered Dietitian to know..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select value={form.paymentMethod} onChange={(e) => updateField("paymentMethod", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            >
              <option value="">Select payment method</option>
              <option value="insurance">Insurance (MNT billing)</option>
              <option value="oop">Out-of-pocket</option>
            </select>
          </div>
          {form.paymentMethod === "insurance" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Provider</label>
              <input type="text" value={form.insuranceProvider} onChange={(e) => updateField("insuranceProvider", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="e.g., Blue Cross Blue Shield, Aetna, UnitedHealthcare..."
              />
            </div>
          )}
        </div>
      ),
    },
  ];

  if (saved) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ClipboardCheck className="w-8 h-8 text-brand-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Submitted</h2>
        <p className="text-gray-600 mb-6">
          Thank you for completing your assessment. A Registered Dietitian will review your information and generate your personalized Estimated Nutrient Needs (ENN).
          You&apos;ll receive a notification once your plan is ready.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
          <AlertCircle className="w-5 h-5 inline mr-2" />
          Your RD will reach out within 1-2 business days to schedule your initial consultation.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-brand-600" />
          RD Assessment
        </h1>
        <p className="text-gray-500 mt-1">
          Complete this comprehensive assessment so your Registered Dietitian can
          create safe, personalized nutrient targets for you.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1 mb-6">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition ${
              i <= step ? "bg-brand-600" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Step {step + 1} of {steps.length}: {steps[step].title}
        </h2>
        <div className="text-sm text-gray-500 mb-6">
          {step + 1}/{steps.length}
        </div>

        {steps[step].content}

        <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-100">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-1 bg-brand-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 transition"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-1 bg-brand-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition"
            >
              <Save className="w-4 h-4" />
              {saving ? "Submitting..." : "Submit Assessment"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
