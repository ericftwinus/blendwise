"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Leaf } from "lucide-react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Blend<span className="text-brand-600">Wise</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-gray-600 hover:text-brand-600 transition">
              How It Works
            </a>
            <a href="#features" className="text-sm text-gray-600 hover:text-brand-600 transition">
              Features
            </a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-brand-600 transition">
              Pricing
            </a>
            <a href="#about" className="text-sm text-gray-600 hover:text-brand-600 transition">
              About
            </a>
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-brand-600 transition"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition"
            >
              Get Started
            </Link>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 pb-4 space-y-3">
          <a href="#how-it-works" className="block text-gray-600 hover:text-brand-600" onClick={() => setMobileOpen(false)}>
            How It Works
          </a>
          <a href="#features" className="block text-gray-600 hover:text-brand-600" onClick={() => setMobileOpen(false)}>
            Features
          </a>
          <a href="#pricing" className="block text-gray-600 hover:text-brand-600" onClick={() => setMobileOpen(false)}>
            Pricing
          </a>
          <a href="#about" className="block text-gray-600 hover:text-brand-600" onClick={() => setMobileOpen(false)}>
            About
          </a>
          <Link href="/login" className="block text-gray-600 hover:text-brand-600" onClick={() => setMobileOpen(false)}>
            Sign In
          </Link>
          <Link
            href="/signup"
            className="block text-center bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700"
            onClick={() => setMobileOpen(false)}
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}
