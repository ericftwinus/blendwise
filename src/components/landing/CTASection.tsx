import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-16 md:py-24 bg-brand-600 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)] -z-0" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to Take Control of Your Nutrition?
        </h2>
        <p className="text-lg text-brand-100 mb-8 max-w-2xl mx-auto">
          You&apos;re not just choosing a platform — you&apos;re joining a
          movement toward autonomy, dignity, and connection for tube-fed
          individuals everywhere.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-brand-700 px-8 py-3.5 rounded-xl text-lg font-semibold hover:bg-brand-50 transition shadow-lg"
          >
            Start Your Free Assessment
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#pricing"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white px-8 py-3.5 rounded-xl text-lg font-semibold hover:bg-white/10 transition"
          >
            View Pricing
          </a>
        </div>
      </div>
    </section>
  );
}
