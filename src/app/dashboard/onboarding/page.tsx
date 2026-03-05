"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Stethoscope,
  CookingPot,
  CreditCard,
  Bot,
  Search,
  Loader2,
  ChevronDown,
} from "lucide-react";

const CONSENT_TYPES = [
  "hipaa_telehealth",
  "btf_risk_waiver",
  "sanitation_agreement",
  "payment_terms",
  "ai_disclosure",
] as const;

type ConsentType = (typeof CONSENT_TYPES)[number];

interface ConsentState {
  hipaa_telehealth: boolean;
  btf_risk_waiver: boolean;
  sanitation_agreement: boolean;
  payment_terms: boolean;
  ai_disclosure: boolean;
}

interface DoctorInfo {
  doctorName: string;
  doctorFax: string;
  doctorPhone: string;
  doctorEmail: string;
  doctorPractice: string;
  doctorNpi: string;
  doctorCredential: string;
  doctorTaxonomy: string;
  doctorAddressLine1: string;
  doctorAddressCity: string;
  doctorAddressState: string;
  doctorAddressZip: string;
}

interface NpiResult {
  npi: string;
  firstName: string;
  lastName: string;
  credential: string;
  taxonomy: string;
  practiceName: string;
  phone: string;
  fax: string;
  address: {
    line1: string;
    city: string;
    state: string;
    zip: string;
  };
}

interface PatientContact {
  phone: string;
  addressLine1: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [patientDob, setPatientDob] = useState("");

  // Consent checkboxes
  const [consents, setConsents] = useState<ConsentState>({
    hipaa_telehealth: false,
    btf_risk_waiver: false,
    sanitation_agreement: false,
    payment_terms: false,
    ai_disclosure: false,
  });

  // Risk waiver initials
  const [riskInitials, setRiskInitials] = useState("");

  // Doctor referral info
  const [doctor, setDoctor] = useState<DoctorInfo>({
    doctorName: "",
    doctorFax: "",
    doctorPhone: "",
    doctorEmail: "",
    doctorPractice: "",
    doctorNpi: "",
    doctorCredential: "",
    doctorTaxonomy: "",
    doctorAddressLine1: "",
    doctorAddressCity: "",
    doctorAddressState: "",
    doctorAddressZip: "",
  });

  // NPI search state
  const [npiQuery, setNpiQuery] = useState("");
  const [npiResults, setNpiResults] = useState<NpiResult[]>([]);
  const [npiSearching, setNpiSearching] = useState(false);
  const [npiDropdownOpen, setNpiDropdownOpen] = useState(false);
  const [npiSelected, setNpiSelected] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const npiDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Patient contact info (for referral form PDF)
  const [patientContact, setPatientContact] = useState<PatientContact>({
    phone: "",
    addressLine1: "",
    addressCity: "",
    addressState: "",
    addressZip: "",
  });

  // NPI search with debounce
  const searchNpi = useCallback(async (query: string) => {
    if (query.length < 2) {
      setNpiResults([]);
      setNpiDropdownOpen(false);
      return;
    }
    setNpiSearching(true);
    try {
      const npiParams = new URLSearchParams({ name: query, limit: "8" });
      if (patientContact.addressState) npiParams.set("state", patientContact.addressState);
      if (patientContact.addressCity) npiParams.set("city", patientContact.addressCity);
      const res = await fetch(`/api/npi-lookup?${npiParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setNpiResults(data.results || []);
        setNpiDropdownOpen(true);
      }
    } catch {
      // silently fail
    }
    setNpiSearching(false);
  }, [patientContact.addressState, patientContact.addressCity]);

  function handleNpiQueryChange(value: string) {
    setNpiQuery(value);
    setNpiSelected(false);
    if (npiDebounceRef.current) clearTimeout(npiDebounceRef.current);
    npiDebounceRef.current = setTimeout(() => searchNpi(value), 400);
  }

  function selectNpiResult(result: NpiResult) {
    const fullName = `${result.firstName} ${result.lastName}`.trim();
    setDoctor({
      doctorName: fullName,
      doctorFax: result.fax,
      doctorPhone: result.phone,
      doctorEmail: "",
      doctorPractice: result.practiceName,
      doctorNpi: result.npi,
      doctorCredential: result.credential,
      doctorTaxonomy: result.taxonomy,
      doctorAddressLine1: result.address.line1,
      doctorAddressCity: result.address.city,
      doctorAddressState: result.address.state,
      doctorAddressZip: result.address.zip,
    });
    setNpiQuery(`${fullName}${result.credential ? `, ${result.credential}` : ""}`);
    setNpiSelected(true);
    setNpiDropdownOpen(false);
    setManualEntry(false);
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setNpiDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function checkOnboarding() {
      const res = await fetch("/api/dashboard/onboarding");
      if (!res.ok) {
        router.push("/login");
        return;
      }

      const { consents: existingConsents, profile, referral } = await res.json();

      setPatientName(profile?.fullName || "");

      if (profile?.onboardingCompleted) {
        setCompleted(true);
      }

      if (existingConsents && existingConsents.length > 0) {
        const updated = { ...consents };
        existingConsents.forEach((c: { consentType: string; consented: boolean; initials: string | null }) => {
          if (c.consentType in updated) {
            updated[c.consentType as ConsentType] = c.consented;
          }
          if (c.consentType === "btf_risk_waiver" && c.initials) {
            setRiskInitials(c.initials);
          }
        });
        setConsents(updated);
      }

      if (referral) {
        setDoctor({
          doctorName: referral.doctorName || "",
          doctorFax: referral.doctorFax || "",
          doctorPhone: referral.doctorPhone || "",
          doctorEmail: referral.doctorEmail || "",
          doctorPractice: referral.doctorPractice || "",
          doctorNpi: referral.doctorNpi || "",
          doctorCredential: referral.doctorCredential || "",
          doctorTaxonomy: referral.doctorTaxonomy || "",
          doctorAddressLine1: referral.doctorAddressLine1 || "",
          doctorAddressCity: referral.doctorAddressCity || "",
          doctorAddressState: referral.doctorAddressState || "",
          doctorAddressZip: referral.doctorAddressZip || "",
        });
        if (referral.doctorName) {
          setNpiQuery(referral.doctorName + (referral.doctorCredential ? `, ${referral.doctorCredential}` : ""));
          setNpiSelected(true);
        }
      }

      if (profile) {
        setPatientContact({
          phone: profile.phone || "",
          addressLine1: profile.addressLine1 || "",
          addressCity: profile.addressCity || "",
          addressState: profile.addressState || "",
          addressZip: profile.addressZip || "",
        });
        if (profile.dateOfBirth) {
          setPatientDob(profile.dateOfBirth);
        }
      }

      setLoading(false);
    }
    checkOnboarding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateDoctor(field: keyof DoctorInfo, value: string) {
    setDoctor((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setSaving(true);

    // Save all consents
    for (const consentType of CONSENT_TYPES) {
      await fetch("/api/dashboard/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "consent",
          consentType,
          consented: consents[consentType],
          initials: consentType === "btf_risk_waiver" ? riskInitials : null,
        }),
      });
    }

    // Save doctor referral if provided
    if (doctor.doctorName.trim()) {
      // Fetch patient assessment data for the referral snapshot
      let assessment: Record<string, unknown> | null = null;
      const assessRes = await fetch("/api/dashboard/assessment");
      if (assessRes.ok) {
        const data = await assessRes.json();
        assessment = data.assessment;
      }

      const referralRes = await fetch("/api/rd/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorName: doctor.doctorName,
          doctorFax: doctor.doctorFax || null,
          doctorPhone: doctor.doctorPhone || null,
          doctorEmail: doctor.doctorEmail || null,
          doctorPractice: doctor.doctorPractice || null,
          doctorNpi: doctor.doctorNpi || null,
          doctorCredential: doctor.doctorCredential || null,
          doctorTaxonomy: doctor.doctorTaxonomy || null,
          doctorAddressLine1: doctor.doctorAddressLine1 || null,
          doctorAddressCity: doctor.doctorAddressCity || null,
          doctorAddressState: doctor.doctorAddressState || null,
          doctorAddressZip: doctor.doctorAddressZip || null,
          patientDiagnosis: (assessment?.diagnosis as string) || null,
          patientDob: patientDob || null,
          patientTubeType: (assessment?.tubeType as string) || null,
          currentFormula: (assessment?.currentFormula as string) || null,
          dailyVolume: (assessment?.dailyVolume as string) || null,
          giSymptoms: (assessment?.giSymptoms as string[]) || [],
          insurance: (assessment?.insuranceProvider as string) || null,
          clinicalGoal:
            "Transition from commercial formula to real-food blenderized diet",
          referralStatus: "pending",
        }),
      });
      if (!referralRes.ok) {
        const err = await referralRes.json();
        console.error("Referral save failed:", err);
      }
    }

    // Save patient contact info and mark onboarding complete
    await fetch("/api/dashboard/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "profile",
        onboardingCompleted: true,
        phone: patientContact.phone || null,
        addressLine1: patientContact.addressLine1 || null,
        addressCity: patientContact.addressCity || null,
        addressState: patientContact.addressState || null,
        addressZip: patientContact.addressZip || null,
        dateOfBirth: patientDob || null,
      }),
    });

    setSaving(false);
    setCompleted(true);
  }

  // Determine if current step allows proceeding
  function canProceed(): boolean {
    switch (step) {
      case 0:
        return consents.hipaa_telehealth && consents.ai_disclosure;
      case 1:
        return doctor.doctorName.trim().length > 0;
      case 2:
        return consents.btf_risk_waiver && riskInitials.trim().length >= 2;
      case 3:
        return consents.sanitation_agreement;
      case 4:
        return consents.payment_terms;
      default:
        return false;
    }
  }

  const steps = [
    // ─── PAGE 1: HIPAA & TELEHEALTH CONSENT ───
    {
      title: "HIPAA & Telehealth Consent",
      icon: Shield,
      content: (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              California Telehealth Consent & HIPAA Notice
            </h3>
            <p className="text-sm text-blue-800">
              This document satisfies your rights under California Civil Code
              and the Health Insurance Portability and Accountability Act
              (HIPAA). Please read carefully before consenting.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4 max-h-80 overflow-y-auto text-sm text-gray-700 leading-relaxed">
            <h4 className="font-semibold text-gray-900">
              1. Nature of Telehealth Services
            </h4>
            <p>
              BlendWise Nutrition provides Medical Nutrition Therapy (MNT) and
              blenderized tube feeding (BTF) education through a telehealth
              platform. Services are delivered by California-licensed Registered
              Dietitians (RDs) via secure digital communication. Telehealth
              involves the use of electronic communications to enable healthcare
              providers to share individual patient information for the purposes
              of improving patient care.
            </p>

            <h4 className="font-semibold text-gray-900">
              2. Your Rights Under California Telehealth Law
            </h4>
            <p>
              Pursuant to California Business &amp; Professions Code Section
              2290.5, you have the right to: (a) withhold or withdraw consent to
              telehealth services at any time without affecting your right to
              future care or treatment; (b) access all medical information
              transmitted during a telehealth consultation as provided by law;
              (c) receive a consultation with your RD in person upon request,
              subject to scheduling availability.
            </p>

            <h4 className="font-semibold text-gray-900">
              3. HIPAA Notice of Privacy Practices
            </h4>
            <p>
              Your Protected Health Information (PHI) — including medical
              diagnoses, feeding tube details, symptoms, nutritional data,
              allergies, and dietary records — is safeguarded under the HIPAA
              Privacy Rule (45 CFR Parts 160 and 164). BlendWise Nutrition will:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Use your PHI only for treatment, payment, and healthcare
                operations as permitted under HIPAA
              </li>
              <li>
                Implement administrative, physical, and technical safeguards to
                protect your data at rest and in transit
              </li>
              <li>
                Not sell, share, or disclose your PHI to unauthorized third
                parties without your explicit written authorization
              </li>
              <li>
                Maintain Business Associate Agreements (BAAs) with all
                technology vendors that process PHI
              </li>
              <li>
                Notify you within 60 days of discovering any breach of your
                unsecured PHI, in accordance with the HIPAA Breach Notification
                Rule
              </li>
            </ul>

            <h4 className="font-semibold text-gray-900">
              4. Your HIPAA Rights
            </h4>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Request a copy of your medical records and PHI held by BlendWise
              </li>
              <li>
                Request corrections to inaccurate information in your health
                records
              </li>
              <li>
                Request restrictions on certain uses and disclosures of your PHI
              </li>
              <li>
                Receive an accounting of disclosures made by BlendWise in the
                prior six years
              </li>
              <li>
                File a complaint with BlendWise or the U.S. Department of Health
                and Human Services (HHS) if you believe your privacy rights have
                been violated
              </li>
            </ul>

            <h4 className="font-semibold text-gray-900">
              5. Risks and Limitations of Telehealth
            </h4>
            <p>
              Telehealth services may involve risks including, but not limited
              to: (a) delays in evaluation and treatment due to technology
              failures; (b) security risks related to electronic data
              transmission despite reasonable safeguards; (c) limitations of
              remote assessment compared to in-person clinical examination. In
              the event of a medical emergency, you should call 911 or proceed
              to your nearest emergency department.
            </p>

            <h4 className="font-semibold text-gray-900">
              6. Scope of Services
            </h4>
            <p>
              BlendWise RDs provide nutritional guidance and BTF education. They
              do not provide medical diagnoses, prescribe medications, or replace
              your physician&apos;s medical care. All BTF protocols are developed
              in coordination with your referring physician and should be
              approved by your medical team before implementation.
            </p>

            <h4 className="font-semibold text-gray-900">
              7. Data Retention
            </h4>
            <p>
              BlendWise retains your health records for a minimum of seven (7)
              years from the date of your last interaction, consistent with
              California medical record retention requirements (Health &amp;
              Safety Code Section 123145). You may request deletion of your
              account and data at any time, subject to legal retention
              obligations.
            </p>
          </div>

          {/* AI Disclosure — California AB 489 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Bot className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-amber-900 text-sm">
                  AI Disclosure — California AB 489 Compliance
                </h4>
                <p className="text-sm text-amber-800 mt-1">
                  BlendWise uses artificial intelligence (AI) to assist with
                  recipe generation, grocery list creation, and nutritional
                  calculations. These AI features are tools to support — not
                  replace — the clinical judgment of your Registered Dietitian.
                  All AI-generated content is reviewed for safety before being
                  presented to you. You are interacting with AI-powered features,
                  not a human, when using recipe and grocery generation tools.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-gray-100 pt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consents.hipaa_telehealth}
                onChange={(e) =>
                  setConsents((prev) => ({
                    ...prev,
                    hipaa_telehealth: e.target.checked,
                  }))
                }
                className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500 mt-0.5"
              />
              <span className="text-sm text-gray-700">
                <strong>I have read and agree</strong> to the HIPAA Notice of
                Privacy Practices and California Telehealth Consent above. I
                understand my rights and consent to receive telehealth-based
                Medical Nutrition Therapy from BlendWise Nutrition.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consents.ai_disclosure}
                onChange={(e) =>
                  setConsents((prev) => ({
                    ...prev,
                    ai_disclosure: e.target.checked,
                  }))
                }
                className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500 mt-0.5"
              />
              <span className="text-sm text-gray-700">
                <strong>I acknowledge</strong> that BlendWise uses AI-powered
                tools for recipe and grocery generation, and that these features
                are supplementary to my Registered Dietitian&apos;s clinical
                guidance.
              </span>
            </label>
          </div>
        </div>
      ),
    },

    // ─── PAGE 2: MEDICAL HISTORY & DOCTOR REFERRAL ───
    {
      title: "Physician Referral Information",
      icon: Stethoscope,
      content: (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-1">
              Doctor&apos;s Referral — Why We Need This
            </h3>
            <p className="text-sm text-blue-800">
              A physician referral authorizes your Registered Dietitian to
              provide Medical Nutrition Therapy (MNT). Just type your
              doctor&apos;s last name below — we&apos;ll fill in the rest
              automatically.
            </p>
          </div>

          {/* Patient Info Section */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-800">Your Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={patientDob}
                  onChange={(e) => setPatientDob(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={patientContact.phone}
                  onChange={(e) => setPatientContact(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={patientContact.addressLine1}
                onChange={(e) => setPatientContact(prev => ({ ...prev, addressLine1: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="123 Main St"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={patientContact.addressCity}
                  onChange={(e) => setPatientContact(prev => ({ ...prev, addressCity: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder="Sacramento"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={patientContact.addressState}
                  onChange={(e) => setPatientContact(prev => ({ ...prev, addressState: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder="CA"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={patientContact.addressZip}
                  onChange={(e) => setPatientContact(prev => ({ ...prev, addressZip: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder="95814"
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          {/* Doctor NPI Search */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-800">
              Find Your Doctor <span className="text-red-500">*</span>
            </p>
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={npiQuery}
                  onChange={(e) => handleNpiQueryChange(e.target.value)}
                  onFocus={() => { if (npiResults.length > 0 && !npiSelected) setNpiDropdownOpen(true); }}
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  placeholder="Type your doctor's last name..."
                />
                {npiSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>

              {/* NPI Results Dropdown */}
              {npiDropdownOpen && npiResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {npiResults.map((result) => (
                    <button
                      key={result.npi}
                      type="button"
                      onClick={() => selectNpiResult(result)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-0 transition"
                    >
                      <p className="font-medium text-gray-900 text-sm">
                        {result.firstName} {result.lastName}
                        {result.credential && <span className="text-gray-500">, {result.credential}</span>}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {result.taxonomy}
                        {result.practiceName && result.practiceName !== result.taxonomy && ` — ${result.practiceName}`}
                        {result.address.city && `, ${result.address.city} ${result.address.state}`}
                      </p>
                      {result.fax && (
                        <p className="text-xs text-green-600 mt-0.5">
                          Fax: {result.fax}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {npiDropdownOpen && npiResults.length === 0 && !npiSearching && npiQuery.length >= 2 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center">
                  <p className="text-sm text-gray-500">No results found for &quot;{npiQuery}&quot;</p>
                  <button
                    type="button"
                    onClick={() => { setManualEntry(true); setNpiDropdownOpen(false); }}
                    className="text-sm text-accent-600 hover:text-accent-700 font-medium mt-1"
                  >
                    Enter doctor info manually
                  </button>
                </div>
              )}
            </div>

            {/* Selected doctor summary */}
            {npiSelected && doctor.doctorName && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900">
                    <CheckCircle2 className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    {doctor.doctorName}{doctor.doctorCredential && `, ${doctor.doctorCredential}`}
                  </p>
                  <p className="text-xs text-green-700 mt-0.5">
                    {doctor.doctorTaxonomy}
                    {doctor.doctorPractice && doctor.doctorPractice !== doctor.doctorTaxonomy && ` — ${doctor.doctorPractice}`}
                  </p>
                  <p className="text-xs text-green-700">
                    NPI: {doctor.doctorNpi}
                    {doctor.doctorFax && ` | Fax: ${doctor.doctorFax}`}
                    {doctor.doctorPhone && ` | Phone: ${doctor.doctorPhone}`}
                  </p>
                  {doctor.doctorAddressLine1 && (
                    <p className="text-xs text-green-700">
                      {doctor.doctorAddressLine1}, {doctor.doctorAddressCity} {doctor.doctorAddressState} {doctor.doctorAddressZip}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNpiSelected(false);
                    setNpiQuery("");
                    setDoctor({
                      doctorName: "", doctorFax: "", doctorPhone: "", doctorEmail: "",
                      doctorPractice: "", doctorNpi: "", doctorCredential: "", doctorTaxonomy: "",
                      doctorAddressLine1: "", doctorAddressCity: "", doctorAddressState: "", doctorAddressZip: "",
                    });
                  }}
                  className="text-xs text-green-600 hover:text-green-700 font-medium whitespace-nowrap"
                >
                  Change
                </button>
              </div>
            )}

            {/* Manual entry fallback */}
            {!npiSelected && (
              <button
                type="button"
                onClick={() => setManualEntry(!manualEntry)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${manualEntry ? "rotate-180" : ""}`} />
                Can&apos;t find your doctor?
              </button>
            )}

            {manualEntry && !npiSelected && (
              <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                <p className="text-xs text-gray-500">Enter your doctor&apos;s information manually:</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Doctor&apos;s Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={doctor.doctorName}
                    onChange={(e) => updateDoctor("doctorName", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
                    placeholder="e.g., Sarah Johnson"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Practice / Clinic Name
                    </label>
                    <input
                      type="text"
                      value={doctor.doctorPractice}
                      onChange={(e) => updateDoctor("doctorPractice", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
                      placeholder="e.g., Valley Medical Center"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fax Number
                    </label>
                    <input
                      type="tel"
                      value={doctor.doctorFax}
                      onChange={(e) => updateDoctor("doctorFax", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={doctor.doctorPhone}
                      onChange={(e) => updateDoctor("doctorPhone", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
                      placeholder="(555) 987-6543"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NPI Number
                    </label>
                    <input
                      type="text"
                      value={doctor.doctorNpi}
                      onChange={(e) => updateDoctor("doctorNpi", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
                      placeholder="10-digit NPI (optional)"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
            <p className="font-medium text-gray-800 mb-2">
              What happens next?
            </p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>
                Your Registered Dietitian will prepare a pre-filled referral
                form with your clinical information
              </li>
              <li>
                The form is sent via secure e-fax to your doctor — it takes
                about 30 seconds for them to review and sign
              </li>
              <li>
                Once signed, your RD is authorized to begin your personalized
                BTF nutrition plan
              </li>
            </ol>
          </div>
        </div>
      ),
    },

    // ─── PAGE 3: BTF RISK WAIVER (ASSUMPTION OF RISK) ───
    {
      title: "BTF Assumption of Risk Waiver",
      icon: AlertTriangle,
      content: (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">
                  Important — Please Read Carefully
                </h3>
                <p className="text-sm text-red-800">
                  This waiver acknowledges the inherent risks of transitioning
                  from commercial formula to a blenderized tube feeding (BTF)
                  diet. Your initials are required to proceed.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4 max-h-80 overflow-y-auto text-sm text-gray-700 leading-relaxed">
            <h4 className="font-semibold text-gray-900">
              ASSUMPTION OF RISK AND INFORMED CONSENT FOR BLENDERIZED TUBE
              FEEDING (BTF)
            </h4>

            <p>
              I, the undersigned patient (or authorized caregiver), acknowledge
              that I am voluntarily choosing to explore and/or implement a
              blenderized tube feeding (BTF) diet with guidance from a
              California-licensed Registered Dietitian through the BlendWise
              Nutrition platform.
            </p>

            <h4 className="font-semibold text-gray-900">
              1. Understanding of BTF Risks
            </h4>
            <p>I understand and acknowledge that:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Blenderized tube feedings carry inherent risks that differ from
                commercially prepared formulas, including but not limited to:
                tube clogging, bacterial contamination, inconsistent nutrient
                delivery, and gastrointestinal complications
              </li>
              <li>
                Foodborne illness risk is elevated when preparing homemade tube
                feedings compared to sealed commercial formulas
              </li>
              <li>
                Improper blending technique, food temperatures, or storage
                practices may result in tube blockage, aspiration risk, or
                infection
              </li>
              <li>
                Nutritional adequacy cannot be guaranteed with the same precision
                as analyzed commercial formulas — regular monitoring by my RD and
                medical team is essential
              </li>
              <li>
                Individual responses to BTF vary; what works for other patients
                may not be appropriate for my clinical situation
              </li>
            </ul>

            <h4 className="font-semibold text-gray-900">
              2. My Responsibilities
            </h4>
            <p>I agree to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Follow all food preparation, blending, and storage instructions
                provided by my Registered Dietitian
              </li>
              <li>
                Maintain proper hygiene and sanitation practices at all times
                when preparing BTF
              </li>
              <li>
                Log my daily symptoms, weight, and intake as instructed through
                the BlendWise tracking tools
              </li>
              <li>
                Immediately notify my RD and physician if I experience adverse
                symptoms including: unexplained fever, severe GI distress,
                significant weight loss, tube complications, or signs of
                infection
              </li>
              <li>
                Not make changes to my feeding protocol without consulting my RD
                first
              </li>
              <li>
                Keep all scheduled follow-up consultations with my RD and
                medical team
              </li>
              <li>
                Maintain a commercial formula backup supply in case of emergency
                or BTF preparation issues
              </li>
            </ul>

            <h4 className="font-semibold text-gray-900">
              3. Limitation of Liability
            </h4>
            <p>
              I understand that BlendWise Nutrition and its Registered Dietitians
              provide nutritional education and guidance based on current
              evidence-based practices. They are not liable for adverse outcomes
              that result from: (a) my failure to follow prescribed protocols;
              (b) modifications I make to recommended recipes or feeding
              schedules without RD approval; (c) pre-existing medical conditions
              that complicate BTF; (d) third-party product quality or equipment
              malfunction.
            </p>

            <h4 className="font-semibold text-gray-900">
              4. Physician Coordination
            </h4>
            <p>
              I understand that BTF should be undertaken with the knowledge and
              approval of my primary physician or gastroenterologist. BlendWise
              will request a referral from my doctor authorizing Medical
              Nutrition Therapy. I agree that my RD may share relevant clinical
              information with my physician as needed for coordinated care.
            </p>

            <h4 className="font-semibold text-gray-900">
              5. Right to Withdraw
            </h4>
            <p>
              I may revoke this consent and discontinue BTF at any time by
              notifying my RD through the BlendWise platform. Withdrawal will
              not affect my right to future care or services.
            </p>
          </div>

          <div className="space-y-4 border-t border-gray-100 pt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consents.btf_risk_waiver}
                onChange={(e) =>
                  setConsents((prev) => ({
                    ...prev,
                    btf_risk_waiver: e.target.checked,
                  }))
                }
                className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500 mt-0.5"
              />
              <span className="text-sm text-gray-700">
                <strong>
                  I have read, understand, and voluntarily accept
                </strong>{" "}
                the risks associated with blenderized tube feedings as described
                above. I assume responsibility for following my RD&apos;s
                guidance and maintaining safe food handling practices.
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Initials <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={riskInitials}
                onChange={(e) =>
                  setRiskInitials(e.target.value.toUpperCase().slice(0, 4))
                }
                className="w-32 border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-center text-lg font-semibold tracking-widest"
                placeholder="A.B."
                maxLength={4}
              />
              <p className="text-xs text-gray-400 mt-1">
                Enter your initials to confirm you have read and accept this
                waiver
              </p>
            </div>
          </div>
        </div>
      ),
    },

    // ─── PAGE 4: SANITATION & FOOD SAFETY AGREEMENT ───
    {
      title: "Sanitation & Food Safety Agreement",
      icon: CookingPot,
      content: (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-1">
              Food Safety Is Critical for Tube Feeding
            </h3>
            <p className="text-sm text-green-800">
              Because blenderized tube feedings bypass the body&apos;s natural
              food safety defenses (chewing, saliva, stomach acid dilution), food
              safety practices are even more important than for oral eating.
              Please review and agree to the following safety commitments.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4 max-h-80 overflow-y-auto text-sm text-gray-700 leading-relaxed">
            <h4 className="font-semibold text-gray-900">
              FOOD SAFETY AND SANITATION AGREEMENT
            </h4>

            <h4 className="font-semibold text-gray-900">
              1. Preparation Environment
            </h4>
            <p>I commit to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Preparing all BTF in a clean kitchen environment with sanitized
                countertops and equipment
              </li>
              <li>
                Washing hands thoroughly with soap and warm water for at least 20
                seconds before handling any food or feeding supplies
              </li>
              <li>
                Using a high-powered blender capable of achieving a smooth,
                uniform consistency appropriate for my tube size
              </li>
              <li>
                Cleaning and sanitizing my blender, syringes, feeding bags, and
                all related equipment immediately after each use
              </li>
            </ul>

            <h4 className="font-semibold text-gray-900">
              2. Ingredient Safety
            </h4>
            <p>I commit to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Using only fresh, properly stored, and non-expired ingredients in
                my BTF recipes
              </li>
              <li>
                Properly washing all fruits and vegetables before blending
              </li>
              <li>
                Cooking all proteins to safe internal temperatures as recommended
                by the USDA (e.g., poultry to 165&deg;F, ground meats to
                160&deg;F)
              </li>
              <li>
                Not using raw eggs, unpasteurized dairy, or raw animal proteins
                in tube feedings unless specifically directed by my RD
              </li>
              <li>
                Checking for and avoiding any ingredients that conflict with my
                documented allergies or intolerances
              </li>
            </ul>

            <h4 className="font-semibold text-gray-900">
              3. Storage and Temperature Control
            </h4>
            <p>I commit to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Refrigerating prepared BTF immediately and using within 24 hours
                of preparation unless frozen
              </li>
              <li>
                Storing frozen BTF at 0&deg;F or below and using within 3 months
              </li>
              <li>
                Never leaving prepared BTF at room temperature for more than 2
                hours (1 hour if ambient temperature exceeds 90&deg;F)
              </li>
              <li>
                Thawing frozen BTF in the refrigerator — never at room
                temperature or in warm water
              </li>
              <li>
                Discarding any BTF that has been at room temperature beyond safe
                time limits, shows signs of spoilage, or has an unusual odor,
                color, or texture
              </li>
            </ul>

            <h4 className="font-semibold text-gray-900">
              4. Feeding Administration Safety
            </h4>
            <p>I commit to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Testing the consistency of each blend to ensure it flows
                smoothly through my tube without clogging
              </li>
              <li>
                Flushing my feeding tube with clean water before and after each
                BTF feeding
              </li>
              <li>
                Administering BTF at the rate, volume, and schedule prescribed by
                my RD
              </li>
              <li>
                Stopping administration and contacting my RD if I experience tube
                clogging, unusual resistance, leaking, or any adverse symptoms
              </li>
            </ul>

            <h4 className="font-semibold text-gray-900">
              5. Acknowledgment of Responsibility
            </h4>
            <p>
              I understand that failure to follow these food safety practices
              increases the risk of foodborne illness, tube complications, and
              other adverse health effects. I accept that BlendWise Nutrition and
              my Registered Dietitian are not responsible for adverse outcomes
              resulting from my failure to maintain proper sanitation and food
              safety practices.
            </p>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consents.sanitation_agreement}
                onChange={(e) =>
                  setConsents((prev) => ({
                    ...prev,
                    sanitation_agreement: e.target.checked,
                  }))
                }
                className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500 mt-0.5"
              />
              <span className="text-sm text-gray-700">
                <strong>I agree to follow</strong> all food safety and sanitation
                practices described above when preparing, storing, and
                administering blenderized tube feedings. I understand that I am
                responsible for maintaining a safe food preparation environment.
              </span>
            </label>
          </div>
        </div>
      ),
    },

    // ─── PAGE 5: PAYMENT TERMS & SUMMARY ───
    {
      title: "Subscription Terms & Review",
      icon: CreditCard,
      content: (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4 max-h-64 overflow-y-auto text-sm text-gray-700 leading-relaxed">
            <h4 className="font-semibold text-gray-900">
              SUBSCRIPTION AND PAYMENT TERMS
            </h4>

            <h4 className="font-semibold text-gray-900">
              1. Service Description
            </h4>
            <p>
              BlendWise Nutrition offers tiered subscription plans providing
              access to telehealth Medical Nutrition Therapy, personalized BTF
              recipe generation, grocery list planning, symptom tracking, and
              educational resources. Specific features vary by subscription tier
              as described on our pricing page.
            </p>

            <h4 className="font-semibold text-gray-900">2. Billing</h4>
            <p>
              Subscription fees are billed on a monthly recurring basis starting
              from your enrollment date. If you choose to pay via insurance (MNT
              billing), applicable co-pays and deductibles are your
              responsibility. BlendWise will verify insurance coverage but cannot
              guarantee reimbursement.
            </p>

            <h4 className="font-semibold text-gray-900">
              3. Cancellation and Refunds
            </h4>
            <p>
              You may cancel your subscription at any time through your account
              settings. Cancellation takes effect at the end of your current
              billing period. No refunds are provided for partial months. Access
              to your clinical data and records will be maintained for 30 days
              after cancellation, after which you may request an export.
            </p>

            <h4 className="font-semibold text-gray-900">
              4. Service Modifications
            </h4>
            <p>
              BlendWise reserves the right to modify subscription features,
              pricing, or terms with 30 days&apos; written notice. You may
              cancel without penalty if you do not agree to modified terms.
            </p>

            <h4 className="font-semibold text-gray-900">
              5. Insurance Billing Disclaimer
            </h4>
            <p>
              If utilizing insurance for MNT services, you authorize BlendWise
              to submit claims to your insurance provider on your behalf. You
              understand that: (a) insurance coverage for MNT varies by plan and
              is not guaranteed; (b) you are responsible for any charges not
              covered by insurance; (c) a valid physician referral may be
              required for insurance billing.
            </p>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consents.payment_terms}
                onChange={(e) =>
                  setConsents((prev) => ({
                    ...prev,
                    payment_terms: e.target.checked,
                  }))
                }
                className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500 mt-0.5"
              />
              <span className="text-sm text-gray-700">
                <strong>I agree to the subscription and payment terms</strong>{" "}
                described above, including recurring billing and the cancellation
                policy.
              </span>
            </label>
          </div>

          {/* Summary Checklist */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">
              Consent Summary Checklist
            </h3>
            <div className="space-y-3">
              {[
                {
                  label: "HIPAA & Telehealth Consent",
                  done: consents.hipaa_telehealth,
                },
                {
                  label: "AI Disclosure Acknowledgment (CA AB 489)",
                  done: consents.ai_disclosure,
                },
                {
                  label: "Physician Referral Information",
                  done: doctor.doctorName.trim().length > 0,
                },
                {
                  label: "BTF Assumption of Risk Waiver",
                  done: consents.btf_risk_waiver && riskInitials.length >= 2,
                },
                {
                  label: "Sanitation & Food Safety Agreement",
                  done: consents.sanitation_agreement,
                },
                { label: "Subscription & Payment Terms", done: consents.payment_terms },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 text-sm"
                >
                  <CheckCircle2
                    className={`w-5 h-5 flex-shrink-0 ${
                      item.done ? "text-green-500" : "text-gray-300"
                    }`}
                  />
                  <span
                    className={
                      item.done
                        ? "text-gray-900"
                        : "text-gray-400 line-through"
                    }
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-400">
        Loading onboarding...
      </div>
    );
  }

  if (completed) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-brand-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Onboarding Complete
        </h2>
        <p className="text-gray-600 mb-6">
          Thank you for completing the onboarding process,{" "}
          <strong>{patientName}</strong>. All consents have been recorded. Your
          next step is to complete your{" "}
          <a
            href="/dashboard/assessment"
            className="text-brand-600 font-semibold hover:underline"
          >
            RD Assessment
          </a>{" "}
          so your Registered Dietitian can begin creating your personalized
          nutrition plan.
        </p>
        {doctor.doctorName && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 text-left">
            <p className="font-semibold mb-1">Referral Status: Pending</p>
            <p>
              We have your physician information on file for{" "}
              <strong>{doctor.doctorName}</strong>
              {doctor.doctorPractice && ` at ${doctor.doctorPractice}`}. Your
              Registered Dietitian will prepare and send the referral form
              shortly.
            </p>
          </div>
        )}
        <div className="mt-6 flex gap-3 justify-center">
          <a
            href="/dashboard/assessment"
            className="bg-brand-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 transition"
          >
            Complete Assessment
          </a>
          <a
            href="/dashboard"
            className="bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const StepIcon = steps[step].icon;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-brand-600" />
          Patient Onboarding
        </h1>
        <p className="text-gray-500 mt-1">
          Please review and sign each consent form to begin using BlendWise.
          This process protects both you and your care team.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1 mb-6">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition ${
              i <= step ? "bg-brand-600" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-1">
          <StepIcon className="w-5 h-5 text-brand-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Step {step + 1} of {steps.length}: {steps[step].title}
          </h2>
        </div>
        <div className="text-sm text-gray-500 mb-6">
          Page {step + 1} of {steps.length}
        </div>

        {steps[step].content}

        <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-100">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-1 bg-brand-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving || !canProceed()}
              className="flex items-center gap-1 bg-brand-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition"
            >
              <FileText className="w-4 h-4" />
              {saving ? "Saving..." : "Complete Onboarding"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
