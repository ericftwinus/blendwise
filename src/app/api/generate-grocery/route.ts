import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    nutrientTargets,
    allergies,
    intolerances,
    dietaryPreferences,
    giSymptoms,
  } = body;

  const prompt = `You are a Registered Dietitian creating a weekly grocery list for a patient who uses blenderized tube feedings (BTF).

Patient profile:
- Nutrient targets: ${nutrientTargets ? JSON.stringify(nutrientTargets) : "Standard adult (1800-2000 kcal, 65-80g protein)"}
- Food allergies: ${allergies || "None reported"}
- Food intolerances: ${intolerances || "None reported"}
- Dietary preferences: ${dietaryPreferences?.length ? dietaryPreferences.join(", ") : "No restrictions"}
- Current GI symptoms: ${giSymptoms?.length ? giSymptoms.join(", ") : "None"}

Requirements:
- Generate a 7-day grocery list with items organized by category
- Include enough variety for diverse BTF recipes
- Quantities should cover one week of tube feedings (~3-5 blends per day)
- If patient has diarrhea, emphasize soluble fiber foods (oats, bananas, applesauce, white rice)
- If patient has constipation, include high-fiber foods
- Avoid ALL listed allergens completely
- Respect dietary preferences
- Include categories: Fruits, Vegetables, Protein, Dairy, Grains, Oils & Fats, Staples, Supplements

Return a JSON array of grocery items. Each item must have exactly these fields:
{
  "name": "string",
  "category": "string",
  "quantity": "string"
}

Return ONLY the JSON array, no other text.`;

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-3-mini-fast",
        messages: [
          { role: "system", content: "You are a clinical nutrition expert. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("xAI API error:", err);
      return NextResponse.json({ error: "AI service error" }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    let items;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      items = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return NextResponse.json({ error: "Failed to parse grocery list" }, { status: 500 });
    }

    // Save to Supabase
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    await supabase.from("grocery_lists").upsert({
      user_id: user.id,
      week_start: weekStart.toISOString().split("T")[0],
      items: JSON.stringify(items),
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Grocery generation error:", error);
    return NextResponse.json({ error: "Failed to generate grocery list" }, { status: 500 });
  }
}
