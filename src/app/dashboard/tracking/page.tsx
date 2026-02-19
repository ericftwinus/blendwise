"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Weight,
  Activity,
  Plus,
  TrendingUp,
  Calendar,
  Save,
} from "lucide-react";

const symptomOptions = [
  "Nausea",
  "Vomiting",
  "Diarrhea",
  "Constipation",
  "Bloating",
  "Abdominal pain",
  "Reflux",
  "Gas",
  "No symptoms",
];

const severityLevels = [
  { value: 1, label: "Mild", color: "bg-green-100 text-green-700" },
  { value: 2, label: "Moderate", color: "bg-yellow-100 text-yellow-700" },
  { value: 3, label: "Severe", color: "bg-red-100 text-red-700" },
];

interface LogEntry {
  id?: string;
  date: string;
  weight: string | number | null;
  symptoms: string[];
  severity: number;
  intake_completed: boolean;
  notes: string | null;
}

export default function TrackingPage() {
  const [weight, setWeight] = useState("");
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState(1);
  const [intakeCompleted, setIntakeCompleted] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("symptom_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(20);

      if (data) setRecentLogs(data);
      setLoading(false);
    }
    loadLogs();
  }, []);

  function toggleSymptom(s: string) {
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function handleSave() {
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const entry = {
      user_id: user.id,
      date: logDate,
      weight: weight ? parseFloat(weight) : null,
      symptoms,
      severity,
      intake_completed: intakeCompleted,
      notes: notes || null,
    };

    const { data, error } = await supabase.from("symptom_logs").insert(entry).select().single();

    if (!error && data) {
      setRecentLogs((prev) => [data, ...prev]);
    }

    setWeight("");
    setSymptoms([]);
    setSeverity(1);
    setNotes("");
    setIntakeCompleted(true);
    setSaving(false);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-brand-600" />
          Weight & Symptom Tracking
        </h1>
        <p className="text-gray-500 mt-1">
          Log your daily weight, GI symptoms, and intake to help your RD optimize your plan.
        </p>
      </div>

      {/* New Entry Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Plus className="w-5 h-5 text-brand-600" />
          New Daily Log
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label>
            <div className="relative">
              <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="e.g., 145.0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">GI Symptoms Today</label>
          <div className="flex flex-wrap gap-2">
            {symptomOptions.map((s) => (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                className={`text-sm px-3 py-1.5 rounded-lg border transition ${
                  symptoms.includes(s)
                    ? "bg-brand-50 border-brand-300 text-brand-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {symptoms.length > 0 && !symptoms.includes("No symptoms") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <div className="flex gap-3">
              {severityLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setSeverity(level.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition ${
                    severity === level.value
                      ? `${level.color} border-current`
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={intakeCompleted}
            onChange={(e) => setIntakeCompleted(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-gray-700">Completed all planned feedings today</span>
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            placeholder="Any observations about today's feedings..."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Log Entry"}
        </button>
      </div>

      {/* Recent Logs */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-600" />
          Recent Logs
        </h2>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : recentLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Activity className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No logs yet. Start by adding your first daily entry above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentLogs.map((log, i) => (
              <div key={log.id || i} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{log.date}</span>
                  <div className="flex items-center gap-3 text-sm">
                    {log.weight && (
                      <span className="text-gray-600">
                        <Weight className="w-4 h-4 inline mr-1" />
                        {log.weight} lbs
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      log.intake_completed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {log.intake_completed ? "Intake Complete" : "Incomplete Intake"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {log.symptoms?.map((s) => (
                    <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
                {log.notes && <p className="text-sm text-gray-500">{log.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
