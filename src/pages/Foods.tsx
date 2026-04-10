/** Food Database page — USDA + Open Food Facts browseable food encyclopedia */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFoodSearch } from '../hooks/useFoodSearch';
import { browseByCategory } from '../lib/usda';
import type { FoodItem } from '../lib/types';
import { Search, X, ChevronRight, Info, Loader2, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

const FOOD_CATEGORIES = [
  { id: 'fruits', label: 'Fruits', emoji: '🍎' },
  { id: 'vegetables', label: 'Vegetables', emoji: '🥦' },
  { id: 'chicken', label: 'Poultry', emoji: '🍗' },
  { id: 'beef', label: 'Beef & Pork', emoji: '🥩' },
  { id: 'fish salmon', label: 'Seafood', emoji: '🐟' },
  { id: 'milk cheese', label: 'Dairy', emoji: '🧀' },
  { id: 'bread wheat', label: 'Grains', emoji: '🌾' },
  { id: 'rice pasta', label: 'Pasta & Rice', emoji: '🍝' },
  { id: 'beans legumes', label: 'Legumes', emoji: '🫘' },
  { id: 'nuts seeds', label: 'Nuts & Seeds', emoji: '🥜' },
  { id: 'egg', label: 'Eggs', emoji: '🥚' },
  { id: 'olive oil butter', label: 'Fats & Oils', emoji: '🫙' },
  { id: 'apple juice', label: 'Beverages', emoji: '🥤' },
  { id: 'chocolate candy', label: 'Sweets', emoji: '🍫' },
  { id: 'chips snack', label: 'Snacks', emoji: '🍿' },
  { id: 'pizza burger fast food', label: 'Fast Food', emoji: '🍔' },
];

const NUTRISCORE_CLASS: Record<string, string> = {
  A: 'nutriscore-a', B: 'nutriscore-b', C: 'nutriscore-c', D: 'nutriscore-d', E: 'nutriscore-e',
};

function NutritionPanel({ food, onClose }: { food: FoodItem; onClose: () => void }) {
  const [unit, setUnit] = useState<'100g' | 'serving'>('100g');
  const n = food.nutritionPer100g;
  const scale = unit === 'serving' && food.servingSize ? food.servingSize / 100 : 1;

  const fmt = (v?: number) => v !== undefined ? Math.round(v * scale) : '—';

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      role="dialog" aria-modal="true" aria-labelledby="food-panel-title">
      <div className="w-full max-w-md bg-surface-card rounded-3xl border border-surface-border overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <div>
            <h2 id="food-panel-title" className="font-display font-bold text-white">{food.name}</h2>
            {food.brand && <p className="text-xs text-zinc-500 mt-0.5">{food.brand}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-elevated"
            aria-label="Close nutrition panel">
            <X className="w-5 h-5 text-zinc-400" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Unit toggle */}
          <div className="flex gap-2 text-sm" role="group" aria-label="Serving size unit">
            {(['100g', 'serving'] as const).map((u) => (
              <button key={u} onClick={() => setUnit(u)}
                className={`flex-1 py-2 rounded-xl border font-medium transition-all
                  ${unit === u ? 'bg-brand-500/15 border-brand-500 text-brand-400'
                    : 'bg-surface-elevated border-surface-border text-zinc-400'}`}
                aria-pressed={unit === u}
              >
                {u === '100g' ? 'Per 100g' : food.servingSize ? `Per serving (${food.servingSize}${food.servingUnit ?? 'g'})` : 'Per serving'}
              </button>
            ))}
          </div>

          {/* NutriScore + allergens */}
          <div className="flex items-center gap-3">
            {food.nutriscore && (
              <div className={`badge ${NUTRISCORE_CLASS[food.nutriscore]} text-sm px-3 py-1`}
                role="img" aria-label={`NutriScore ${food.nutriscore}`}>
                NutriScore {food.nutriscore}
              </div>
            )}
            {food.source && (
              <span className="badge bg-surface-border text-zinc-500 text-xs">
                {food.source === 'usda' ? 'USDA' : food.source === 'openfoodfacts' ? 'Open Food Facts' : food.source}
              </span>
            )}
          </div>

          {/* Main macros */}
          <div className="bg-surface-elevated rounded-2xl p-4">
            <div className="text-center mb-4">
              <p className="font-display text-5xl font-black text-white">{fmt(n.calories)}</p>
              <p className="text-zinc-500 text-sm">Calories</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="font-bold text-blue-400 text-xl">{fmt(n.protein)}g</p>
                <p className="text-xs text-zinc-500">Protein</p>
              </div>
              <div>
                <p className="font-bold text-amber-400 text-xl">{fmt(n.carbs)}g</p>
                <p className="text-xs text-zinc-500">Carbs</p>
              </div>
              <div>
                <p className="font-bold text-purple-400 text-xl">{fmt(n.fat)}g</p>
                <p className="text-xs text-zinc-500">Fat</p>
              </div>
            </div>
          </div>

          {/* Detailed nutrients */}
          <div className="space-y-2">
            {[
              { label: 'Fiber', val: n.fiber, unit: 'g' },
              { label: 'Sugar', val: n.sugar, unit: 'g' },
              { label: 'Saturated Fat', val: n.saturatedFat, unit: 'g' },
              { label: 'Sodium', val: n.sodium, unit: 'mg' },
              { label: 'Potassium', val: n.potassium, unit: 'mg' },
              { label: 'Calcium', val: n.calcium, unit: 'mg' },
              { label: 'Iron', val: n.iron, unit: 'mg' },
              { label: 'Vitamin C', val: n.vitaminC, unit: 'mg' },
            ].filter((r) => r.val !== undefined && r.val !== 0).map(({ label, val, unit: u }) => (
              <div key={label} className="flex justify-between text-sm py-2 border-b border-surface-border last:border-0">
                <span className="text-zinc-400">{label}</span>
                <span className="font-semibold text-white">{fmt(val)}{u}</span>
              </div>
            ))}
          </div>

          {food.allergens && food.allergens.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 mb-2">Allergens</p>
              <div className="flex flex-wrap gap-1">
                {food.allergens.map((a) => (
                  <span key={a} className="badge bg-red-500/10 text-red-400 text-xs">{a}</span>
                ))}
              </div>
            </div>
          )}

          <Link to="/diary" className="btn-primary w-full mt-2">
            + Add to Food Diary <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Foods() {
  const { query, setQuery, results, isLoading } = useFoodSearch();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  const { data: categoryFoods = [], isLoading: catLoading } = useQuery({
    queryKey: ['category', selectedCategory],
    queryFn: () => browseByCategory(selectedCategory!, 20),
    enabled: !!selectedCategory && !query,
    staleTime: 10 * 60 * 1000,
  });

  const displayFoods = query.length >= 2 ? results : (selectedCategory ? categoryFoods : []);
  const showLoading = query.length >= 2 ? isLoading : catLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
          <Database className="w-8 h-8 text-brand-400" aria-hidden="true" />
          Food Database
        </h1>
        <p className="text-zinc-400 text-sm mt-2">
          600,000+ foods from USDA FoodData Central + Open Food Facts. Full nutritional profiles.
        </p>
      </header>

      {/* Search */}
      <div className="relative" role="search">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" aria-hidden="true" />
        <input
          type="search" className="input pl-12 py-4 text-base"
          placeholder="Search 600,000+ foods — USDA + Open Food Facts..."
          value={query} onChange={(e) => setQuery(e.target.value)}
          aria-label="Search food database"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2"
            aria-label="Clear search">
            <X className="w-4 h-4 text-zinc-500" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Categories grid */}
      {!query && (
        <section aria-labelledby="categories-heading">
          <h2 id="categories-heading" className="section-title mb-4">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {FOOD_CATEGORIES.map(({ id, label, emoji }) => (
              <button
                key={id}
                onClick={() => setSelectedCategory(selectedCategory === id ? null : id)}
                className={`card-hover flex flex-col items-center gap-2 py-4 transition-all
                  ${selectedCategory === id ? 'border-brand-500 bg-brand-500/10' : ''}`}
                aria-pressed={selectedCategory === id}
                aria-label={`Browse ${label}`}
              >
                <span className="text-2xl" aria-hidden="true">{emoji}</span>
                <span className="text-xs font-medium text-zinc-300 text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Results */}
      {showLoading && (
        <div className="flex items-center gap-2 text-zinc-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" aria-label="Loading" /> Searching database...
        </div>
      )}

      {displayFoods.length > 0 && (
        <section aria-labelledby="results-heading">
          <h2 id="results-heading" className="section-title mb-4">
            {query ? `Results for "${query}"` : selectedCategory
              ? FOOD_CATEGORIES.find((c) => c.id === selectedCategory)?.label
              : 'Results'}
            <span className="text-zinc-600 font-normal text-base ml-2">({displayFoods.length} foods)</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayFoods.map((food) => (
              <button
                key={food.id}
                onClick={() => setSelectedFood(food)}
                className="card-hover text-left"
                aria-label={`View nutrition for ${food.name}`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm leading-tight">{food.name}</p>
                    {food.brand && <p className="text-xs text-zinc-500 mt-0.5 truncate">{food.brand}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="font-bold text-brand-400 text-sm">
                      {Math.round(food.nutritionPer100g.calories)} kcal
                    </span>
                    {food.nutriscore && (
                      <span className={`badge text-[10px] ${NUTRISCORE_CLASS[food.nutriscore]}`}>
                        {food.nutriscore}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-zinc-500">
                  <span><span className="text-blue-400 font-medium">P</span> {food.nutritionPer100g.protein}g</span>
                  <span><span className="text-amber-400 font-medium">C</span> {food.nutritionPer100g.carbs}g</span>
                  <span><span className="text-purple-400 font-medium">F</span> {food.nutritionPer100g.fat}g</span>
                  <span className="ml-auto text-zinc-600">per 100g</span>
                </div>
                <div className="flex items-center gap-1 mt-3 text-xs text-brand-400 font-medium">
                  <Info className="w-3 h-3" aria-hidden="true" /> Full nutrition panel
                  <ChevronRight className="w-3 h-3 ml-auto" aria-hidden="true" />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!query && !selectedCategory && displayFoods.length === 0 && (
        <div className="text-center py-16">
          <Database className="w-14 h-14 text-zinc-700 mx-auto mb-4" aria-hidden="true" />
          <p className="text-zinc-500 mb-2">Search for any food or select a category above</p>
          <p className="text-xs text-zinc-600">Powered by USDA FoodData Central (600K+ foods) + Open Food Facts</p>
        </div>
      )}

      {/* Nutrition panel modal */}
      {selectedFood && (
        <NutritionPanel food={selectedFood} onClose={() => setSelectedFood(null)} />
      )}
    </div>
  );
}
