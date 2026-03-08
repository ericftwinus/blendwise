export interface ExchangeItem {
  group: string;
  name: string;
  serving: string;
  calories: number;
  protein: number;
  tags: string[];
  avoid_immunocompromised?: boolean;
}

// Master Exchange Chart — Protein Foods
const proteinFoods: ExchangeItem[] = [
  { group: "Protein Foods", name: "Chicken breast (cooked)", serving: "1 oz (28g)", calories: 46, protein: 9, tags: ["gluten_free", "dairy_free"] },
  { group: "Protein Foods", name: "Turkey breast (cooked)", serving: "1 oz (28g)", calories: 44, protein: 8, tags: ["gluten_free", "dairy_free"] },
  { group: "Protein Foods", name: "Salmon (cooked)", serving: "1 oz (28g)", calories: 58, protein: 7, tags: ["gluten_free", "dairy_free"] },
  { group: "Protein Foods", name: "Egg (whole, cooked)", serving: "1 large", calories: 72, protein: 6, tags: ["gluten_free", "dairy_free", "egg_allergen"] },
  { group: "Protein Foods", name: "Egg whites (cooked)", serving: "2 large", calories: 34, protein: 7, tags: ["gluten_free", "dairy_free", "egg_allergen"] },
  { group: "Protein Foods", name: "Tofu (firm)", serving: "3 oz (85g)", calories: 70, protein: 8, tags: ["vegan", "gluten_free", "dairy_free", "soy_allergen"] },
  { group: "Protein Foods", name: "Lentils (cooked)", serving: "1/4 cup", calories: 57, protein: 4, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Protein Foods", name: "Black beans (cooked)", serving: "1/4 cup", calories: 57, protein: 4, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Protein Foods", name: "Greek yogurt (plain)", serving: "1/4 cup", calories: 33, protein: 6, tags: ["gluten_free", "dairy_allergen"] },
  { group: "Protein Foods", name: "Cottage cheese (low-fat)", serving: "1/4 cup", calories: 41, protein: 7, tags: ["gluten_free", "dairy_allergen"] },
  { group: "Protein Foods", name: "Beef (lean, cooked)", serving: "1 oz (28g)", calories: 55, protein: 8, tags: ["gluten_free", "dairy_free"] },
  { group: "Protein Foods", name: "Pork loin (cooked)", serving: "1 oz (28g)", calories: 46, protein: 8, tags: ["gluten_free", "dairy_free"] },
  { group: "Protein Foods", name: "Shrimp (cooked)", serving: "1 oz (28g)", calories: 28, protein: 6, tags: ["gluten_free", "dairy_free", "shellfish_allergen"] },
  { group: "Protein Foods", name: "Chickpeas (cooked)", serving: "1/4 cup", calories: 67, protein: 4, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Protein Foods", name: "Hemp seeds", serving: "1 tbsp", calories: 57, protein: 3, tags: ["vegan", "gluten_free", "dairy_free", "nut_free"] },
];

// Master Exchange Chart — Starches & Grains
const starches: ExchangeItem[] = [
  { group: "Starches & Grains", name: "Oatmeal (cooked)", serving: "1/3 cup", calories: 55, protein: 2, tags: ["vegan", "dairy_free"] },
  { group: "Starches & Grains", name: "Brown rice (cooked)", serving: "1/3 cup", calories: 72, protein: 1, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Starches & Grains", name: "Quinoa (cooked)", serving: "1/3 cup", calories: 74, protein: 3, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Starches & Grains", name: "Sweet potato (cooked)", serving: "1/4 cup", calories: 27, protein: 0, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Starches & Grains", name: "White potato (cooked)", serving: "1/4 cup", calories: 33, protein: 1, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Starches & Grains", name: "Whole wheat bread", serving: "1/2 slice", calories: 35, protein: 2, tags: ["vegan", "dairy_free", "wheat_allergen"] },
  { group: "Starches & Grains", name: "Corn (cooked)", serving: "1/4 cup", calories: 33, protein: 1, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Starches & Grains", name: "Peas (green, cooked)", serving: "1/4 cup", calories: 31, protein: 2, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Starches & Grains", name: "Millet (cooked)", serving: "1/3 cup", calories: 69, protein: 2, tags: ["vegan", "gluten_free", "dairy_free"] },
];

// Master Exchange Chart — Fruits
const fruits: ExchangeItem[] = [
  { group: "Fruits", name: "Banana", serving: "1/2 medium", calories: 53, protein: 1, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Fruits", name: "Blueberries", serving: "1/4 cup", calories: 21, protein: 0, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Fruits", name: "Avocado", serving: "2 tbsp", calories: 48, protein: 1, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Fruits", name: "Mango (diced)", serving: "1/4 cup", calories: 25, protein: 0, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Fruits", name: "Apple (peeled)", serving: "1/2 medium", calories: 47, protein: 0, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Fruits", name: "Strawberries", serving: "1/4 cup", calories: 12, protein: 0, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Fruits", name: "Peach (canned/cooked)", serving: "1/4 cup", calories: 27, protein: 0, tags: ["vegan", "gluten_free", "dairy_free"] },
];

// Master Exchange Chart — Vegetables
const vegetables: ExchangeItem[] = [
  { group: "Vegetables", name: "Spinach (cooked)", serving: "1/4 cup", calories: 7, protein: 1, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Vegetables", name: "Carrots (cooked)", serving: "1/4 cup", calories: 14, protein: 0, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Vegetables", name: "Zucchini (cooked)", serving: "1/4 cup", calories: 7, protein: 0, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Vegetables", name: "Butternut squash (cooked)", serving: "1/4 cup", calories: 21, protein: 0, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Vegetables", name: "Green beans (cooked)", serving: "1/4 cup", calories: 9, protein: 0, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Vegetables", name: "Broccoli (cooked)", serving: "1/4 cup", calories: 14, protein: 1, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Vegetables", name: "Cauliflower (cooked)", serving: "1/4 cup", calories: 7, protein: 1, tags: ["vegan", "gluten_free", "dairy_free"] },
];

// Master Exchange Chart — Fats
const fats: ExchangeItem[] = [
  { group: "Fats", name: "Olive oil", serving: "1 tsp", calories: 40, protein: 0, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Fats", name: "Coconut oil", serving: "1 tsp", calories: 40, protein: 0, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Fats", name: "Butter", serving: "1 tsp", calories: 34, protein: 0, tags: ["gluten_free", "dairy_allergen"] },
  { group: "Fats", name: "Flaxseed oil", serving: "1 tsp", calories: 40, protein: 0, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Fats", name: "Almond butter", serving: "1 tsp", calories: 33, protein: 1, tags: ["vegan", "gluten_free", "dairy_free", "nut_allergen"] },
  { group: "Fats", name: "Peanut butter", serving: "1 tsp", calories: 31, protein: 1, tags: ["vegan", "gluten_free", "dairy_free", "peanut_allergen"] },
  { group: "Fats", name: "Sunflower seed butter", serving: "1 tsp", calories: 33, protein: 1, tags: ["vegan", "gluten_free", "dairy_free", "nut_free"] },
  { group: "Fats", name: "MCT oil", serving: "1 tsp", calories: 45, protein: 0, tags: ["vegan", "gluten_free", "dairy_free"] },
];

// Module 1: Protein Boosters
const proteinBoosters: ExchangeItem[] = [
  { group: "Protein Boosters", name: "Whey protein isolate", serving: "1 scoop (30g)", calories: 120, protein: 25, tags: ["gluten_free", "dairy_allergen"] },
  { group: "Protein Boosters", name: "Pea protein powder", serving: "1 scoop (30g)", calories: 110, protein: 22, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Protein Boosters", name: "Collagen peptides", serving: "1 scoop (10g)", calories: 35, protein: 9, tags: ["gluten_free", "dairy_free"] },
  { group: "Protein Boosters", name: "Hemp protein powder", serving: "2 tbsp (30g)", calories: 120, protein: 15, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Protein Boosters", name: "Soy protein isolate", serving: "1 scoop (30g)", calories: 95, protein: 23, tags: ["vegan", "gluten_free", "dairy_free", "soy_allergen"] },
  { group: "Protein Boosters", name: "Casein protein", serving: "1 scoop (30g)", calories: 120, protein: 24, tags: ["gluten_free", "dairy_allergen"] },
  { group: "Protein Boosters", name: "Egg white protein powder", serving: "1 scoop (30g)", calories: 110, protein: 24, tags: ["gluten_free", "dairy_free", "egg_allergen"] },
  { group: "Protein Boosters", name: "Nutritional yeast", serving: "2 tbsp", calories: 40, protein: 8, tags: ["vegan", "gluten_free", "dairy_free"] },
];

// Module 2: Calorie Boosters
const calorieBoosters: ExchangeItem[] = [
  { group: "Calorie Boosters", name: "MCT oil", serving: "1 tbsp", calories: 130, protein: 0, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Calorie Boosters", name: "Heavy cream", serving: "1 tbsp", calories: 51, protein: 0, tags: ["gluten_free", "dairy_allergen"] },
  { group: "Calorie Boosters", name: "Coconut cream", serving: "1 tbsp", calories: 50, protein: 0, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Calorie Boosters", name: "Honey", serving: "1 tbsp", calories: 64, protein: 0, tags: ["gluten_free", "dairy_free"], avoid_immunocompromised: true },
  { group: "Calorie Boosters", name: "Maple syrup", serving: "1 tbsp", calories: 52, protein: 0, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Calorie Boosters", name: "Avocado oil", serving: "1 tbsp", calories: 124, protein: 0, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Calorie Boosters", name: "Nut butter (mixed)", serving: "1 tbsp", calories: 98, protein: 3, tags: ["vegan", "gluten_free", "dairy_free", "nut_allergen"] },
  { group: "Calorie Boosters", name: "Tahini", serving: "1 tbsp", calories: 89, protein: 3, tags: ["vegan", "gluten_free", "dairy_free", "sesame_allergen"] },
];

// Module 3: Functional Additives
const functionalAdditives: ExchangeItem[] = [
  { group: "Functional Additives", name: "Probiotic powder", serving: "1 capsule/scoop", calories: 5, protein: 0, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Functional Additives", name: "Fiber supplement (psyllium)", serving: "1 tsp", calories: 10, protein: 0, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Functional Additives", name: "Ground flaxseed", serving: "1 tbsp", calories: 37, protein: 1, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Functional Additives", name: "Chia seeds", serving: "1 tbsp", calories: 58, protein: 2, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Functional Additives", name: "Turmeric powder", serving: "1/4 tsp", calories: 2, protein: 0, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Functional Additives", name: "Ginger (fresh, grated)", serving: "1/2 tsp", calories: 2, protein: 0, tags: ["vegan", "gluten_free", "dairy_free"] },
  { group: "Functional Additives", name: "Multivitamin liquid", serving: "per label", calories: 10, protein: 0, tags: ["gluten_free", "dairy_free"] },
  { group: "Functional Additives", name: "Calcium + Vitamin D powder", serving: "per label", calories: 5, protein: 0, tags: ["gluten_free"] },
  { group: "Functional Additives", name: "Iron supplement liquid", serving: "per label", calories: 5, protein: 0, tags: ["gluten_free", "dairy_free"] },
];

export const MASTER_EXCHANGE_LIST: ExchangeItem[] = [
  ...proteinFoods,
  ...starches,
  ...fruits,
  ...vegetables,
  ...fats,
  ...proteinBoosters,
  ...calorieBoosters,
  ...functionalAdditives,
];

export const EXCHANGE_GROUPS = [
  "Protein Foods",
  "Starches & Grains",
  "Fruits",
  "Vegetables",
  "Fats",
  "Protein Boosters",
  "Calorie Boosters",
  "Functional Additives",
] as const;

export const RESTRICTION_OPTIONS = [
  { key: "vegan", label: "Vegan" },
  { key: "dairy_free", label: "Dairy-Free" },
  { key: "gluten_free", label: "Gluten-Free" },
  { key: "nut_free", label: "Nut-Free" },
  { key: "egg_free", label: "Egg-Free" },
  { key: "soy_free", label: "Soy-Free" },
  { key: "peanut_free", label: "Peanut-Free" },
  { key: "shellfish_free", label: "Shellfish-Free" },
  { key: "sesame_free", label: "Sesame-Free" },
  { key: "low_fodmap", label: "Low-FODMAP" },
  { key: "immunocompromised", label: "Immunocompromised" },
] as const;
