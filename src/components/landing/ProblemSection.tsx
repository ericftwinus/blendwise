import { AlertTriangle, Frown, HelpCircle, Ban, Pill, Users } from "lucide-react";

const problems = [
  {
    icon: Pill,
    title: "GI Intolerance",
    description: "Many tube-fed individuals experience bloating, diarrhea, or nausea from commercial formulas.",
  },
  {
    icon: Ban,
    title: "Limited Formula Variety",
    description: "Commercial options are restrictive, leaving little room for personal preference or dietary needs.",
  },
  {
    icon: HelpCircle,
    title: "No Structured Guidance",
    description: "Most healthcare providers lack training in homemade BTF, leaving patients without safe direction.",
  },
  {
    icon: AlertTriangle,
    title: "Safety Concerns",
    description: "Fear of tube clogging, nutritional inadequacy, or unsafe blends prevents many from trying BTF.",
  },
  {
    icon: Frown,
    title: "Emotional Isolation",
    description: "Tube-fed individuals often feel disconnected during family meals and social eating situations.",
  },
  {
    icon: Users,
    title: "Overwhelmed Caregivers",
    description: "Meal planning and grocery shopping for tube feedings adds stress for families and caregivers.",
  },
];

export default function ProblemSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            The Challenges You Face
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Many tube-fed individuals and their caregivers struggle with these
            common barriers. BlendWise was built to solve every one of them.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((problem) => (
            <div
              key={problem.title}
              className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-brand-200 hover:shadow-md transition"
            >
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <problem.icon className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {problem.title}
              </h3>
              <p className="text-gray-600 text-sm">{problem.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
