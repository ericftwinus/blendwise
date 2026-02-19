"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  ClipboardCheck,
  Activity,
  ArrowRight,
} from "lucide-react";

interface DashboardStats {
  activePatients: number;
  pendingAssessments: number;
  recentLogs: number;
}

export default function RDDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    activePatients: 0,
    pendingAssessments: 0,
    recentLogs: 0,
  });
  const [rdName, setRdName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setRdName(user.user_metadata?.full_name || "");

      // Count active patient assignments
      const { count: activePatients } = await supabase
        .from("rd_patient_assignments")
        .select("*", { count: "exact", head: true })
        .eq("rd_id", user.id)
        .eq("status", "active");

      // Count pending assessments across assigned patients
      const { data: assignments } = await supabase
        .from("rd_patient_assignments")
        .select("patient_id")
        .eq("rd_id", user.id)
        .eq("status", "active");

      let pendingAssessments = 0;
      let recentLogs = 0;

      if (assignments && assignments.length > 0) {
        const patientIds = assignments.map((a) => a.patient_id);

        const { count: pendingCount } = await supabase
          .from("assessments")
          .select("*", { count: "exact", head: true })
          .in("user_id", patientIds)
          .eq("status", "submitted");

        pendingAssessments = pendingCount || 0;

        // Count symptom logs from the past 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const { count: logCount } = await supabase
          .from("symptom_logs")
          .select("*", { count: "exact", head: true })
          .in("user_id", patientIds)
          .gte("created_at", weekAgo.toISOString());

        recentLogs = logCount || 0;
      }

      setStats({
        activePatients: activePatients || 0,
        pendingAssessments,
        recentLogs,
      });
      setLoading(false);
    }
    load();
  }, []);

  const statCards = [
    {
      label: "Active Patients",
      value: stats.activePatients,
      icon: Users,
      color: "bg-accent-100 text-accent-700",
      iconColor: "text-accent-600",
      href: "/rd/patients",
    },
    {
      label: "Pending Assessments",
      value: stats.pendingAssessments,
      icon: ClipboardCheck,
      color: "bg-amber-100 text-amber-700",
      iconColor: "text-amber-600",
      href: "/rd/assessments",
    },
    {
      label: "Symptom Logs (7d)",
      value: stats.recentLogs,
      icon: Activity,
      color: "bg-green-100 text-green-700",
      iconColor: "text-green-600",
      href: "/rd/patients",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {loading ? "Loading..." : `Welcome back, ${rdName || "RD"}`}
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s an overview of your patient activity.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}
              >
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? "—" : card.value}
            </p>
            <p className="text-sm text-gray-500">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/rd/assessments"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition"
        >
          <ClipboardCheck className="w-8 h-8 text-accent-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">
            Review Assessments
          </h3>
          <p className="text-sm text-gray-500">
            View submitted patient assessments and set personalized nutrient
            targets.
          </p>
        </Link>
        <Link
          href="/rd/patients"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition"
        >
          <Users className="w-8 h-8 text-accent-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Manage Patients</h3>
          <p className="text-sm text-gray-500">
            View your patient roster, add new patients, and manage assignments.
          </p>
        </Link>
      </div>
    </div>
  );
}
