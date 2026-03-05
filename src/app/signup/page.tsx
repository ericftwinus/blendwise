"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf, Mail, Lock, User, ArrowRight } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: fullName });

      // Create session cookie
      const idToken = await result.user.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      // Trigger user-created webhook as fallback (session cookie authenticates)
      await fetch("/api/webhooks/user-created", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: result.user.uid,
          email: result.user.email,
          displayName: fullName,
          role: "patient",
        }),
      });

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Signup failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 to-brand-800 p-12 flex-col justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">BlendWise</span>
        </Link>

        <div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Begin your journey to safe, personalized tube feedings
          </h1>
          <p className="text-brand-100 text-lg">
            Join BlendWise and get matched with a Registered Dietitian who
            specializes in blenderized tube feedings.
          </p>
        </div>

        <p className="text-brand-200 text-sm">
          &copy; {new Date().getFullYear()} BlendWise Nutrition
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Blend<span className="text-brand-600">Wise</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Create your account
          </h2>
          <p className="text-gray-500 mb-8">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                  placeholder="Jane Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-2.5 rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50 transition"
            >
              {loading ? "Creating account..." : "Create Account"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>

            <p className="text-xs text-gray-500 text-center">
              By creating an account, you agree to our{" "}
              <a href="#" className="underline">Terms of Service</a> and{" "}
              <a href="#" className="underline">Privacy Policy</a>.
            </p>
          </form>

          <p className="text-sm text-gray-500 text-center mt-6">
            Are you a Registered Dietitian?{" "}
            <Link href="/rd/signup" className="text-accent-600 font-medium hover:underline">
              Sign up as an RD
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
