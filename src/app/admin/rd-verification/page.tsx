"use client";

import { useEffect, useState } from "react";
import { Shield, CheckCircle2, XCircle, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface RdEntry {
  id: string;
  userId: string;
  fullName: string | null;
  email: string;
  licenseNumber: string | null;
  licenseState: string | null;
  verificationStatus: string;
  createdAt: string;
}

export default function RdVerificationPage() {
  const [rdList, setRdList] = useState<RdEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/rd-verification");
      if (!res.ok) {
        setError("Unauthorized or failed to load");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setRdList(data.rdProfiles);
      setLoading(false);
    }
    load();
  }, []);

  async function handleAction(rdProfileId: string, status: "approved" | "rejected") {
    setUpdating(rdProfileId);
    const res = await fetch("/api/admin/rd-verification", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rdProfileId, status }),
    });
    if (res.ok) {
      setRdList((prev) =>
        prev.map((rd) =>
          rd.id === rdProfileId ? { ...rd, verificationStatus: status } : rd
        )
      );
    }
    setUpdating(null);
  }

  const pending = rdList.filter((r) => r.verificationStatus === "pending_verification");
  const reviewed = rdList.filter((r) => r.verificationStatus !== "pending_verification");

  if (loading) {
    return <div className="text-center py-16 text-gray-400">Loading...</div>;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-16 text-center">
        <p className="text-red-600">{error}</p>
        <Link href="/" className="text-sm text-gray-500 hover:underline mt-4 block">
          Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-accent-600" />
            RD License Verification
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Review and approve Registered Dietitian applications
          </p>
        </div>
      </div>

      {/* Pending Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-500" />
          Pending Review ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
            No pending verifications
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((rd) => (
              <div
                key={rd.id}
                className="bg-white rounded-xl border border-yellow-200 p-5 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {rd.fullName || "Unknown"}
                  </p>
                  <p className="text-sm text-gray-500">{rd.email}</p>
                  <div className="flex gap-4 mt-1 text-sm text-gray-600">
                    <span>
                      License: <strong>{rd.licenseNumber || "N/A"}</strong>
                    </span>
                    <span>
                      State: <strong>{rd.licenseState || "N/A"}</strong>
                    </span>
                    <span>
                      Applied: {new Date(rd.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(rd.id, "approved")}
                    disabled={updating === rd.id}
                    className="flex items-center gap-1.5 text-sm px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(rd.id, "rejected")}
                    disabled={updating === rd.id}
                    className="flex items-center gap-1.5 text-sm px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 disabled:opacity-50 transition"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviewed Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Previously Reviewed ({reviewed.length})
        </h2>

        {reviewed.length === 0 ? (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
            No reviewed applications yet
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {reviewed.map((rd) => (
              <div key={rd.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {rd.fullName || "Unknown"}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">{rd.email}</span>
                  <span className="text-sm text-gray-400 ml-2">
                    {rd.licenseNumber} ({rd.licenseState})
                  </span>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    rd.verificationStatus === "approved"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {rd.verificationStatus}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
