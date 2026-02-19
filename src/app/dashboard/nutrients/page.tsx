"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Activity, Info, AlertCircle, CheckCircle2 } from "lucide-react";

interface NutrientTarget {
  calories_min: number | null;
  calories_max: number | null;
  protein_min: number | null;
  protein_max: number | null;
  carbs_min: number | null;
  carbs_max: number | null;
  fat_min: number | null;
  fat_max: number | null;
  fiber_min: number | null;
  fiber_max: number | null;
  fluids_min: number | null;
  fluids_max: number | null;
  feeding_schedule: string | null;
  safety_notes: string | null;
  rd_notes: string | null;
}

const defaultTargets = [
  { nutrient: "Calories", min: 1800, max: 2000, unit: "kcal/day", color: "bg-orange-100 text-orange-700" },
  { nutrient: "Protein", min: 65, max: 80, unit: "g/day", color: "bg-red-100 text-red-700" },
  { nutrient: "Carbohydrates", min: 225, max: 275, unit: "g/day", color: "bg-yellow-100 text-yellow-700" },
  { nutrient: "Fat", min: 60, max: 78, unit: "g/day", color: "bg-purple-100 text-purple-700" },
  { nutrient: "Fiber", min: 25, max: 30, unit: "g/day", color: "bg-green-100 text-green-700" },
  { nutrient: "Fluids", min: 1500, max: 2000, unit: "mL/day", color: "bg-blue-100 text-blue-700" },
];

export default function NutrientsPage() {
  const [targets, setTargets] = useState<NutrientTarget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("nutrient_targets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) setTargets(data);
      setLoading(false);
    }
    load();
  }, []);

  const hasRealTargets = targets !== null;

  const displayTargets = hasRealTargets
    ? [
        { nutrient: "Calories", min: targets.calories_min, max: targets.calories_max, unit: "kcal/day", color: "bg-orange-100 text-orange-700" },
        { nutrient: "Protein", min: targets.protein_min, max: targets.protein_max, unit: "g/day", color: "bg-red-100 text-red-700" },
        { nutrient: "Carbohydrates", min: targets.carbs_min, max: targets.carbs_max, unit: "g/day", color: "bg-yellow-100 text-yellow-700" },
        { nutrient: "Fat", min: targets.fat_min, max: targets.fat_max, unit: "g/day", color: "bg-purple-100 text-purple-700" },
        { nutrient: "Fiber", min: targets.fiber_min, max: targets.fiber_max, unit: "g/day", color: "bg-green-100 text-green-700" },
        { nutrient: "Fluids", min: targets.fluids_min, max: targets.fluids_max, unit: "mL/day", color: "bg-blue-100 text-blue-700" },
      ]
    : defaultTargets;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-brand-600" />
          Estimated Nutrient Needs
        </h1>
        <p className="text-gray-500 mt-1">
          Your personalized daily nutrient targets, set by your Registered Dietitian based on your assessment.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <>
          {hasRealTargets ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-green-800 font-medium">RD-Approved Targets</p>
                <p className="text-sm text-green-700">
                  These nutrient targets were set by your Registered Dietitian based on your assessment.
                  {targets.rd_notes && ` RD notes: ${targets.rd_notes}`}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-amber-800 font-medium">Awaiting RD Review</p>
                <p className="text-sm text-amber-700">
                  The targets below are sample values. Your personalized ENN will appear here once your Registered Dietitian completes their review.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayTargets.map((item) => (
              <div key={item.nutrient} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium mb-3 ${item.color}`}>
                  {item.nutrient}
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {item.min != null && item.max != null
                    ? `${item.min.toLocaleString()} - ${item.max.toLocaleString()}`
                    : item.min != null
                    ? `${item.min.toLocaleString()}+`
                    : "—"}
                </p>
                <p className="text-sm text-gray-500">{item.unit}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-brand-600" />
              Feeding Schedule
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              {hasRealTargets && targets.feeding_schedule ? (
                <p className="text-sm text-gray-700 whitespace-pre-line">{targets.feeding_schedule}</p>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    Your feeding schedule will be determined by your RD based on your tube type,
                    tolerance, and lifestyle. Common approaches include:
                  </p>
                  <ul className="mt-3 space-y-2">
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1.5 flex-shrink-0" />
                      <span><strong>Bolus feedings:</strong> 4-6 feedings per day, 240-480 mL each</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1.5 flex-shrink-0" />
                      <span><strong>Continuous/overnight:</strong> Pump-assisted feedings during sleep</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1.5 flex-shrink-0" />
                      <span><strong>Hybrid:</strong> Bolus BTF during the day + commercial formula overnight</span>
                    </li>
                  </ul>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Safety Notes</h2>
            {hasRealTargets && targets.safety_notes ? (
              <p className="text-sm text-gray-600 whitespace-pre-line">{targets.safety_notes}</p>
            ) : (
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 flex-shrink-0" />
                  Always flush your tube with warm water before and after feedings
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 flex-shrink-0" />
                  Blend all ingredients to a smooth, uniform consistency
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 flex-shrink-0" />
                  Refrigerate prepared blends and use within 24 hours
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 flex-shrink-0" />
                  Contact your RD immediately if you experience new or worsening symptoms
                </li>
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
