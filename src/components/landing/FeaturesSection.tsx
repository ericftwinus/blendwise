import {
  ShieldCheck,
  Salad,
  ShoppingCart,
  Activity,
  Video,
  Users,
  Truck,
  Brain,
  Stethoscope,
  Heart,
  BarChart3,
  Calendar,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "RD-Supervised Safety",
    description:
      "Every plan is overseen by a Registered Dietitian with 15 years of clinical experience and certification in nutrition support.",
  },
  {
    icon: Salad,
    title: "Personalized Recipes",
    description:
      "Custom blenderized tube feeding recipes generated from your exact nutrient targets, allergies, and preferences.",
  },
  {
    icon: ShoppingCart,
    title: "Automated Grocery Lists",
    description:
      "Weekly grocery lists tailored to your plan. Modify ingredients, save favorites, and adjust based on GI symptoms.",
  },
  {
    icon: Activity,
    title: "Symptom Tracking",
    description:
      "Log GI symptoms, weight trends, and intake consistency. Your RD uses this data to adjust plans in real time.",
  },
  {
    icon: Brain,
    title: "GI-Responsive Adjustments",
    description:
      "Experiencing diarrhea? The system automatically shifts to higher soluble fiber foods. Smart, symptom-aware planning.",
  },
  {
    icon: Truck,
    title: "Grocery Delivery",
    description:
      "One-click ordering via Instacart, Amazon Fresh, or Walmart. BTF has never been more convenient.",
  },
  {
    icon: Heart,
    title: "Insurance-Billable MNT",
    description:
      "Your initial assessment and follow-ups can be billed to insurance as Medical Nutrition Therapy.",
  },
  {
    icon: Users,
    title: "Caregiver Mode",
    description:
      "Give family members and caregivers their own access to manage plans, track symptoms, and coordinate care.",
  },
  {
    icon: Video,
    title: "Educational Videos",
    description:
      "Learn blending techniques, food safety, tube care, and more through expert-created video content.",
  },
  {
    icon: Stethoscope,
    title: "Regular RD Follow-Ups",
    description:
      "1-week check-in after starting, monthly follow-ups, and messaging access depending on your tier.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description:
      "Detailed dashboards showing nutrition trends, symptom patterns, and progress over time.",
  },
  {
    icon: Calendar,
    title: "Family Meal Integration",
    description:
      "One grocery list for the whole household — family meals plus tube-feeding blends. Eat together again.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need for Safe BTF
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            BlendWise combines clinical expertise, automation, and convenience
            into one platform — designed specifically for blenderized tube feedings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-gray-50 rounded-xl p-6 border border-gray-100 hover:bg-brand-50 hover:border-brand-200 transition"
            >
              <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-200 transition">
                <feature.icon className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
