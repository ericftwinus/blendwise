"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, ArrowRight } from "lucide-react";

interface AssessmentRow {
  id: string;
  userId: string;
  diagnosis: string | null;
  tubeType: string | null;
  feedingGoal: string | null;
  status: string;
  createdAt: string;
  patientName: string | null;
  patientEmail: string | null;
}

export default function AssessmentQueuePage() {
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "submitted" | "reviewed" | "approved">("all");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/rd/assessments");
      if (res.ok) {
        const { assessments: data } = await res.json();
        if (data) setAssessments(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filter === "all" ? assessments : assessments.filter((a) => a.status === filter);

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
        <p className="text-gray-500 mt-1">Review submitted patient assessments and set their nutrient targets.</p>
      </div>

      <div className="flex gap-2">
        {(["all", "submitted", "reviewed", "approved"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition ${
              filter === f ? "bg-accent-100 text-accent-700" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 text-xs opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading assessments...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No assessments found</p>
          <p className="text-sm text-gray-400 mt-1">
            {filter === "all" ? "Assessments from your assigned patients will appear here." : `No ${filter} assessments.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.map((a) => (
            <Link key={a.id} href={`/rd/patients/${a.userId}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition group"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-medium text-gray-900">{a.patientName || "Unknown Patient"}</p>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColors[a.status] || "bg-gray-100 text-gray-500"}`}>
                    {a.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {a.diagnosis && <span>{a.diagnosis}</span>}
                  {a.tubeType && <><span className="text-gray-300">|</span><span>{a.tubeType}</span></>}
                  <span className="text-gray-300">|</span>
                  <span>{new Date(a.createdAt).toLocaleDateString()}</span>
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
