import Link from "next/link";
import { ArrowRight, ShieldCheck, Heart, Salad } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-accent-50 -z-10" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-brand-200/30 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-200/20 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <ShieldCheck className="w-4 h-4" />
            Clinically supervised by Registered Dietitians
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Homemade Tube Feedings,{" "}
            <span className="text-brand-600">Made Safe & Simple</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            BlendWise empowers tube-fed individuals to safely prepare personalized
            blenderized tube feedings at home — with expert RD guidance, automated
            meal planning, and grocery delivery.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-600 text-white px-8 py-3.5 rounded-xl text-lg font-semibold hover:bg-brand-700 transition shadow-lg shadow-brand-600/25"
            >
              Start Your Assessment
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl text-lg font-semibold hover:border-brand-300 hover:text-brand-600 transition"
            >
              See How It Works
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
              <span className="text-sm font-medium">HIPAA Compliant</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Heart className="w-5 h-5 text-brand-600" />
              <span className="text-sm font-medium">Insurance Billable</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Salad className="w-5 h-5 text-brand-600" />
              <span className="text-sm font-medium">Evidence-Based</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
