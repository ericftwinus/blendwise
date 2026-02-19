import Link from "next/link";
import { Leaf } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Blend<span className="text-brand-400">Wise</span>
              </span>
            </div>
            <p className="text-sm">
              Empowering tube-fed individuals with safe, personalized homemade
              blenderized tube feedings.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
              <li><a href="#features" className="hover:text-white transition">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
              <li><Link href="/signup" className="hover:text-white transition">Get Started</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#about" className="hover:text-white transition">About Us</a></li>
              <li><a href="#" className="hover:text-white transition">Educational Videos</a></li>
              <li><a href="#" className="hover:text-white transition">Community</a></li>
              <li><a href="#" className="hover:text-white transition">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">For Providers</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">Refer a Patient</a></li>
              <li><a href="#" className="hover:text-white transition">Partner With Us</a></li>
              <li><a href="#" className="hover:text-white transition">Research</a></li>
              <li><a href="#" className="hover:text-white transition">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} BlendWise Nutrition. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Service</a>
            <a href="#" className="hover:text-white transition">HIPAA Notice</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
