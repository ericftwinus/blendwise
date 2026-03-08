"use client";

import Link from "next/link";
import { Leaf, Clock, Mail } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter } from "next/navigation";

export default function PendingVerificationPage() {
  const { signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 bg-accent-600 rounded-lg flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">
            Blend<span className="text-accent-600">Wise</span>
          </span>
          <span className="text-xs bg-accent-100 text-accent-700 px-1.5 py-0.5 rounded font-medium">
            RD
          </span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7 text-yellow-600" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Verification Pending
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Your CDR license is being reviewed by our team. This usually takes
            1-2 business days. You&apos;ll receive an email once your account is
            approved.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
            <p className="text-sm font-medium text-gray-700 mb-1">
              What happens next?
            </p>
            <ul className="text-sm text-gray-500 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-accent-600 mt-0.5">1.</span>
                Our admin team verifies your license number
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-600 mt-0.5">2.</span>
                You&apos;ll get an email notification when approved
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-600 mt-0.5">3.</span>
                Full access to the RD portal opens automatically
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href="mailto:support@blendwisenutrition.com"
              className="flex items-center justify-center gap-1.5 text-sm text-accent-600 font-medium hover:underline"
            >
              <Mail className="w-4 h-4" />
              Contact support
            </a>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
