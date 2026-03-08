"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Settings, User, Bell, Shield, CreditCard, Save, Users, CheckCircle2 } from "lucide-react";

const TIER_NAMES: Record<number, { name: string; description: string }> = {
  1: { name: "Clinical Access (Tier 1)", description: "Insurance-billable or out-of-pocket RD services" },
  2: { name: "Personalized Automation (Tier 2)", description: "Automated recipes, grocery lists & limited RD messaging" },
  3: { name: "Full Convenience (Tier 3)", description: "Unlimited messaging, caregiver mode & priority scheduling" },
};

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [subscriptionTier, setSubscriptionTier] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [upgrading, setUpgrading] = useState<number | null>(null);
  const [justUpgraded, setJustUpgraded] = useState(searchParams.get("upgraded") === "true");
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    rdAppointments: true,
    groceryReady: true,
    symptomReminders: true,
    newContent: false,
    communityUpdates: false,
  });
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/dashboard/settings");
      if (res.ok) {
        const { profile, email: userEmail } = await res.json();
        setFullName(profile?.fullName || "");
        setEmail(userEmail || "");
        setSubscriptionTier(profile?.subscriptionTier || 1);
        if (profile?.notificationPreferences) {
          setNotifPrefs((prev) => ({ ...prev, ...profile.notificationPreferences }));
        }
      }
    }
    load();
  }, []);

  async function handleSaveNotifications() {
    setNotifSaving(true);
    await fetch("/api/dashboard/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationPreferences: notifPrefs }),
    });
    setNotifSaving(false);
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 3000);
  }

  async function handleUpgrade(tier: number) {
    setUpgrading(tier);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setUpgrading(null);
    }
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/dashboard/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName }),
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
            { key: "rdAppointments", label: "RD appointment reminders" },
            { key: "groceryReady", label: "Weekly grocery list ready" },
            { key: "symptomReminders", label: "Symptom tracking reminders" },
            { key: "newContent", label: "New educational content" },
            { key: "communityUpdates", label: "Community updates" },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-700">{item.label}</span>
              <input
                type="checkbox"
                checked={notifPrefs[item.key] ?? false}
                onChange={(e) =>
                  setNotifPrefs((prev) => ({ ...prev, [item.key]: e.target.checked }))
                }
                className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
            </label>
          ))}
        </div>
        <button
          onClick={handleSaveNotifications}
          disabled={notifSaving}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition mt-4"
        >
          <Save className="w-4 h-4" />
          {notifSaving ? "Saving..." : notifSaved ? "Saved!" : "Save Preferences"}
        </button>
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

        {justUpgraded && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-700 font-medium">
              Your subscription has been upgraded successfully!
            </p>
            <button onClick={() => setJustUpgraded(false)} className="ml-auto text-green-500 text-xs hover:underline">
              Dismiss
            </button>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-gray-900">
            Current Plan: {TIER_NAMES[subscriptionTier]?.name || "Clinical Access (Tier 1)"}
          </p>
          <p className="text-sm text-gray-500">
            {TIER_NAMES[subscriptionTier]?.description || ""}
          </p>
        </div>

        {subscriptionTier < 3 && (
          <div className="space-y-3">
            {subscriptionTier < 2 && (
              <div className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Personalized Automation</p>
                  <p className="text-sm text-gray-500">$39/month &mdash; recipes, grocery lists & more</p>
                </div>
                <button
                  onClick={() => handleUpgrade(2)}
                  disabled={upgrading !== null}
                  className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition"
                >
                  {upgrading === 2 ? "Redirecting..." : "Upgrade"}
                </button>
              </div>
            )}
            <div className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Full Convenience</p>
                <p className="text-sm text-gray-500">$79/month &mdash; unlimited messaging, caregiver mode & more</p>
              </div>
              <button
                onClick={() => handleUpgrade(3)}
                disabled={upgrading !== null}
                className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition"
              >
                {upgrading === 3 ? "Redirecting..." : "Upgrade"}
              </button>
            </div>
          </div>
        )}

        {subscriptionTier === 3 && (
          <p className="text-sm text-green-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            You&apos;re on the highest tier
          </p>
        )}
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
