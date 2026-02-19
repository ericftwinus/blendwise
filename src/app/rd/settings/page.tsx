"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Settings, Save, CheckCircle2 } from "lucide-react";

const specializations = [
  "Blenderized Tube Feeding",
  "Pediatric Nutrition",
  "Adult Enteral Nutrition",
  "GI Disorders",
  "Oncology Nutrition",
  "Neurological Conditions",
  "Weight Management",
  "Food Allergies",
];

export default function RDSettingsPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [acceptingPatients, setAcceptingPatients] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setFullName(user.user_metadata?.full_name || "");
      setEmail(user.email || "");

      const { data: rdProfile } = await supabase
        .from("rd_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (rdProfile) {
        setLicenseNumber(rdProfile.license_number || "");
        setLicenseState(rdProfile.license_state || "");
        setSelectedSpecs(rdProfile.specializations || []);
        setBio(rdProfile.bio || "");
        setAcceptingPatients(rdProfile.accepting_patients ?? true);
      }

      setLoading(false);
    }
    load();
  }, []);

  function toggleSpec(spec: string) {
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Update profile name
    await supabase
      .from("profiles")
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    // Update user metadata
    await supabase.auth.updateUser({
      data: { full_name: fullName },
    });

    // Upsert RD profile
    await supabase.from("rd_profiles").upsert({
      id: user.id,
      license_number: licenseNumber,
      license_state: licenseState,
      specializations: selectedSpecs,
      bio,
      accepting_patients: acceptingPatients,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-400">Loading settings...</div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-accent-600" />
          RD Settings
        </h1>
        <p className="text-gray-500 mt-1">
          Manage your professional profile and preferences.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">
          Profile Information
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 text-gray-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License Number
            </label>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none transition"
              placeholder="RD-12345"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License State
            </label>
            <input
              type="text"
              value={licenseState}
              onChange={(e) => setLicenseState(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none transition"
              placeholder="e.g., CA, NY, TX"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Specializations
          </label>
          <div className="grid grid-cols-2 gap-2">
            {specializations.map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => toggleSpec(spec)}
                className={`text-sm px-3 py-2 rounded-lg border transition text-left ${
                  selectedSpecs.includes(spec)
                    ? "bg-accent-50 border-accent-300 text-accent-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none transition"
            placeholder="Tell patients about your experience and approach..."
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptingPatients}
            onChange={(e) => setAcceptingPatients(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
          />
          <span className="text-sm text-gray-700">
            Currently accepting new patients
          </span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-accent-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent-700 disabled:opacity-50 transition"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Settings"}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            Saved successfully
          </span>
        )}
      </div>
    </div>
  );
}
