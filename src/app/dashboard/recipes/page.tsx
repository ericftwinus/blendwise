"use client";

import { useState } from "react";
import { Salad, Clock, Flame, Droplets, Search, Filter } from "lucide-react";

const sampleRecipes = [
  {
    id: 1,
    name: "Balanced Morning Blend",
    description: "A nutrient-dense morning blend with oats, banana, peanut butter, and milk for sustained energy.",
    calories: 450,
    protein: 18,
    volume: "360 mL",
    prepTime: "10 min",
    ingredients: ["Rolled oats", "Banana", "Peanut butter", "Whole milk", "Olive oil", "Honey"],
    tags: ["Breakfast", "High-calorie"],
  },
  {
    id: 2,
    name: "Green Power Blend",
    description: "A vitamin-rich blend with spinach, avocado, chicken broth, and sweet potato.",
    calories: 380,
    protein: 15,
    volume: "340 mL",
    prepTime: "15 min",
    ingredients: ["Spinach", "Avocado", "Sweet potato", "Chicken broth", "Olive oil", "Lemon juice"],
    tags: ["Lunch", "High-fiber"],
  },
  {
    id: 3,
    name: "Protein Recovery Blend",
    description: "High-protein blend with Greek yogurt, chicken, rice, and carrots for muscle recovery.",
    calories: 520,
    protein: 32,
    volume: "400 mL",
    prepTime: "20 min",
    ingredients: ["Cooked chicken breast", "Greek yogurt", "White rice", "Carrots", "Olive oil", "Chicken broth"],
    tags: ["Dinner", "High-protein"],
  },
  {
    id: 4,
    name: "Soothing GI Blend",
    description: "Gentle blend designed for sensitive stomachs with soluble fiber and easy-to-digest ingredients.",
    calories: 350,
    protein: 14,
    volume: "320 mL",
    prepTime: "10 min",
    ingredients: ["White rice", "Banana", "Applesauce", "Chicken broth", "MCT oil"],
    tags: ["Any meal", "GI-friendly", "Low-fiber"],
  },
  {
    id: 5,
    name: "Overnight Oat Blend",
    description: "Prep-ahead blend with overnight oats, blueberries, and chia seeds for easy mornings.",
    calories: 420,
    protein: 16,
    volume: "350 mL",
    prepTime: "5 min + overnight",
    ingredients: ["Rolled oats", "Blueberries", "Chia seeds", "Whole milk", "Greek yogurt", "Maple syrup"],
    tags: ["Breakfast", "Prep-ahead"],
  },
  {
    id: 6,
    name: "Mediterranean Blend",
    description: "Flavorful blend inspired by Mediterranean cuisine with chickpeas, tahini, and roasted veggies.",
    calories: 480,
    protein: 20,
    volume: "380 mL",
    prepTime: "20 min",
    ingredients: ["Chickpeas", "Tahini", "Roasted red pepper", "Olive oil", "Lemon juice", "Vegetable broth"],
    tags: ["Lunch", "Vegan-friendly"],
  },
];

export default function RecipesPage() {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  const allTags = Array.from(new Set(sampleRecipes.flatMap((r) => r.tags)));
  const filtered = sampleRecipes.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.ingredients.some((i) => i.toLowerCase().includes(search.toLowerCase()));
    const matchesTag = !selectedTag || r.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Salad className="w-6 h-6 text-brand-600" />
          BTF Recipes
        </h1>
        <p className="text-gray-500 mt-1">
          Personalized blenderized tube feeding recipes tailored to your nutrient targets and preferences.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes or ingredients..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <button
            onClick={() => setSelectedTag("")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              !selectedTag ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? "" : tag)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                tag === selectedTag ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((recipe) => (
          <div key={recipe.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition group">
            <div className="h-3 bg-gradient-to-r from-brand-500 to-brand-600" />
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {recipe.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium">
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-brand-600 transition">
                {recipe.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">{recipe.description}</p>

              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> {recipe.calories} kcal
                </span>
                <span className="flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5" /> {recipe.volume}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {recipe.prepTime}
                </span>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Ingredients:</p>
                <p className="text-xs text-gray-500">{recipe.ingredients.join(", ")}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Salad className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No recipes match your search</p>
          <p className="text-sm">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  );
}
