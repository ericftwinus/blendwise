import Link from "next/link";
import { Check, Star } from "lucide-react";

const tiers = [
  {
    name: "Clinical Access",
    stars: 1,
    price: "Copay / Out-of-Pocket",
    priceNote: "Insurance reimbursement or direct payment",
    description: "Essential RD-supervised care for safe tube feeding transitions.",
    features: [
      "Initial RD assessment",
      "Estimated Nutrient Needs (ENN)",
      "Monthly RD follow-ups",
      "Educational video library",
      "Weight & symptom tracking",
      "Referral management",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Personalized Automation",
    stars: 2,
    price: "$39",
    priceNote: "per month",
    description: "Everything in Clinical Access plus automated planning tools.",
    features: [
      "Everything in Clinical Access",
      "Automated weekly grocery lists",
      "Customized BTF recipes",
      "Allergy & intolerance filters",
      "GI-symptom-responsive adjustments",
      "Limited RD messaging",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Full Convenience",
    stars: 3,
    price: "$79",
    priceNote: "per month",
    description: "The complete BlendWise experience with premium features.",
    features: [
      "Everything in Personalized Automation",
      "Grocery delivery integration",
      "Unlimited RD messaging",
      "Priority scheduling",
      "Caregiver mode",
      "Advanced analytics dashboard",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Plans That Fit Your Needs
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start with insurance-billable RD care, then add automation and
            convenience as you need it. All plans include clinical supervision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-8 border-2 transition ${
                tier.highlighted
                  ? "border-brand-600 bg-brand-50/50 shadow-xl shadow-brand-600/10 scale-105"
                  : "border-gray-200 bg-white hover:border-brand-200"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: tier.stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-brand-500 text-brand-500" />
                ))}
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-1">{tier.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{tier.description}</p>

              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">{tier.price}</span>
                <span className="text-gray-500 text-sm ml-1">{tier.priceNote}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`block text-center py-3 rounded-xl font-semibold transition ${
                  tier.highlighted
                    ? "bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-600/25"
                    : "bg-gray-100 text-gray-700 hover:bg-brand-50 hover:text-brand-600"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
