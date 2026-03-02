"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Printer,
  RefreshCw,
} from "lucide-react";

interface Referral {
  id: string;
  patient_id: string;
  doctor_name: string;
  doctor_fax: string | null;
  doctor_phone: string | null;
  doctor_email: string | null;
  doctor_practice: string | null;
  doctor_npi: string | null;
  referral_status: string;
  patient_diagnosis: string | null;
  patient_dob: string | null;
  patient_tube_type: string | null;
  icd10_code: string;
  clinical_goal: string | null;
  referral_sent_at: string | null;
  referral_signed_at: string | null;
  notes: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string | null;
  };
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: typeof Clock }
> = {
  pending: {
    label: "Pending",
    color: "bg-amber-100 text-amber-700",
    icon: Clock,
  },
  ready: {
    label: "Ready to Send",
    color: "bg-blue-100 text-blue-700",
    icon: FileText,
  },
  sent: {
    label: "Sent to Doctor",
    color: "bg-indigo-100 text-indigo-700",
    icon: Send,
  },
  signed: {
    label: "Signed",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle2,
  },
  expired: {
    label: "Expired",
    color: "bg-gray-100 text-gray-500",
    icon: AlertCircle,
  },
  declined: {
    label: "Declined",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
};

const filterOptions = [
  "all",
  "pending",
  "ready",
  "sent",
  "signed",
  "expired",
  "declined",
];

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rdName, setRdName] = useState("");
  const [rdNpi, setRdNpi] = useState("");

  async function loadReferrals() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setRdName(user.user_metadata?.full_name || "");

    // Load RD profile for NPI
    const { data: rdProfile } = await supabase
      .from("rd_profiles")
      .select("license_number, license_state")
      .eq("id", user.id)
      .single();

    if (rdProfile) {
      setRdNpi(rdProfile.license_number || "");
    }

    // Get all patient IDs assigned to this RD
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

    const { data } = await supabase
      .from("doctor_referrals")
      .select(
        "*, profiles!doctor_referrals_patient_id_fkey(full_name, email)"
      )
      .in("patient_id", patientIds)
      .order("created_at", { ascending: false });

    if (data) {
      setReferrals(
        data.map((d: any) => ({
          ...d,
          profiles: d.profiles || { full_name: null, email: null },
        }))
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    loadReferrals();
  }, []);

  async function updateStatus(referralId: string, newStatus: string) {
    setUpdatingId(referralId);
    try {
      const res = await fetch("/api/rd/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referral_id: referralId,
          status: newStatus,
        }),
      });
      if (res.ok) {
        await loadReferrals();
      }
    } catch {
      // silently fail — user will see status didn't change
    }
    setUpdatingId(null);
  }

  const filtered =
    filter === "all"
      ? referrals
      : referrals.filter((r) => r.referral_status === filter);

  const counts = referrals.reduce(
    (acc, r) => {
      acc[r.referral_status] = (acc[r.referral_status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function generateReferralPreview(referral: Referral) {
    const today = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    return {
      header: `RE: ${referral.profiles.full_name || "Patient"} — DOB: ${referral.patient_dob || "N/A"}`,
      request:
        "Authorization for Medical Nutrition Therapy (MNT) & Whole-Food Blending Education",
      goal: referral.clinical_goal ||
        `Transition from commercial formula to real-food blenderized diet via ${referral.patient_tube_type || "feeding tube"}`,
      icd10: referral.icd10_code || "Z93.1",
      diagnosis: referral.patient_diagnosis || "See patient chart",
      date: today,
      rdName,
      doctorName: referral.doctor_name,
      doctorPractice: referral.doctor_practice,
      doctorFax: referral.doctor_fax,
    };
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-accent-600" />
            Physician Referrals
          </h1>
          <p className="text-gray-500 mt-1">
            Manage and track physician authorization forms for your patients.
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            loadReferrals();
          }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            key: "pending",
            label: "Awaiting Action",
            color: "bg-amber-50 border-amber-200",
          },
          {
            key: "sent",
            label: "Sent to Doctors",
            color: "bg-indigo-50 border-indigo-200",
          },
          {
            key: "signed",
            label: "Signed & Complete",
            color: "bg-green-50 border-green-200",
          },
          {
            key: "expired",
            label: "Need Follow-Up",
            color: "bg-gray-50 border-gray-200",
          },
        ].map((card) => (
          <div
            key={card.key}
            className={`rounded-lg border p-3 ${card.color}`}
          >
            <p className="text-2xl font-bold text-gray-900">
              {counts[card.key] || 0}
            </p>
            <p className="text-xs text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {filterOptions.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm px-3 py-1.5 rounded-full border transition capitalize ${
              filter === f
                ? "bg-accent-50 border-accent-300 text-accent-700 font-medium"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            {f === "all" ? `All (${referrals.length})` : `${f} (${counts[f] || 0})`}
          </button>
        ))}
      </div>

      {/* Referral list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          Loading referrals...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No referrals found</p>
          <p className="text-sm text-gray-400 mt-1">
            Referrals appear here when patients complete onboarding and provide
            their doctor&apos;s information.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((referral) => {
            const config = statusConfig[referral.referral_status] || statusConfig.pending;
            const StatusIcon = config.icon;
            const isExpanded = expandedId === referral.id;
            const isUpdating = updatingId === referral.id;
            const preview = generateReferralPreview(referral);

            return (
              <div
                key={referral.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Row header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : referral.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center text-accent-600 font-semibold text-sm">
                      {referral.profiles.full_name
                        ? referral.profiles.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        : "??"}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {referral.profiles.full_name || "Unknown Patient"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Dr. {referral.doctor_name}
                        {referral.doctor_practice &&
                          ` — ${referral.doctor_practice}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${config.color}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {config.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(referral.created_at)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-5">
                    {/* Doctor contact info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">
                          Doctor
                        </p>
                        <p className="font-medium text-gray-900">
                          {referral.doctor_name}
                        </p>
                        {referral.doctor_practice && (
                          <p className="text-gray-500">
                            {referral.doctor_practice}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">
                          Contact
                        </p>
                        {referral.doctor_fax && (
                          <p className="text-gray-700">
                            Fax: {referral.doctor_fax}
                          </p>
                        )}
                        {referral.doctor_phone && (
                          <p className="text-gray-700">
                            Phone: {referral.doctor_phone}
                          </p>
                        )}
                        {referral.doctor_email && (
                          <p className="text-gray-700">
                            {referral.doctor_email}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">
                          Patient Info
                        </p>
                        <p className="text-gray-700">
                          DOB: {referral.patient_dob || "Not provided"}
                        </p>
                        <p className="text-gray-700">
                          Dx: {referral.patient_diagnosis || "Pending assessment"}
                        </p>
                        <p className="text-gray-700">
                          Tube: {referral.patient_tube_type || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Referral form preview */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm font-mono space-y-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-sans font-medium mb-2">
                        30-Second Referral Form Preview
                      </p>
                      <div className="border-b border-gray-300 pb-2 mb-2">
                        <p className="font-bold text-gray-900">
                          {preview.header}
                        </p>
                        <p className="text-gray-700">
                          <strong>Request:</strong> {preview.request}
                        </p>
                        <p className="text-gray-700">
                          <strong>Clinical Goal:</strong> {preview.goal}
                        </p>
                        <p className="text-gray-700">
                          <strong>ICD-10 Code:</strong> {preview.icd10}{" "}
                          (Gastrostomy status) — Already checked for you
                        </p>
                        {referral.patient_diagnosis && (
                          <p className="text-gray-700">
                            <strong>Primary Diagnosis:</strong>{" "}
                            {referral.patient_diagnosis}
                          </p>
                        )}
                      </div>
                      <p className="text-gray-700">
                        [ ] I authorize the above-named Registered Dietitian (
                        {rdName || "RD Name"}) to provide MNT.
                      </p>
                      <p className="text-gray-500 mt-2">
                        Signature: __________________________ Date:
                        ___________
                      </p>
                      <p className="text-gray-500">
                        Physician Name (Print): {preview.doctorName}
                      </p>
                    </div>

                    {/* Timeline */}
                    <div className="flex gap-6 text-xs text-gray-500">
                      <span>
                        Created: {formatDate(referral.created_at)}
                      </span>
                      {referral.referral_sent_at && (
                        <span>
                          Sent: {formatDate(referral.referral_sent_at)}
                        </span>
                      )}
                      {referral.referral_signed_at && (
                        <span>
                          Signed: {formatDate(referral.referral_signed_at)}
                        </span>
                      )}
                    </div>

                    {/* Notes */}
                    {referral.notes && (
                      <div className="text-sm">
                        <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">
                          Notes
                        </p>
                        <p className="text-gray-700">{referral.notes}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      {referral.referral_status === "pending" && (
                        <button
                          onClick={() => updateStatus(referral.id, "ready")}
                          disabled={isUpdating}
                          className="flex items-center gap-1.5 bg-accent-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-700 disabled:opacity-50 transition"
                        >
                          <FileText className="w-4 h-4" />
                          {isUpdating ? "..." : "Mark Ready to Send"}
                        </button>
                      )}
                      {referral.referral_status === "ready" && (
                        <>
                          <button
                            onClick={() => updateStatus(referral.id, "sent")}
                            disabled={isUpdating}
                            className="flex items-center gap-1.5 bg-accent-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-700 disabled:opacity-50 transition"
                          >
                            <Send className="w-4 h-4" />
                            {isUpdating ? "..." : "Mark as Sent"}
                          </button>
                          <button
                            onClick={() => window.print()}
                            className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                          >
                            <Printer className="w-4 h-4" />
                            Print Form
                          </button>
                        </>
                      )}
                      {referral.referral_status === "sent" && (
                        <>
                          <button
                            onClick={() =>
                              updateStatus(referral.id, "signed")
                            }
                            disabled={isUpdating}
                            className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {isUpdating ? "..." : "Mark as Signed"}
                          </button>
                          <button
                            onClick={() =>
                              updateStatus(referral.id, "expired")
                            }
                            disabled={isUpdating}
                            className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-500 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition"
                          >
                            {isUpdating ? "..." : "Mark Expired"}
                          </button>
                        </>
                      )}
                      {(referral.referral_status === "expired" ||
                        referral.referral_status === "declined") && (
                        <button
                          onClick={() =>
                            updateStatus(referral.id, "pending")
                          }
                          disabled={isUpdating}
                          className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition"
                        >
                          <RefreshCw className="w-4 h-4" />
                          {isUpdating ? "..." : "Restart Referral"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
