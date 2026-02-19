import { Check, X, Minus } from "lucide-react";

const rows = [
  { feature: "Supports homemade BTF", blendwise: true, commercial: false, blogs: "partial", rdClinics: "rare" },
  { feature: "Personalized RD assessment", blendwise: true, commercial: false, blogs: false, rdClinics: "sometimes" },
  { feature: "15 years RD experience + nutrition support certification", blendwise: true, commercial: false, blogs: false, rdClinics: "varies" },
  { feature: "Customized nutrient targets (ENN)", blendwise: true, commercial: false, blogs: false, rdClinics: "sometimes" },
  { feature: "Automated grocery list", blendwise: true, commercial: false, blogs: false, rdClinics: false },
  { feature: "Allergy/intolerance adjustments", blendwise: true, commercial: "partial", blogs: "partial", rdClinics: true },
  { feature: "GI-symptom-responsive adjustments", blendwise: true, commercial: false, blogs: false, rdClinics: "manual" },
  { feature: "Hybrid feeding options", blendwise: true, commercial: false, blogs: false, rdClinics: "rare" },
  { feature: "Grocery delivery integration", blendwise: true, commercial: false, blogs: false, rdClinics: false },
  { feature: "Educational videos", blendwise: true, commercial: false, blogs: false, rdClinics: "rare" },
  { feature: "Weight & symptom tracking", blendwise: true, commercial: false, blogs: false, rdClinics: false },
  { feature: "Insurance-billable MNT", blendwise: true, commercial: false, blogs: false, rdClinics: "sometimes" },
  { feature: "Caregiver mode", blendwise: true, commercial: false, blogs: false, rdClinics: false },
  { feature: "Advanced analytics", blendwise: true, commercial: false, blogs: false, rdClinics: false },
];

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="w-5 h-5 text-brand-600 mx-auto" />;
  if (value === false) return <X className="w-5 h-5 text-gray-300 mx-auto" />;
  return <span className="text-xs text-gray-500 capitalize">{value}</span>;
}

export default function ComparisonSection() {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why BlendWise Is Different
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            No other platform combines RD oversight, personalized BTF planning,
            automated grocery lists, and symptom-responsive adjustments.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-sm font-semibold text-gray-600 px-6 py-4">
                  Feature
                </th>
                <th className="text-center text-sm font-semibold text-brand-600 px-4 py-4 bg-brand-50">
                  BlendWise
                </th>
                <th className="text-center text-sm font-semibold text-gray-600 px-4 py-4">
                  Commercial BTF
                </th>
                <th className="text-center text-sm font-semibold text-gray-600 px-4 py-4">
                  Recipe Blogs
                </th>
                <th className="text-center text-sm font-semibold text-gray-600 px-4 py-4">
                  Traditional RD
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? "" : "bg-gray-50/50"}>
                  <td className="text-sm text-gray-700 px-6 py-3 font-medium">
                    {row.feature}
                  </td>
                  <td className="text-center px-4 py-3 bg-brand-50/50">
                    <CellValue value={row.blendwise} />
                  </td>
                  <td className="text-center px-4 py-3">
                    <CellValue value={row.commercial} />
                  </td>
                  <td className="text-center px-4 py-3">
                    <CellValue value={row.blogs} />
                  </td>
                  <td className="text-center px-4 py-3">
                    <CellValue value={row.rdClinics} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
