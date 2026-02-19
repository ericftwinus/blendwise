import {
  ClipboardCheck,
  Calculator,
  GitFork,
  ShoppingCart,
  Truck,
  Stethoscope,
  Activity,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: ClipboardCheck,
    title: "Initial RD Assessment",
    description:
      "A comprehensive evaluation by a Registered Dietitian determines your appropriateness for BTF, including medical history, GI symptoms, allergies, dietary preferences, feeding regimen, and safety considerations.",
    detail: "Insurance-billable MNT or out-of-pocket payment available.",
  },
  {
    number: "02",
    icon: Calculator,
    title: "Personalized Nutrient Targets",
    description:
      "Receive your RD-generated Estimated Nutrient Needs (ENN) — personalized targets for calories, protein, carbs, fat, fluids, fiber, micronutrients, and a feeding schedule.",
    detail: "This becomes the foundation for your recipes and grocery lists.",
  },
  {
    number: "03",
    icon: GitFork,
    title: "Choose Your Path",
    description:
      "Decide the approach that fits your life: fully homemade BTF, a hybrid approach combining commercial formula with BTF, or supplemental BTF alongside your current regimen.",
    detail: "BlendWise supports all three pathways.",
  },
  {
    number: "04",
    icon: ShoppingCart,
    title: "Automated Grocery Lists",
    description:
      "Get weekly grocery lists generated from your nutrient targets, allergies, dietary preferences, GI symptoms, and feeding volume limits. Modify ingredients and save favorites.",
    detail: "Smart adjustments based on your symptom data.",
  },
  {
    number: "05",
    icon: Truck,
    title: "Optional Grocery Delivery",
    description:
      "One-click ordering through Instacart, Amazon Fresh, or Walmart makes BTF accessible and convenient — groceries delivered right to your door.",
    detail: "Coming soon with partner integrations.",
  },
  {
    number: "06",
    icon: Stethoscope,
    title: "RD Follow-Ups",
    description:
      "1-week follow-up to assess tolerance, monthly check-ins thereafter, and additional messaging based on your subscription tier. Your RD stays with you on the journey.",
    detail: "Insurance or out-of-pocket payment applies.",
  },
  {
    number: "07",
    icon: Activity,
    title: "Weight & Symptom Tracking",
    description:
      "Track weight trends, GI symptoms, intake consistency, and recipe tolerance. This data helps your RD adjust plans safely and quickly.",
    detail: "Data-driven adjustments for better outcomes.",
  },
];

export default function WorkflowSection() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How BlendWise Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A clinically supervised, step-by-step process that takes you from
            assessment to personalized, safe tube feedings at home.
          </p>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-brand-200 -translate-x-1/2" />

          <div className="space-y-8 md:space-y-12">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className={`flex flex-col md:flex-row items-center gap-6 md:gap-12 ${
                  i % 2 === 1 ? "md:flex-row-reverse" : ""
                }`}
              >
                <div className={`flex-1 ${i % 2 === 1 ? "md:text-left" : "md:text-right"}`}>
                  <div
                    className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition ${
                      i % 2 === 1 ? "" : "md:ml-auto"
                    } max-w-lg`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded">
                        STEP {step.number}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{step.description}</p>
                    <p className="text-brand-600 text-xs font-medium">{step.detail}</p>
                  </div>
                </div>

                {/* Center icon */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-14 h-14 bg-brand-600 rounded-full flex items-center justify-center shadow-lg shadow-brand-600/25">
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="flex-1 hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
