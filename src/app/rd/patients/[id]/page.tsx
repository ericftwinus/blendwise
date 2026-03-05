"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ClipboardCheck,
  Activity,
  Weight,
  Save,
  CheckCircle2,
} from "lucide-react";

type Tab = "assessment" | "nutrients" | "logs";

interface Assessment {
  id: string;
  diagnosis: string | null;
  tubeType: string | null;
  tubePlacementDate: string | null;
  currentFormula: string | null;
  feedingSchedule: string | null;
  dailyVolume: string | null;
  giSymptoms: string[];
  giNotes: string | null;
  allergies: string | null;
  intolerances: string | null;
  dietaryPreferences: string[];
  dietaryNotes: string | null;
  hasBlender: boolean;
  blenderType: string | null;
  hasFoodStorage: boolean;
  hasKitchenScale: boolean;
  feedingGoal: string | null;
  additionalNotes: string | null;
  paymentMethod: string | null;
  insuranceProvider: string | null;
  status: string;
  createdAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

interface NutrientTargets {
  id?: string;
  caloriesMin: number | null;
  caloriesMax: number | null;
  proteinMin: number | null;
  proteinMax: number | null;
  carbsMin: number | null;
  carbsMax: number | null;
  fatMin: number | null;
  fatMax: number | null;
  fiberMin: number | null;
  fiberMax: number | null;
  fluidsMin: number | null;
  fluidsMax: number | null;
  feedingSchedule: string | null;
  safetyNotes: string | null;
  rdNotes: string | null;
}

interface LogEntry {
  id: string;
  date: string;
  weight: number | null;
  symptoms: string[];
  severity: number;
  intakeCompleted: boolean;
  notes: string | null;
  createdAt: string;
}

const emptyTargets: NutrientTargets = {
  caloriesMin: null,
  caloriesMax: null,
  proteinMin: null,
  proteinMax: null,
  carbsMin: null,
  carbsMax: null,
  fatMin: null,
  fatMax: null,
  fiberMin: null,
  fiberMax: null,
  fluidsMin: null,
  fluidsMax: null,
  feedingSchedule: null,
  safetyNotes: null,
  rdNotes: null,
};

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [tab, setTab] = useState<Tab>("assessment");
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [targets, setTargets] = useState<NutrientTargets>(emptyTargets);
  const [existingTargetId, setExistingTargetId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/rd/patients/${patientId}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (data.profile) {
        setPatientName(data.profile.fullName || "Unknown");
        setPatientEmail(data.profile.email || "");
      }

      if (data.assessment) setAssessment(data.assessment);

      if (data.targets) {
        setTargets(data.targets);
        setExistingTargetId(data.targets.id);
      }

      if (data.logs) setLogs(data.logs);

      setLoading(false);
    }
    load();
  }, [patientId]);

  async function handleReview(newStatus: string) {
    if (!assessment) return;
    setReviewSaving(true);

    const res = await fetch(`/api/rd/patients/${patientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "review",
        assessmentId: assessment.id,
        status: newStatus,
      }),
    });

    if (res.ok) {
      setAssessment({ ...assessment, status: newStatus });
    }
    setReviewSaving(false);
  }

  async function handleSaveTargets() {
    setSaving(true);
    setSaved(false);

    const res = await fetch(`/api/rd/patients/${patientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "targets",
        targetId: existingTargetId,
        caloriesMin: targets.caloriesMin,
        caloriesMax: targets.caloriesMax,
        proteinMin: targets.proteinMin,
        proteinMax: targets.proteinMax,
        carbsMin: targets.carbsMin,
        carbsMax: targets.carbsMax,
        fatMin: targets.fatMin,
        fatMax: targets.fatMax,
        fiberMin: targets.fiberMin,
        fiberMax: targets.fiberMax,
        fluidsMin: targets.fluidsMin,
        fluidsMax: targets.fluidsMax,
        feedingSchedule: targets.feedingSchedule,
        safetyNotes: targets.safetyNotes,
        rdNotes: targets.rdNotes,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.targets?.id) setExistingTargetId(data.targets.id);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function updateTarget(field: keyof NutrientTargets, value: string) {
    setTargets((prev) => ({
      ...prev,
      [field]:
        field.includes("Min") || field.includes("Max")
          ? value === ""
            ? null
            : parseInt(value)
          : value || null,
    }));
  }

  const tabs = [
    { key: "assessment" as Tab, label: "Assessment", icon: ClipboardCheck },
    { key: "nutrients" as Tab, label: "Nutrient Targets", icon: Activity },
    { key: "logs" as Tab, label: "Symptom Logs", icon: Weight },
  ];

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-400">
        Loading patient details...
      </div>
    );
  }

  const severityLabels: Record<number, { text: string; color: string }> = {
    1: { text: "Mild", color: "bg-green-100 text-green-700" },
    2: { text: "Moderate", color: "bg-yellow-100 text-yellow-700" },
    3: { text: "Severe", color: "bg-red-100 text-red-700" },
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/rd/patients")}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{patientName}</h1>
          <p className="text-gray-500 text-sm">{patientEmail}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition flex-1 justify-center ${
              tab === t.key
                ? "bg-white text-accent-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Assessment Tab */}
      {tab === "assessment" && (
        <div className="space-y-4">
          {!assessment ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                No assessment submitted yet.
              </p>
            </div>
          ) : (
            <>
              {/* Status banner */}
              <div
                className={`rounded-xl p-4 flex items-center justify-between ${
                  assessment.status === "approved"
                    ? "bg-green-50 border border-green-200"
                    : assessment.status === "reviewed"
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-amber-50 border border-amber-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      assessment.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : assessment.status === "reviewed"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {assessment.status}
                  </span>
                  <span className="text-sm text-gray-600">
                    Submitted{" "}
                    {new Date(assessment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  {assessment.status === "submitted" && (
                    <>
                      <button
                        onClick={() => handleReview("reviewed")}
                        disabled={reviewSaving}
                        className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        Mark Reviewed
                      </button>
                      <button
                        onClick={() => handleReview("approved")}
                        disabled={reviewSaving}
                        className="text-sm px-3 py-1.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition"
                      >
                        Approve
                      </button>
                    </>
                  )}
                  {assessment.status === "reviewed" && (
                    <button
                      onClick={() => handleReview("approved")}
                      disabled={reviewSaving}
                      className="text-sm px-3 py-1.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition"
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>

              {/* Assessment details */}
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                <Section title="Medical History">
                  <Field label="Diagnosis" value={assessment.diagnosis} />
                  <Field label="Tube Type" value={assessment.tubeType} />
                  <Field
                    label="Placement Date"
                    value={assessment.tubePlacementDate}
                  />
                  <Field
                    label="Current Formula"
                    value={assessment.currentFormula}
                  />
                  <Field
                    label="Feeding Schedule"
                    value={assessment.feedingSchedule}
                  />
                  <Field label="Daily Volume" value={assessment.dailyVolume} />
                </Section>

                <Section title="GI Symptoms">
                  {assessment.giSymptoms.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {assessment.giSymptoms.map((s) => (
                        <span
                          key={s}
                          className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">None reported</p>
                  )}
                  {assessment.giNotes && (
                    <p className="text-sm text-gray-600 mt-2">
                      {assessment.giNotes}
                    </p>
                  )}
                </Section>

                <Section title="Allergies & Intolerances">
                  <Field label="Allergies" value={assessment.allergies} />
                  <Field label="Intolerances" value={assessment.intolerances} />
                </Section>

                <Section title="Dietary Preferences">
                  {assessment.dietaryPreferences.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {assessment.dietaryPreferences.map((p) => (
                        <span
                          key={p}
                          className="text-xs bg-brand-100 text-brand-700 px-2.5 py-1 rounded-full"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">None specified</p>
                  )}
                  {assessment.dietaryNotes && (
                    <p className="text-sm text-gray-600 mt-2">
                      {assessment.dietaryNotes}
                    </p>
                  )}
                </Section>

                <Section title="Equipment">
                  <Field
                    label="Blender"
                    value={
                      assessment.hasBlender
                        ? assessment.blenderType || "Yes"
                        : "No"
                    }
                  />
                  <Field
                    label="Food Storage"
                    value={assessment.hasFoodStorage ? "Yes" : "No"}
                  />
                  <Field
                    label="Kitchen Scale"
                    value={assessment.hasKitchenScale ? "Yes" : "No"}
                  />
                </Section>

                <Section title="Goals & Payment">
                  <Field label="Feeding Goal" value={assessment.feedingGoal} />
                  <Field
                    label="Payment Method"
                    value={assessment.paymentMethod}
                  />
                  {assessment.insuranceProvider && (
                    <Field
                      label="Insurance"
                      value={assessment.insuranceProvider}
                    />
                  )}
                  {assessment.additionalNotes && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Notes for RD
                      </p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                        {assessment.additionalNotes}
                      </p>
                    </div>
                  )}
                </Section>
              </div>
            </>
          )}
        </div>
      )}

      {/* Nutrient Targets Tab */}
      {tab === "nutrients" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Set Estimated Nutrient Needs (ENN)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {[
                { label: "Calories (kcal/day)", prefix: "calories" },
                { label: "Protein (g/day)", prefix: "protein" },
                { label: "Carbs (g/day)", prefix: "carbs" },
                { label: "Fat (g/day)", prefix: "fat" },
                { label: "Fiber (g/day)", prefix: "fiber" },
                { label: "Fluids (mL/day)", prefix: "fluids" },
              ].map((n) => (
                <div key={n.prefix} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {n.label}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={
                        targets[
                          `${n.prefix}Min` as keyof NutrientTargets
                        ] ?? ""
                      }
                      onChange={(e) =>
                        updateTarget(
                          `${n.prefix}Min` as keyof NutrientTargets,
                          e.target.value
                        )
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
                    />
                    <span className="text-gray-400 self-center">–</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={
                        targets[
                          `${n.prefix}Max` as keyof NutrientTargets
                        ] ?? ""
                      }
                      onChange={(e) =>
                        updateTarget(
                          `${n.prefix}Max` as keyof NutrientTargets,
                          e.target.value
                        )
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feeding Schedule
                </label>
                <textarea
                  value={targets.feedingSchedule || ""}
                  onChange={(e) =>
                    updateTarget("feedingSchedule", e.target.value)
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
                  placeholder="e.g., 4 bolus feedings of 350 mL each, spaced 4 hours apart..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Safety Notes
                </label>
                <textarea
                  value={targets.safetyNotes || ""}
                  onChange={(e) =>
                    updateTarget("safetyNotes", e.target.value)
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
                  placeholder="Specific safety guidelines for this patient..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RD Notes (visible to patient)
                </label>
                <textarea
                  value={targets.rdNotes || ""}
                  onChange={(e) => updateTarget("rdNotes", e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
                  placeholder="Optional note shown to the patient on their nutrients page..."
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={handleSaveTargets}
                disabled={saving}
                className="flex items-center gap-2 bg-accent-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent-700 disabled:opacity-50 transition"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Targets"}
              </button>
              {saved && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  Saved successfully
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Symptom Logs Tab */}
      {tab === "logs" && (
        <div className="space-y-4">
          {logs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Weight className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No symptom logs recorded yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {logs.map((log) => (
                <div key={log.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(log.date).toLocaleDateString()}
                      </span>
                      {log.weight && (
                        <span className="text-sm text-gray-500">
                          {log.weight} lbs
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          severityLabels[log.severity]?.color ||
                          "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {severityLabels[log.severity]?.text || "Unknown"}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          log.intakeCompleted
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {log.intakeCompleted
                          ? "Intake completed"
                          : "Incomplete intake"}
                      </span>
                    </div>
                  </div>
                  {log.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {log.symptoms.map((s) => (
                        <span
                          key={s}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {log.notes && (
                    <p className="text-sm text-gray-500">{log.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-2 text-sm mb-1.5">
      <span className="text-gray-500 min-w-[140px]">{label}:</span>
      <span className="text-gray-900">{value || "—"}</span>
    </div>
  );
}
