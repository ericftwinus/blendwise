"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  Search,
  UserPlus,
  X,
  Mail,
  ArrowRight,
} from "lucide-react";

interface PatientAssignment {
  id: string;
  patient_id: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string | null;
  };
}

export default function PatientsPage() {
  const [assignments, setAssignments] = useState<PatientAssignment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupResult, setLookupResult] = useState<{
    id: string;
    full_name: string;
    email: string;
  } | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  async function loadAssignments() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("rd_patient_assignments")
      .select("id, patient_id, status, created_at, profiles!rd_patient_assignments_patient_id_fkey(full_name, email)")
      .eq("rd_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setAssignments(
        data.map((d: any) => ({
          ...d,
          profiles: d.profiles || { full_name: null, email: null },
        }))
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    loadAssignments();
  }, []);

  async function handleLookup() {
    setLookupError("");
    setLookupResult(null);
    setLookupLoading(true);

    try {
      const res = await fetch("/api/rd/lookup-patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: lookupEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.error || "Patient not found");
      } else {
        setLookupResult(data);
      }
    } catch {
      setLookupError("Failed to search. Please try again.");
    }
    setLookupLoading(false);
  }

  async function handleAssign() {
    if (!lookupResult) return;
    setAssigning(true);

    try {
      const res = await fetch("/api/rd/assign-patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: lookupResult.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.error || "Failed to assign patient");
      } else {
        setShowAddModal(false);
        setLookupEmail("");
        setLookupResult(null);
        await loadAssignments();
      }
    } catch {
      setLookupError("Failed to assign. Please try again.");
    }
    setAssigning(false);
  }

  const filtered = assignments.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.profiles.full_name?.toLowerCase().includes(q) ||
      a.profiles.email?.toLowerCase().includes(q)
    );
  });

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    paused: "bg-yellow-100 text-yellow-700",
    discharged: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-accent-600" />
            Patients
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your patient roster and assignments.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-accent-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent-700 transition"
        >
          <UserPlus className="w-4 h-4" />
          Add Patient
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none transition"
          placeholder="Search patients by name or email..."
        />
      </div>

      {/* Patient list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading patients...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No patients yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Use &quot;Add Patient&quot; to assign patients to your roster.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.map((a) => (
            <Link
              key={a.id}
              href={`/rd/patients/${a.patient_id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center text-accent-600 font-semibold text-sm">
                  {a.profiles.full_name
                    ? a.profiles.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "??"}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {a.profiles.full_name || "Unknown Patient"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {a.profiles.email || "No email"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    statusColors[a.status] || statusColors.active
                  }`}
                >
                  {a.status}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Add Patient
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setLookupEmail("");
                  setLookupResult(null);
                  setLookupError("");
                }}
              >
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Search for a patient by their email address to add them to your
              roster.
            </p>

            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={lookupEmail}
                  onChange={(e) => setLookupEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none text-sm transition"
                  placeholder="patient@example.com"
                />
              </div>
              <button
                onClick={handleLookup}
                disabled={!lookupEmail || lookupLoading}
                className="px-4 py-2.5 bg-accent-600 text-white rounded-lg text-sm font-semibold hover:bg-accent-700 disabled:opacity-50 transition"
              >
                {lookupLoading ? "..." : "Search"}
              </button>
            </div>

            {lookupError && (
              <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">
                {lookupError}
              </div>
            )}

            {lookupResult && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="font-medium text-gray-900">
                  {lookupResult.full_name}
                </p>
                <p className="text-sm text-gray-500">{lookupResult.email}</p>
                <button
                  onClick={handleAssign}
                  disabled={assigning}
                  className="mt-3 w-full bg-accent-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-accent-700 disabled:opacity-50 transition"
                >
                  {assigning ? "Assigning..." : "Assign to My Roster"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
