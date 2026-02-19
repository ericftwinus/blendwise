"use client";

import { Activity, Info, AlertCircle } from "lucide-react";

const sampleTargets = [
  { nutrient: "Calories", target: "1,800 - 2,000", unit: "kcal/day", color: "bg-orange-100 text-orange-700" },
  { nutrient: "Protein", target: "65 - 80", unit: "g/day", color: "bg-red-100 text-red-700" },
  { nutrient: "Carbohydrates", target: "225 - 275", unit: "g/day", color: "bg-yellow-100 text-yellow-700" },
  { nutrient: "Fat", target: "60 - 78", unit: "g/day", color: "bg-purple-100 text-purple-700" },
  { nutrient: "Fiber", target: "25 - 30", unit: "g/day", color: "bg-green-100 text-green-700" },
  { nutrient: "Fluids", target: "1,500 - 2,000", unit: "mL/day", color: "bg-blue-100 text-blue-700" },
];

export default function NutrientsPage() {
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

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm text-amber-800 font-medium">Awaiting RD Review</p>
          <p className="text-sm text-amber-700">
            The targets below are sample values. Your personalized ENN will appear here once your Registered Dietitian completes their review of your assessment.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sampleTargets.map((item) => (
          <div key={item.nutrient} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium mb-3 ${item.color}`}>
              {item.nutrient}
            </div>
            <p className="text-2xl font-bold text-gray-900">{item.target}</p>
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
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Safety Notes</h2>
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
      </div>
    </div>
  );
}
