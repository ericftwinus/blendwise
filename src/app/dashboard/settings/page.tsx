"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Settings, User, Bell, Shield, CreditCard, Save, Users } from "lucide-react";

export default function SettingsPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setFullName(data.user?.user_metadata?.full_name || "");
      setEmail(data.user?.email || "");
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    await supabase.auth.updateUser({
      data: { full_name: fullName },
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-600" />
          Settings
        </h1>
        <p className="text-gray-500 mt-1">
          Manage your account, notifications, and subscription.
        </p>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-brand-600" />
          Profile
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-gray-500"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-brand-600" />
          Notifications
        </h2>
        <div className="space-y-3">
          {[
            { label: "RD appointment reminders", default: true },
            { label: "Weekly grocery list ready", default: true },
            { label: "Symptom tracking reminders", default: true },
            { label: "New educational content", default: false },
            { label: "Community updates", default: false },
          ].map((item) => (
            <label key={item.label} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-700">{item.label}</span>
              <input
                type="checkbox"
                defaultChecked={item.default}
                className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Caregiver Access */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-brand-600" />
          Caregiver Mode
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Give family members or caregivers access to view and manage your plans, track symptoms, and coordinate care.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500 mb-2">Available with Tier 3 (Full Convenience) subscription</p>
          <button className="text-sm text-brand-600 font-semibold hover:underline">
            Upgrade to enable
          </button>
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-brand-600" />
          Subscription
        </h2>
        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Current Plan: Clinical Access (Tier 1)</p>
            <p className="text-sm text-gray-500">Insurance-billable or out-of-pocket RD services</p>
          </div>
          <button className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 transition">
            Upgrade
          </button>
        </div>
      </div>

      {/* Privacy */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-brand-600" />
          Privacy & Security
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          BlendWise is HIPAA-compliant. Your health data is encrypted and never shared without your consent.
        </p>
        <div className="space-y-2 text-sm">
          <button className="text-brand-600 font-medium hover:underline block">
            Download my data
          </button>
          <button className="text-red-600 font-medium hover:underline block">
            Delete my account
          </button>
        </div>
      </div>
    </div>
  );
}
