import { getServerUser } from "@/lib/firebase/server-auth";
import { NextRequest, NextResponse } from "next/server";

const NPPES_API = "https://npiregistry.cms.hhs.gov/api/?version=2.1";

export async function GET(request: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.trim();
  const state = searchParams.get("state")?.trim();
  const city = searchParams.get("city")?.trim();
  const requestedLimit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
  }

  const params = new URLSearchParams({
    version: "2.1",
    enumeration_type: "NPI-1",
    limit: String(Math.min(requestedLimit * 3, 50)),
  });

  if (name.includes(" ")) {
    const parts = name.split(" ");
    params.set("first_name", parts[0] + "*");
    params.set("last_name", parts.slice(1).join(" ") + "*");
  } else {
    params.set("last_name", name + "*");
  }

  if (state) params.set("state", state.toUpperCase());
  if (city) params.set("city", city.toUpperCase());

  try {
    const res = await fetch(`${NPPES_API}&${params.toString()}`, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) return NextResponse.json({ error: "NPPES API error" }, { status: 502 });

    const data = await res.json();
    if (!data.results || data.result_count === 0) return NextResponse.json({ results: [] });

    const ALLOWED_CREDENTIALS = /\b(M\.?D\.?|D\.?O\.?|N\.?P\.?|P\.?A\.?|PA-C|APRN|DNP|FNP|FNP-C|FNP-BC|ANP|AGNP)\b/i;
    const ALLOWED_TAXONOMIES = /physician|nurse practitioner|physician assistant/i;

    const allResults = data.results
      .filter((r: any) => {
        const credential = (r.basic?.credential || "").toUpperCase();
        const taxonomies = r.taxonomies || [];
        const taxonomyDesc = taxonomies.map((t: any) => t.desc || "").join(" ");
        return ALLOWED_CREDENTIALS.test(credential) || ALLOWED_TAXONOMIES.test(taxonomyDesc);
      })
      .map((r: any) => {
        const basic = r.basic || {};
        const taxonomies = r.taxonomies || [];
        const primaryTaxonomy = taxonomies.find((t: any) => t.primary) || taxonomies[0] || {};
        const addresses = r.addresses || [];
        const practiceAddr = addresses.find((a: any) => a.address_purpose === "PRACTICE") || addresses.find((a: any) => a.address_purpose === "MAILING") || {};

        return {
          npi: r.number || "",
          firstName: basic.first_name || "",
          lastName: basic.last_name || "",
          credential: basic.credential || "",
          taxonomy: primaryTaxonomy.desc || "",
          practiceName: basic.organization_name || primaryTaxonomy.desc || "",
          phone: practiceAddr.telephone_number || "",
          fax: practiceAddr.fax_number || "",
          address: {
            line1: practiceAddr.address_1 || "",
            city: practiceAddr.city || "",
            state: practiceAddr.state || "",
            zip: (practiceAddr.postal_code || "").slice(0, 5),
          },
        };
      });

    return NextResponse.json({ results: allResults.slice(0, requestedLimit) });
  } catch {
    return NextResponse.json({ error: "Failed to reach NPPES API" }, { status: 502 });
  }
}
