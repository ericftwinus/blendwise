"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Salad, Clock, Flame, Droplets, Search, Filter, Sparkles, Loader2, BookmarkPlus, Bookmark } from "lucide-react";

interface Recipe {
  id?: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  volume_ml?: number;
  volume?: string;
  prep_time: string;
  ingredients: { name: string; amount: string }[] | string[];
  instructions?: string;
  tags: string[];
  saved?: boolean;
}

const defaultRecipes: Recipe[] = [
  {
    name: "Balanced Morning Blend",
    description: "A nutrient-dense morning blend with oats, banana, peanut butter, and milk for sustained energy.",
    calories: 450, protein: 18, volume: "360 mL", prep_time: "10 min",
    ingredients: ["Rolled oats", "Banana", "Peanut butter", "Whole milk", "Olive oil", "Honey"],
    tags: ["Breakfast", "High-calorie"],
  },
  {
    name: "Green Power Blend",
    description: "A vitamin-rich blend with spinach, avocado, chicken broth, and sweet potato.",
    calories: 380, protein: 15, volume: "340 mL", prep_time: "15 min",
    ingredients: ["Spinach", "Avocado", "Sweet potato", "Chicken broth", "Olive oil", "Lemon juice"],
    tags: ["Lunch", "High-fiber"],
  },
  {
    name: "Protein Recovery Blend",
    description: "High-protein blend with Greek yogurt, chicken, rice, and carrots.",
    calories: 520, protein: 32, volume: "400 mL", prep_time: "20 min",
    ingredients: ["Cooked chicken breast", "Greek yogurt", "White rice", "Carrots", "Olive oil", "Chicken broth"],
    tags: ["Dinner", "High-protein"],
  },
];

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>(defaultRecipes);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [showSaved, setShowSaved] = useState(false);

  // Load saved recipes from Supabase
  useEffect(() => {
    async function loadSaved() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("saved_recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setSavedRecipes(data.map((r) => ({
          id: r.id,
          name: r.recipe_name,
          description: "",
          calories: r.calories || 0,
          protein: r.protein || 0,
          volume_ml: r.volume_ml,
          prep_time: r.prep_time || "",
          ingredients: r.ingredients || [],
          instructions: r.instructions,
          tags: r.tags || [],
          saved: true,
        })));
      }
    }
    loadSaved();
  }, []);

  async function generateRecipes() {
    setGenerating(true);
    setError("");

    // Fetch user assessment data for personalization
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setGenerating(false); return; }

    const [assessmentRes, targetsRes] = await Promise.all([
      supabase.from("assessments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
      supabase.from("nutrient_targets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
    ]);

    const assessment = assessmentRes.data;
    const targets = targetsRes.data;

    try {
      const res = await fetch("/api/generate-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nutrientTargets: targets,
          allergies: assessment?.allergies,
          intolerances: assessment?.intolerances,
          dietaryPreferences: assessment?.dietary_preferences,
          giSymptoms: assessment?.gi_symptoms,
          feedingGoal: assessment?.feeding_goal,
          count: 6,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else if (data.recipes) {
        setRecipes(data.recipes);
      }
    } catch {
      setError("Failed to generate recipes. Please try again.");
    }
    setGenerating(false);
  }

  async function saveRecipe(recipe: Recipe) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.from("saved_recipes").insert({
      user_id: user.id,
      recipe_name: recipe.name,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions || "",
      calories: recipe.calories,
      protein: recipe.protein,
      volume_ml: recipe.volume_ml || parseInt(recipe.volume?.replace(/\D/g, "") || "0"),
      prep_time: recipe.prep_time,
      tags: recipe.tags,
    }).select().single();

    if (!error && data) {
      setSavedRecipes((prev) => [{
        ...recipe,
        id: data.id,
        saved: true,
      }, ...prev]);
    }
  }

  const displayRecipes = showSaved ? savedRecipes : recipes;
  const allTags = Array.from(new Set(displayRecipes.flatMap((r) => r.tags)));

  const filtered = displayRecipes.filter((r) => {
    const ingredientNames = r.ingredients.map((i) =>
      typeof i === "string" ? i : i.name
    );
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      ingredientNames.some((name) => name.toLowerCase().includes(search.toLowerCase()));
    const matchesTag = !selectedTag || r.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Salad className="w-6 h-6 text-brand-600" />
            BTF Recipes
          </h1>
          <p className="text-gray-500 mt-1">
            Personalized blenderized tube feeding recipes tailored to your nutrient targets and preferences.
          </p>
        </div>
        <button
          onClick={generateRecipes}
          disabled={generating}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {generating ? "Generating..." : "Generate New Recipes"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => { setShowSaved(false); setSelectedTag(""); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            !showSaved ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Generated ({recipes.length})
        </button>
        <button
          onClick={() => { setShowSaved(true); setSelectedTag(""); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
            showSaved ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Bookmark className="w-4 h-4" /> Saved ({savedRecipes.length})
        </button>
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
        {allTags.length > 0 && (
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
        )}
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((recipe, idx) => {
          const ingredientNames = recipe.ingredients.map((i) =>
            typeof i === "string" ? i : `${i.amount} ${i.name}`
          );
          const volumeStr = recipe.volume_ml ? `${recipe.volume_ml} mL` : recipe.volume || "";

          return (
            <div key={recipe.id || idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition group">
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
                {recipe.description && (
                  <p className="text-sm text-gray-500 mb-3">{recipe.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> {recipe.calories} kcal
                  </span>
                  <span className="flex items-center gap-1">
                    <strong>P:</strong> {recipe.protein}g
                  </span>
                  {volumeStr && (
                    <span className="flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5" /> {volumeStr}
                    </span>
                  )}
                  {recipe.prep_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {recipe.prep_time}
                    </span>
                  )}
                </div>

                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Ingredients:</p>
                  <p className="text-xs text-gray-500">{ingredientNames.join(", ")}</p>
                </div>

                {recipe.instructions && (
                  <details className="text-xs text-gray-600 mb-3">
                    <summary className="cursor-pointer font-medium text-brand-600 hover:underline">
                      View Instructions
                    </summary>
                    <p className="mt-2 whitespace-pre-line bg-gray-50 rounded-lg p-3">
                      {recipe.instructions}
                    </p>
                  </details>
                )}

                {!showSaved && (
                  <button
                    onClick={() => saveRecipe(recipe)}
                    className="flex items-center gap-1.5 text-xs text-brand-600 font-medium hover:underline"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" /> Save Recipe
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Salad className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">{showSaved ? "No saved recipes yet" : "No recipes match your search"}</p>
          <p className="text-sm">
            {showSaved
              ? "Generate recipes and save your favorites."
              : "Try adjusting your filters or generate new recipes."}
          </p>
        </div>
      )}
    </div>
  );
}
