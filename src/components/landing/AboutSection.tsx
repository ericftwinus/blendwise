import { Award, BookOpen, Heart, Shield, Lightbulb, Accessibility, Users } from "lucide-react";

const values = [
  { icon: Shield, label: "Autonomy" },
  { icon: Heart, label: "Safety" },
  { icon: BookOpen, label: "Evidence-Based Care" },
  { icon: Accessibility, label: "Accessibility" },
  { icon: Award, label: "Dignity" },
  { icon: Lightbulb, label: "Innovation" },
  { icon: Users, label: "Community" },
];

export default function AboutSection() {
  return (
    <section id="about" className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Built by Experts Who Understand
            </h2>
            <p className="text-gray-600 mb-4">
              BlendWise was founded by a Registered Dietitian with{" "}
              <strong>15 years of clinical experience</strong> and specialty
              certifications in <strong>nutrition support</strong> and{" "}
              <strong>oncology nutrition</strong>.
            </p>
            <p className="text-gray-600 mb-4">
              After years of seeing patients struggle with commercial formulas
              and lack access to safe, structured guidance for homemade
              blenderized tube feedings, BlendWise was created to fill that gap.
            </p>
            <p className="text-gray-600 mb-6">
              BlendWise is the first platform to combine RD oversight,
              personalized BTF planning, automated grocery lists,
              GI-symptom-responsive adjustments, and family-integrated meal
              planning — all in one place.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-2">Our Mission</h3>
            <p className="text-gray-600 mb-6">
              BlendWise empowers individuals who rely on tube feedings to safely
              prepare their own homemade blenderized tube feedings — restoring
              autonomy, dignity, and control over their nutrition.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center lg:text-left">
              Our Core Values
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {values.map((value) => (
                <div
                  key={value.label}
                  className="flex flex-col items-center text-center bg-white rounded-xl p-5 border border-gray-100 hover:border-brand-200 hover:shadow-sm transition"
                >
                  <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mb-3">
                    <value.icon className="w-6 h-6 text-brand-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {value.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-brand-600 rounded-xl p-6 text-white">
              <h4 className="font-semibold text-lg mb-2">Ideal Referral Partners</h4>
              <ul className="space-y-1 text-sm text-brand-100">
                <li>- Speech-Language Pathologists (SLPs)</li>
                <li>- Outpatient oncology clinics</li>
                <li>- GI & dysphagia specialists</li>
                <li>- Home health agencies</li>
                <li>- Pediatric outpatient centers</li>
                <li>- Primary care & family medicine</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
