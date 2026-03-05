"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Salad,
  ShoppingCart,
  Activity,
  Weight,
  ArrowRight,
  TrendingUp,
  Calendar,
  Heart,
  Shield,
} from "lucide-react";

const quickActions = [
  {
    href: "/dashboard/assessment",
    icon: ClipboardCheck,
    label: "Complete Assessment",
    description: "Start your RD assessment to get personalized nutrient targets",
    color: "bg-blue-50 text-blue-600",
  },
  {
    href: "/dashboard/recipes",
    icon: Salad,
    label: "View Recipes",
    description: "Browse personalized blenderized tube feeding recipes",
    color: "bg-green-50 text-green-600",
  },
  {
    href: "/dashboard/grocery",
    icon: ShoppingCart,
    label: "Grocery List",
    description: "Generate or view your automated weekly grocery list",
    color: "bg-orange-50 text-orange-600",
  },
  {
    href: "/dashboard/tracking",
    icon: Activity,
    label: "Log Symptoms",
    description: "Track your weight, GI symptoms, and intake consistency",
    color: "bg-purple-50 text-purple-600",
  },
];

interface DashboardData {
  userName: string;
  onboardingCompleted: boolean;
  hasAssessment: boolean;
  hasNutrientTargets: boolean;
  hasGroceryList: boolean;
  lastWeight: string | null;
  logStreak: number;
  tier: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    userName: "",
    onboardingCompleted: false,
    hasAssessment: false,
    hasNutrientTargets: false,
    hasGroceryList: false,
    lastWeight: null,
    logStreak: 0,
    tier: 1,
  });

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/dashboard/summary");
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
    }
    load();
  }, []);

  const tierName = data.tier === 3 ? "Full Convenience" : data.tier === 2 ? "Personalized Automation" : "Clinical Access";

  const checklist = [
    { step: "Create your account", done: true },
    { step: "Complete onboarding consents", done: data.onboardingCompleted },
    { step: "Complete your RD assessment", done: data.hasAssessment },
    { step: "Review your Estimated Nutrient Needs", done: data.hasNutrientTargets },
    { step: "Generate your first grocery list", done: data.hasGroceryList },
    { step: "Log your first symptom entry", done: data.logStreak > 0 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Welcome back, {data.userName || "there"}
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s an overview of your BlendWise journey.
        </p>
      </div>

      {!data.onboardingCompleted && (
        <Link
          href="/dashboard/onboarding"
          className="block bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-200 rounded-xl p-5 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-brand-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition flex items-center gap-1">
                Complete Your Onboarding
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
              </h3>
              <p className="text-sm text-gray-600 mt-0.5">
                Sign required consent forms and provide your doctor&apos;s information for referral collection. This is required before your RD can begin.
              </p>
            </div>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Calendar, label: "Assessment Status", value: data.hasAssessment ? "Completed" : "Not Started", color: "text-blue-600 bg-blue-50" },
          { icon: TrendingUp, label: "Logging Streak", value: `${data.logStreak} day${data.logStreak !== 1 ? "s" : ""}`, color: "text-green-600 bg-green-50" },
          { icon: Weight, label: "Last Weight Log", value: data.lastWeight || "Not recorded", color: "text-purple-600 bg-purple-50" },
          { icon: Heart, label: "Subscription", value: tierName, color: "text-pink-600 bg-pink-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-lg font-semibold text-gray-900 mt-0.5">{stat.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-brand-200 hover:shadow-md transition flex items-start gap-4"
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${action.color}`}>
                <action.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition flex items-center gap-1">
                  {action.label}
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h2>
        <div className="space-y-3">
          {checklist.map((item) => (
            <div key={item.step} className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  item.done ? "bg-brand-600 border-brand-600" : "border-gray-300"
                }`}
              >
                {item.done && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-sm ${item.done ? "text-gray-400 line-through" : "text-gray-700"}`}>
                {item.step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
