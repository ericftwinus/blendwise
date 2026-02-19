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
    feedingGoal,
    count = 3,
  } = body;

  const prompt = `You are a Registered Dietitian specializing in blenderized tube feedings (BTF). Generate ${count} unique BTF recipes.

Patient profile:
- Nutrient targets: ${nutrientTargets ? JSON.stringify(nutrientTargets) : "Standard adult (1800-2000 kcal, 65-80g protein)"}
- Food allergies: ${allergies || "None reported"}
- Food intolerances: ${intolerances || "None reported"}
- Dietary preferences: ${dietaryPreferences?.length ? dietaryPreferences.join(", ") : "No restrictions"}
- Current GI symptoms: ${giSymptoms?.length ? giSymptoms.join(", ") : "None"}
- Feeding goal: ${feedingGoal || "General BTF"}

Requirements:
- Each recipe must blend to a smooth consistency safe for tube feeding
- Include specific measurements in grams or mL
- Target 300-550 calories per recipe depending on daily needs
- Ensure adequate protein per recipe
- If patient has diarrhea, favor soluble fiber (oats, banana, applesauce)
- If patient has constipation, include more insoluble fiber
- If patient has reflux/GERD, avoid acidic/spicy ingredients
- Avoid ALL listed allergens completely
- Respect all dietary preferences

Return a JSON array of recipes. Each recipe must have exactly these fields:
{
  "name": "string",
  "description": "string (1-2 sentences)",
  "calories": number,
  "protein": number,
  "volume_ml": number,
  "prep_time": "string",
  "tags": ["string"],
  "ingredients": [{"name": "string", "amount": "string"}],
  "instructions": "string (step-by-step, separated by newlines)"
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

    // Parse the JSON from the response (handle markdown code blocks)
    let recipes;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      recipes = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return NextResponse.json({ error: "Failed to parse recipes" }, { status: 500 });
    }

    return NextResponse.json({ recipes });
  } catch (error) {
    console.error("Recipe generation error:", error);
    return NextResponse.json({ error: "Failed to generate recipes" }, { status: 500 });
  }
}
