import { ExchangeItem, MASTER_EXCHANGE_LIST, EXCHANGE_GROUPS } from "./exchangeData";

// Map restriction keys to the allergen tags they should filter out
const RESTRICTION_TO_ALLERGEN: Record<string, string> = {
  dairy_free: "dairy_allergen",
  nut_free: "nut_allergen",
  egg_free: "egg_allergen",
  soy_free: "soy_allergen",
  peanut_free: "peanut_allergen",
  shellfish_free: "shellfish_allergen",
  sesame_free: "sesame_allergen",
  gluten_free: "wheat_allergen",
};

// Tags that an item must HAVE to be included when restriction is active
const RESTRICTION_REQUIRES_TAG: Record<string, string> = {
  vegan: "vegan",
  gluten_free: "gluten_free",
  dairy_free: "dairy_free",
};

export interface PatientPlan {
  safeItems: ExchangeItem[];
  groupedItems: Record<string, ExchangeItem[]>;
  dailyInstruction: string;
  proteinServingsPerDay: number;
  removedCount: number;
}

export function generatePatientPlan(
  restrictions: string[],
  masterList: ExchangeItem[] = MASTER_EXCHANGE_LIST
): PatientPlan {
  // Step 1: Filter the master list
  let filtered = masterList.filter((item) => {
    // Check immunocompromised
    if (restrictions.includes("immunocompromised") && item.avoid_immunocompromised) {
      return false;
    }

    // Check allergen restrictions — remove items WITH the allergen tag
    for (const restriction of restrictions) {
      const allergenTag = RESTRICTION_TO_ALLERGEN[restriction];
      if (allergenTag && item.tags.includes(allergenTag)) {
        return false;
      }
    }

    // Check requirement restrictions — item must HAVE the required tag
    for (const restriction of restrictions) {
      const requiredTag = RESTRICTION_REQUIRES_TAG[restriction];
      if (requiredTag && !item.tags.includes(requiredTag)) {
        return false;
      }
    }

    return true;
  });

  // Step 2: Protein Replacement Formula
  // Base: 4 protein servings/day
  let proteinServings = 4;
  if (restrictions.includes("dairy_free")) proteinServings += 1;
  if (restrictions.includes("gluten_free")) proteinServings += 1;
  if (restrictions.includes("vegan")) proteinServings += 2;

  // Step 3: Build daily instruction
  const parts: string[] = [];
  parts.push(`Choose ${proteinServings} protein foods per day`);
  parts.push("3-4 starches/grains");
  parts.push("2-3 fruits");
  parts.push("2-3 vegetables");
  parts.push("2-3 fats");

  if (restrictions.length > 0) {
    const labels = restrictions.map((r) =>
      r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    );
    parts.push(`Restrictions: ${labels.join(", ")}`);
  }

  const dailyInstruction = parts.join(" | ");

  // Group the filtered items
  const groupedItems: Record<string, ExchangeItem[]> = {};
  for (const group of EXCHANGE_GROUPS) {
    const items = filtered.filter((i) => i.group === group);
    if (items.length > 0) {
      groupedItems[group] = items;
    }
  }

  return {
    safeItems: filtered,
    groupedItems,
    dailyInstruction,
    proteinServingsPerDay: proteinServings,
    removedCount: masterList.length - filtered.length,
  };
}
