"use client";

import { useEffect, useState } from "react";
import {
  FileText, Send, CheckCircle2, Clock, XCircle, AlertCircle,
  ChevronDown, ChevronUp, RefreshCw, Download, Eye, RotateCcw, Loader2, Zap,
} from "lucide-react";

interface Referral {
  id: string;
  patientId: string;
  doctorName: string;
  doctorFax: string | null;
  doctorPhone: string | null;
  doctorEmail: string | null;
  doctorPractice: string | null;
  doctorNpi: string | null;
  doctorCredential: string | null;
  doctorTaxonomy: string | null;
  doctorAddressLine1: string | null;
  doctorAddressCity: string | null;
  doctorAddressState: string | null;
  doctorAddressZip: string | null;
  referralStatus: string;
  patientDiagnosis: string | null;
  patientDob: string | null;
  patientTubeType: string | null;
  icd10Codes: string[] | null;
  primaryDiagnosisIcd10: string | null;
  supportingInfoCodes: string[] | null;
  clinicalGoal: string | null;
  currentFormula: string | null;
  dailyVolume: string | null;
  giSymptoms: string[] | null;
  insurance: string | null;
  pdfStoragePath: string | null;
  signedPdfStoragePath: string | null;
  faxAttempts: number;
  lastFaxAttemptAt: string | null;
  faxProviderId: string | null;
  referralSentAt: string | null;
  referralSignedAt: string | null;
  notes: string | null;
  createdAt: string;
  profiles: { fullName: string | null; email: string | null };
}

interface FaxLog {
  id: string;
  eventType: string;
  providerJobId: string | null;
  toNumber: string | null;
  errorMessage: string | null;
  attemptNumber: number;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock; pulse?: boolean }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: Clock },
  generating: { label: "Generating PDF", color: "bg-blue-100 text-blue-700", icon: Loader2, pulse: true },
  ready: { label: "PDF Ready", color: "bg-blue-100 text-blue-700", icon: FileText },
  sent: { label: "Fax Sent", color: "bg-indigo-100 text-indigo-700", icon: Send },
  signed: { label: "Signed", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-500", icon: AlertCircle },
  declined: { label: "Declined", color: "bg-red-100 text-red-700", icon: XCircle },
  fax_failed: { label: "Fax Failed", color: "bg-red-100 text-red-700", icon: AlertCircle },
};

const filterOptions = ["all", "pending", "generating", "ready", "sent", "signed", "fax_failed", "expired", "declined"];

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [faxLogs, setFaxLogs] = useState<Record<string, FaxLog[]>>({});
  const [confirmFax, setConfirmFax] = useState<string | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  async function loadReferrals() {
    try {
      const res = await fetch("/api/rd/referrals");
      if (res.ok) {
        const json = await res.json();
        setReferrals(json.referrals || []);
      }
    } catch { /* silently fail */ }
    setLoading(false);
  }

  async function loadFaxLogs(referralId: string) {
    const res = await fetch(`/api/rd/referrals/fax-logs?referralId=${referralId}`);
    if (res.ok) {
      const { logs } = await res.json();
      if (logs) setFaxLogs((prev) => ({ ...prev, [referralId]: logs }));
    }
  }

  useEffect(() => { loadReferrals(); }, []);

  async function generatePdf(referralId: string) {
    setActionLoading(referralId);
    try {
      const res = await fetch("/api/rd/referrals/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referral_id: referralId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.pdf_url) setPdfPreviewUrl(data.pdf_url);
        await loadReferrals();
      }
    } catch { /* silently fail */ }
    setActionLoading(null);
  }

  async function sendFax(referralId: string) {
    setConfirmFax(null);
    setActionLoading(referralId);
    try {
      const res = await fetch("/api/rd/referrals/send-fax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referral_id: referralId }),
      });
      if (res.ok) {
        await loadReferrals();
        await loadFaxLogs(referralId);
      }
    } catch { /* silently fail */ }
    setActionLoading(null);
  }

  async function updateStatus(referralId: string, newStatus: string) {
    setActionLoading(referralId);
    try {
      const res = await fetch("/api/rd/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referral_id: referralId, status: newStatus }),
      });
      if (res.ok) await loadReferrals();
    } catch { /* silently fail */ }
    setActionLoading(null);
  }

  const filtered = filter === "all" ? referrals : referrals.filter((r) => r.referralStatus === filter);
  const counts = referrals.reduce((acc, r) => { acc[r.referralStatus] = (acc[r.referralStatus] || 0) + 1; return acc; }, {} as Record<string, number>);

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "\u2014";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  const isLoading = (id: string) => actionLoading === id;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-accent-600" /> Physician Referrals
          </h1>
          <p className="text-gray-500 mt-1">Generate referral PDFs and send via secure fax.</p>
        </div>
        <button onClick={() => { setLoading(true); loadReferrals(); }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
        ><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: "pending", label: "Awaiting Action", color: "bg-amber-50 border-amber-200" },
          { key: "ready", label: "PDF Ready", color: "bg-blue-50 border-blue-200" },
          { key: "sent", label: "Fax Sent", color: "bg-indigo-50 border-indigo-200" },
          { key: "signed", label: "Signed", color: "bg-green-50 border-green-200" },
        ].map((card) => (
          <div key={card.key} className={`rounded-lg border p-3 ${card.color}`}>
            <p className="text-2xl font-bold text-gray-900">{counts[card.key] || 0}</p>
            <p className="text-xs text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {filterOptions.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-sm px-3 py-1.5 rounded-full border transition capitalize ${
              filter === f ? "bg-accent-50 border-accent-300 text-accent-700 font-medium" : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >{f === "all" ? `All (${referrals.length})` : `${f.replace("_", " ")} (${counts[f] || 0})`}</button>
        ))}
      </div>

      {pdfPreviewUrl && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-gray-900">Referral PDF Preview</h3>
              <div className="flex gap-2">
                <a href={pdfPreviewUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-accent-600 hover:text-accent-700"
                ><Download className="w-4 h-4" /> Download</a>
                <button onClick={() => setPdfPreviewUrl(null)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
              </div>
            </div>
            <iframe src={pdfPreviewUrl} className="flex-1 min-h-[500px]" title="Referral PDF" />
          </div>
        </div>
      )}

      {confirmFax && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg">Confirm Fax Send</h3>
            <p className="text-sm text-gray-600">This will send the referral PDF via secure fax to the doctor&apos;s fax number on file.</p>
            {(() => {
              const r = referrals.find((ref) => ref.id === confirmFax);
              return r ? (
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="text-gray-700"><strong>To:</strong> {r.doctorName} \u2014 {r.doctorFax}</p>
                  <p className="text-gray-700"><strong>Patient:</strong> {r.profiles.fullName}</p>
                </div>
              ) : null;
            })()}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmFax(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={() => sendFax(confirmFax)}
                className="flex items-center gap-1.5 bg-accent-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-700 transition"
              ><Send className="w-4 h-4" /> Send Fax Now</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading referrals...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No referrals found</p>
          <p className="text-sm text-gray-400 mt-1">Referrals appear here when patients complete onboarding.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((referral) => {
            const config = statusConfig[referral.referralStatus] || statusConfig.pending;
            const StatusIcon = config.icon;
            const isExpanded = expandedId === referral.id;
            const busy = isLoading(referral.id);
            const logs = faxLogs[referral.id] || [];

            return (
              <div key={referral.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button onClick={() => {
                  const next = isExpanded ? null : referral.id;
                  setExpandedId(next);
                  if (next && !faxLogs[referral.id]) loadFaxLogs(referral.id);
                }}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center text-accent-600 font-semibold text-sm">
                      {referral.profiles.fullName ? referral.profiles.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "??"}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{referral.profiles.fullName || "Unknown Patient"}</p>
                      <p className="text-sm text-gray-500">
                        Dr. {referral.doctorName}
                        {referral.doctorCredential && `, ${referral.doctorCredential}`}
                        {referral.doctorPractice && ` \u2014 ${referral.doctorPractice}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${config.color}`}>
                      <StatusIcon className={`w-3.5 h-3.5 ${config.pulse ? "animate-spin" : ""}`} />{config.label}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(referral.createdAt)}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Doctor</p>
                        <p className="font-medium text-gray-900">{referral.doctorName}{referral.doctorCredential && `, ${referral.doctorCredential}`}</p>
                        {referral.doctorPractice && <p className="text-gray-500">{referral.doctorPractice}</p>}
                        {referral.doctorNpi && <p className="text-gray-500 text-xs">NPI: {referral.doctorNpi}</p>}
                        {referral.doctorAddressLine1 && (
                          <p className="text-gray-500 text-xs mt-1">{referral.doctorAddressLine1}, {referral.doctorAddressCity} {referral.doctorAddressState} {referral.doctorAddressZip}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Contact</p>
                        {referral.doctorFax && <p className="text-gray-700">Fax: {referral.doctorFax}</p>}
                        {referral.doctorPhone && <p className="text-gray-700">Phone: {referral.doctorPhone}</p>}
                        {referral.doctorEmail && <p className="text-gray-700">{referral.doctorEmail}</p>}
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Patient Info</p>
                        <p className="text-gray-700">DOB: {referral.patientDob || "Not provided"}</p>
                        <p className="text-gray-700">Dx: {referral.patientDiagnosis || "Pending"}</p>
                        <p className="text-gray-700">Tube: {referral.patientTubeType || "N/A"}</p>
                        {referral.insurance && <p className="text-gray-700 text-xs mt-1">Insurance: {referral.insurance}</p>}
                      </div>
                    </div>

                    {referral.icd10Codes && referral.icd10Codes.length > 0 && (
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">ICD-10 Codes (Auto-Mapped)</p>
                        <div className="flex flex-wrap gap-1.5">
                          {referral.icd10Codes.map((code) => (
                            <span key={code} className="bg-blue-50 text-blue-700 text-xs font-mono px-2 py-0.5 rounded">{code}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-6 text-xs text-gray-500">
                      <span>Created: {formatDate(referral.createdAt)}</span>
                      {referral.referralSentAt && <span>Sent: {formatDate(referral.referralSentAt)}</span>}
                      {referral.referralSignedAt && <span>Signed: {formatDate(referral.referralSignedAt)}</span>}
                      {referral.faxAttempts > 0 && <span>Fax Attempts: {referral.faxAttempts}</span>}
                    </div>

                    {logs.length > 0 && (
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Fax Activity</p>
                        <div className="relative pl-4 border-l-2 border-gray-200 space-y-3">
                          {logs.map((log) => {
                            const isError = log.eventType === "failed";
                            const isSuccess = log.eventType === "delivered" || log.eventType === "received";
                            return (
                              <div key={log.id} className="relative">
                                <div className={`absolute -left-[21px] w-3 h-3 rounded-full border-2 ${
                                  isError ? "bg-red-100 border-red-400" : isSuccess ? "bg-green-100 border-green-400" : "bg-blue-100 border-blue-400"
                                }`} />
                                <div className="text-sm">
                                  <span className="font-medium text-gray-700 capitalize">{log.eventType.replace("_", " ")}</span>
                                  <span className="text-gray-400 ml-2 text-xs">{formatDateTime(log.createdAt)}</span>
                                  {log.toNumber && <span className="text-gray-400 ml-2 text-xs">to {log.toNumber}</span>}
                                  {log.errorMessage && <p className="text-red-600 text-xs mt-0.5">{log.errorMessage}</p>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {referral.notes && (
                      <div className="text-sm">
                        <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Notes</p>
                        <p className="text-gray-700">{referral.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-gray-100 flex-wrap">
                      {referral.referralStatus === "pending" && (
                        <button onClick={() => generatePdf(referral.id)} disabled={busy}
                          className="flex items-center gap-1.5 bg-accent-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-700 disabled:opacity-50 transition"
                        >{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}{busy ? "Generating..." : "Generate PDF"}</button>
                      )}

                      {referral.referralStatus === "ready" && (
                        <>
                          {referral.pdfStoragePath && (
                            <button onClick={() => generatePdf(referral.id)} disabled={busy}
                              className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                            ><Eye className="w-4 h-4" /> Preview PDF</button>
                          )}
                          {referral.doctorFax ? (
                            <button onClick={() => setConfirmFax(referral.id)} disabled={busy}
                              className="flex items-center gap-1.5 bg-accent-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-700 disabled:opacity-50 transition"
                            ><Send className="w-4 h-4" /> {busy ? "Sending..." : "Send Fax"}</button>
                          ) : (
                            <span className="text-xs text-amber-600 self-center">No fax number on file \u2014 cannot fax</span>
                          )}
                        </>
                      )}

                      {referral.referralStatus === "sent" && (
                        <>
                          <button onClick={() => updateStatus(referral.id, "signed")} disabled={busy}
                            className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition"
                          ><CheckCircle2 className="w-4 h-4" /> {busy ? "..." : "Mark as Signed"}</button>
                          <button onClick={() => updateStatus(referral.id, "expired")} disabled={busy}
                            className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-500 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition"
                          >{busy ? "..." : "Mark Expired"}</button>
                        </>
                      )}

                      {referral.referralStatus === "fax_failed" && (
                        <button onClick={() => setConfirmFax(referral.id)} disabled={busy}
                          className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition"
                        ><RotateCcw className="w-4 h-4" /> {busy ? "Retrying..." : "Retry Fax"}</button>
                      )}

                      {referral.referralStatus === "signed" && referral.signedPdfStoragePath && (
                        <button className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition">
                          <Download className="w-4 h-4" /> View Signed Copy
                        </button>
                      )}

                      {(referral.referralStatus === "expired" || referral.referralStatus === "declined") && (
                        <button onClick={() => updateStatus(referral.id, "pending")} disabled={busy}
                          className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition"
                        ><RefreshCw className="w-4 h-4" /> {busy ? "..." : "Restart Referral"}</button>
                      )}

                      {referral.pdfStoragePath && referral.referralStatus !== "ready" && referral.referralStatus !== "pending" && (
                        <button onClick={() => generatePdf(referral.id)} disabled={busy}
                          className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
                        ><Eye className="w-4 h-4" /> View PDF</button>
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
