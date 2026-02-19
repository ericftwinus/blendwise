"use client";

import { useState } from "react";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Check,
  Truck,
  RefreshCw,
  Download,
} from "lucide-react";

interface GroceryItem {
  id: number;
  name: string;
  category: string;
  quantity: string;
  checked: boolean;
}

const initialItems: GroceryItem[] = [
  { id: 1, name: "Rolled oats", category: "Grains", quantity: "1 lb", checked: false },
  { id: 2, name: "Brown rice", category: "Grains", quantity: "2 lbs", checked: false },
  { id: 3, name: "Whole wheat bread", category: "Grains", quantity: "1 loaf", checked: false },
  { id: 4, name: "Bananas", category: "Fruits", quantity: "1 bunch", checked: false },
  { id: 5, name: "Blueberries", category: "Fruits", quantity: "1 pint", checked: false },
  { id: 6, name: "Avocados", category: "Fruits", quantity: "3", checked: false },
  { id: 7, name: "Spinach", category: "Vegetables", quantity: "10 oz bag", checked: false },
  { id: 8, name: "Sweet potatoes", category: "Vegetables", quantity: "3 lbs", checked: false },
  { id: 9, name: "Carrots", category: "Vegetables", quantity: "1 lb bag", checked: false },
  { id: 10, name: "Chicken breast", category: "Protein", quantity: "2 lbs", checked: false },
  { id: 11, name: "Greek yogurt", category: "Dairy", quantity: "32 oz", checked: false },
  { id: 12, name: "Whole milk", category: "Dairy", quantity: "1 gallon", checked: false },
  { id: 13, name: "Eggs", category: "Protein", quantity: "1 dozen", checked: false },
  { id: 14, name: "Olive oil", category: "Oils & Fats", quantity: "1 bottle", checked: false },
  { id: 15, name: "Peanut butter", category: "Oils & Fats", quantity: "16 oz jar", checked: false },
  { id: 16, name: "Chia seeds", category: "Supplements", quantity: "12 oz bag", checked: false },
  { id: 17, name: "Chicken broth (low sodium)", category: "Staples", quantity: "32 oz", checked: false },
  { id: 18, name: "Honey", category: "Staples", quantity: "12 oz", checked: false },
];

export default function GroceryPage() {
  const [items, setItems] = useState<GroceryItem[]>(initialItems);
  const [newItem, setNewItem] = useState("");

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
      {
        id: Date.now(),
        name: newItem.trim(),
        category: "Other",
        quantity: "1",
        checked: false,
      },
    ]);
    setNewItem("");
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
          <button className="flex items-center gap-1.5 text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition">
            <RefreshCw className="w-4 h-4" /> Regenerate
          </button>
          <button className="flex items-center gap-1.5 text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Progress */}
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

      {/* Grocery list by category */}
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
                    <span
                      className={`flex-1 text-sm ${
                        item.checked ? "text-gray-400 line-through" : "text-gray-700"
                      }`}
                    >
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
