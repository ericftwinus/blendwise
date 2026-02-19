"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Check,
  Truck,
  RefreshCw,
  Download,
  Sparkles,
  Loader2,
} from "lucide-react";

interface GroceryItem {
  id: number;
  name: string;
  category: string;
  quantity: string;
  checked: boolean;
}

export default function GroceryPage() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load from Supabase on mount
  useEffect(() => {
    async function loadList() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("grocery_lists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data?.items) {
        try {
          const parsed = typeof data.items === "string" ? JSON.parse(data.items) : data.items;
          setItems(parsed.map((item: any, i: number) => ({
            id: i + 1,
            name: item.name,
            category: item.category || "Other",
            quantity: item.quantity || "1",
            checked: item.checked || false,
          })));
        } catch {
          // ignore parse errors
        }
      }
      setLoading(false);
    }
    loadList();
  }, []);

  const categories = Array.from(new Set(items.map((i) => i.category)));
  const checkedCount = items.filter((i) => i.checked).length;

  function toggleItem(id: number) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))
    );
  }

  function removeItem(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function addItem() {
    if (!newItem.trim()) return;
    setItems((prev) => [
      ...prev,
      { id: Date.now(), name: newItem.trim(), category: "Other", quantity: "1", checked: false },
    ]);
    setNewItem("");
  }

  async function saveList() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    await supabase.from("grocery_lists").upsert({
      user_id: user.id,
      week_start: weekStart.toISOString().split("T")[0],
      items: JSON.stringify(items.map(({ name, category, quantity, checked }) => ({ name, category, quantity, checked }))),
      updated_at: new Date().toISOString(),
    });
  }

  // Auto-save when items change (debounced)
  useEffect(() => {
    if (loading || items.length === 0) return;
    const timer = setTimeout(saveList, 1000);
    return () => clearTimeout(timer);
  }, [items, loading]);

  async function generateList() {
    setGenerating(true);
    setError("");

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
      const res = await fetch("/api/generate-grocery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nutrientTargets: targets,
          allergies: assessment?.allergies,
          intolerances: assessment?.intolerances,
          dietaryPreferences: assessment?.dietary_preferences,
          giSymptoms: assessment?.gi_symptoms,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else if (data.items) {
        setItems(data.items.map((item: any, i: number) => ({
          id: i + 1,
          name: item.name,
          category: item.category || "Other",
          quantity: item.quantity || "1",
          checked: false,
        })));
      }
    } catch {
      setError("Failed to generate grocery list. Please try again.");
    }
    setGenerating(false);
  }

  function exportList() {
    const text = categories.map((cat) => {
      const catItems = items.filter((i) => i.category === cat);
      return `## ${cat}\n${catItems.map((i) => `- ${i.checked ? "[x]" : "[ ]"} ${i.name} (${i.quantity})`).join("\n")}`;
    }).join("\n\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blendwise-grocery-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-brand-600" />
            Weekly Grocery List
          </h1>
          <p className="text-gray-500 mt-1">
            Auto-generated based on your nutrient targets, allergies, and dietary preferences.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generateList}
            disabled={generating}
            className="flex items-center gap-1.5 text-sm bg-brand-600 text-white px-3 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? "Generating..." : "AI Generate"}
          </button>
          <button
            onClick={exportList}
            disabled={items.length === 0}
            className="flex items-center gap-1.5 text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <>
          {/* Progress */}
          {items.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Shopping Progress</span>
                <span className="text-sm text-gray-500">{checkedCount}/{items.length} items</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-brand-600 h-2 rounded-full transition-all"
                  style={{ width: `${items.length ? (checkedCount / items.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Add item */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder="Add a custom item..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm"
            />
            <button
              onClick={addItem}
              className="flex items-center gap-1 bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="font-medium">No grocery list yet</p>
              <p className="text-sm">Click &quot;AI Generate&quot; to create a personalized list, or add items manually.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map((category) => (
                <div key={category}>
                  <h2 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">
                    {category}
                  </h2>
                  <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                    {items
                      .filter((i) => i.category === category)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                        >
                          <button
                            onClick={() => toggleItem(item.id)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${
                              item.checked
                                ? "bg-brand-600 border-brand-600"
                                : "border-gray-300 hover:border-brand-400"
                            }`}
                          >
                            {item.checked && <Check className="w-3 h-3 text-white" />}
                          </button>
                          <span className={`flex-1 text-sm ${item.checked ? "text-gray-400 line-through" : "text-gray-700"}`}>
                            {item.name}
                          </span>
                          <span className="text-xs text-gray-400">{item.quantity}</span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-gray-300 hover:text-red-500 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Delivery CTA */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <Truck className="w-8 h-8" />
          <div>
            <h3 className="text-lg font-semibold">Get Groceries Delivered</h3>
            <p className="text-sm text-brand-100">
              Available with Tier 3 subscription — one-click ordering through Instacart, Amazon Fresh, or Walmart.
            </p>
          </div>
        </div>
        <button className="bg-white text-brand-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-50 transition">
          Upgrade to Full Convenience
        </button>
      </div>
    </div>
  );
}
