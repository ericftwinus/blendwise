"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ClipboardCheck, ArrowRight } from "lucide-react";

interface AssessmentRow {
  id: string;
  user_id: string;
  diagnosis: string | null;
  tube_type: string | null;
  feeding_goal: string | null;
  status: string;
  created_at: string;
  patient_name: string | null;
  patient_email: string | null;
}

export default function AssessmentQueuePage() {
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "submitted" | "reviewed" | "approved">("all");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get assigned patient IDs
      const { data: assignments } = await supabase
        .from("rd_patient_assignments")
        .select("patient_id")
        .eq("rd_id", user.id)
        .eq("status", "active");

      if (!assignments || assignments.length === 0) {
        setLoading(false);
        return;
      }

      const patientIds = assignments.map((a) => a.patient_id);

      // Get assessments for assigned patients
      const { data } = await supabase
        .from("assessments")
        .select("id, user_id, diagnosis, tube_type, feeding_goal, status, created_at")
        .in("user_id", patientIds)
        .order("created_at", { ascending: false });

      if (data) {
        // Fetch patient profiles
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", patientIds);

        const profileMap = new Map(
          (profiles || []).map((p) => [p.id, p])
        );

        setAssessments(
          data.map((a) => ({
            ...a,
            patient_name: profileMap.get(a.user_id)?.full_name || null,
            patient_email: profileMap.get(a.user_id)?.email || null,
          }))
        );
      }

      setLoading(false);
    }
    load();
  }, []);

  const filtered =
    filter === "all"
      ? assessments
      : assessments.filter((a) => a.status === filter);

  const statusColors: Record<string, string> = {
    submitted: "bg-amber-100 text-amber-700",
    reviewed: "bg-blue-100 text-blue-700",
    approved: "bg-green-100 text-green-700",
  };

  const counts = {
    all: assessments.length,
    submitted: assessments.filter((a) => a.status === "submitted").length,
    reviewed: assessments.filter((a) => a.status === "reviewed").length,
    approved: assessments.filter((a) => a.status === "approved").length,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-accent-600" />
          Assessment Queue
        </h1>
        <p className="text-gray-500 mt-1">
          Review submitted patient assessments and set their nutrient targets.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "submitted", "reviewed", "approved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition ${
              filter === f
                ? "bg-accent-100 text-accent-700"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 text-xs opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Assessment list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          Loading assessments...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No assessments found</p>
          <p className="text-sm text-gray-400 mt-1">
            {filter === "all"
              ? "Assessments from your assigned patients will appear here."
              : `No ${filter} assessments.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.map((a) => (
            <Link
              key={a.id}
              href={`/rd/patients/${a.user_id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition group"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-medium text-gray-900">
                    {a.patient_name || "Unknown Patient"}
                  </p>
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      statusColors[a.status] || "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {a.diagnosis && <span>{a.diagnosis}</span>}
                  {a.tube_type && (
                    <span className="text-gray-300">|</span>
                  )}
                  {a.tube_type && <span>{a.tube_type}</span>}
                  <span className="text-gray-300">|</span>
                  <span>
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
