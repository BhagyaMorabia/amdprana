/** Food Diary page — core daily tracking with AI photo scan */

import { useState, useEffect, useRef } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import { useDiary } from '../hooks/useDiary';
import { useFoodSearch } from '../hooks/useFoodSearch';
import { analyzeFoodPhoto } from '../lib/gemini';
import type { MealType, FoodItem, NutritionInfo } from '../lib/types';
import {
  Plus, Trash2, ChevronLeft, ChevronRight, Search, Camera,
  Clock, Loader2, X, Check, Utensils
} from 'lucide-react';
import toast from 'react-hot-toast';

const MEAL_SECTIONS: Array<{ id: MealType; label: string; emoji: string; color: string }> = [
  { id: 'breakfast', label: 'Breakfast', emoji: '🌅', color: 'text-amber-400' },
  { id: 'lunch', label: 'Lunch', emoji: '☀️', color: 'text-brand-400' },
  { id: 'dinner', label: 'Dinner', emoji: '🌙', color: 'text-blue-400' },
  { id: 'snacks', label: 'Snacks', emoji: '⚡', color: 'text-purple-400' },
];

// ── Food Search Modal ──
function LogFoodModal({
  mealType, onClose, onAdd
}: {
  mealType: MealType; onClose: () => void;
  onAdd: (food: FoodItem, grams: number) => Promise<void>;
}) {
  const [tab, setTab] = useState<'search' | 'scan'>('search');
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [portion, setPortion] = useState('100');
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<Array<{ name: string; estimatedGrams: number; nutrition: NutritionInfo }>>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { query, setQuery, results, isLoading } = useFoodSearch();

  const handleScan = async () => {
    if (!scanFile) return;
    setScanning(true);
    try {
      const result = await analyzeFoodPhoto(scanFile);
      if (result && result.items.length > 0) {
        setScanResults(result.items);
        toast.success(`Found ${result.items.length} food item(s). Confidence: ${Math.round(result.confidence * 100)}%`);
      } else {
        toast.error("Couldn't identify food items. Try a clearer photo.");
      }
    } catch {
      toast.error('AI scan failed. Please add a Gemini API key in .env.local');
    } finally {
      setScanning(false);
    }
  };

  const confirmAdd = async (food: FoodItem, grams: number) => {
    setSaving(true);
    try {
      await onAdd(food, grams);
      toast.success(`Added ${food.name} to ${mealType}`);
      onClose();
    } catch {
      toast.error('Failed to add food.');
    } finally {
      setSaving(false);
    }
  };

  // Nutrition preview for selected food + current portion
  const preview: NutritionInfo | null = selected
    ? {
      calories: Math.round((selected.nutritionPer100g.calories * parseFloat(portion || '0')) / 100),
      protein: Math.round((selected.nutritionPer100g.protein * parseFloat(portion || '0')) / 100 * 10) / 10,
      carbs: Math.round((selected.nutritionPer100g.carbs * parseFloat(portion || '0')) / 100 * 10) / 10,
      fat: Math.round((selected.nutritionPer100g.fat * parseFloat(portion || '0')) / 100 * 10) / 10,
    }
    : null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      role="dialog" aria-modal="true" aria-labelledby="log-food-title">
      <div className="w-full md:max-w-lg bg-surface-card rounded-t-3xl md:rounded-3xl
        border border-surface-border max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <h2 id="log-food-title" className="font-display font-bold text-white">
            Add to {MEAL_SECTIONS.find((m) => m.id === mealType)?.label}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-elevated"
            aria-label="Close food search">
            <X className="w-5 h-5 text-zinc-400" aria-hidden="true" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-surface-border">
          {([['search', 'Search', Search], ['scan', 'AI Scan', Camera]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium
                transition-colors border-b-2 ${tab === id
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              role="tab" aria-selected={tab === id}
            >
              <Icon className="w-4 h-4" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Search tab */}
          {tab === 'search' && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" aria-hidden="true" />
                <input
                  type="search" className="input pl-10" placeholder="Search 600,000+ foods..."
                  value={query} onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search for food items" autoFocus
                />
              </div>

              {isLoading && (
                <div className="flex items-center gap-2 text-zinc-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" aria-label="Searching" /> Searching USDA + Open Food Facts...
                </div>
              )}

              {results.map((food) => (
                <button key={food.id}
                  onClick={() => { setSelected(food); setPortion(String(food.servingSize ?? 100)); }}
                  className={`w-full text-left p-3 rounded-xl border transition-all
                    ${selected?.id === food.id
                      ? 'bg-brand-500/15 border-brand-500'
                      : 'bg-surface-elevated border-surface-border hover:border-zinc-600'}`}
                  aria-pressed={selected?.id === food.id}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">{food.name}</p>
                      {food.brand && <p className="text-xs text-zinc-500 mt-0.5">{food.brand}</p>}
                    </div>
                    <span className="text-brand-400 font-bold text-sm ml-3 shrink-0">
                      {Math.round(food.nutritionPer100g.calories)} kcal
                      <span className="text-zinc-600 font-normal text-xs">/100g</span>
                    </span>
                  </div>
                  <div className="flex gap-3 mt-2 text-xs text-zinc-500">
                    <span>P: {food.nutritionPer100g.protein}g</span>
                    <span>C: {food.nutritionPer100g.carbs}g</span>
                    <span>F: {food.nutritionPer100g.fat}g</span>
                    {food.nutriscore && (
                      <span className={`badge nutriscore-${food.nutriscore.toLowerCase()} ml-auto`}>
                        {food.nutriscore}
                      </span>
                    )}
                  </div>
                </button>
              ))}

              {query.length >= 2 && !isLoading && results.length === 0 && (
                <div className="text-center py-8 text-zinc-500">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-30" aria-hidden="true" />
                  <p className="text-sm">No results for "{query}"</p>
                </div>
              )}
            </>
          )}

          {/* AI Scan tab */}
          {tab === 'scan' && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-surface-border rounded-2xl p-8 text-center
                  hover:border-brand-500/50 transition-colors cursor-pointer"
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
                role="button" tabIndex={0}
                aria-label="Click to upload food photo for AI analysis"
              >
                {scanFile
                  ? <p className="text-sm text-brand-400 font-medium">📷 {scanFile.name}</p>
                  : (
                    <>
                      <Camera className="w-10 h-10 text-zinc-600 mx-auto mb-3" aria-hidden="true" />
                      <p className="text-sm text-zinc-400 mb-1">Upload a food photo</p>
                      <p className="text-xs text-zinc-600">Gemini AI will identify and log the nutritional info</p>
                    </>
                  )
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => setScanFile(e.target.files?.[0] ?? null)}
                aria-label="Upload food photo" />

              <button onClick={handleScan} disabled={!scanFile || scanning} className="btn-primary w-full">
                {scanning
                  ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Analyzing with Gemini AI...</>
                  : <><Camera className="w-4 h-4" aria-hidden="true" /> Analyze Photo</>
                }
              </button>

              {scanResults.map((item, i) => (
                <div key={i} className="p-3 bg-surface-elevated border border-surface-border rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium text-white text-sm">{item.name}</p>
                    <span className="text-brand-400 font-bold text-sm">{item.nutrition.calories} kcal</span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-3">~{item.estimatedGrams}g estimated</p>
                  <button
                    onClick={() => {
                      const food: FoodItem = {
                        id: `gemini_${Date.now()}`,
                        name: item.name,
                        source: 'gemini',
                        nutritionPer100g: {
                          calories: Math.round((item.nutrition.calories / item.estimatedGrams) * 100),
                          protein: Math.round((item.nutrition.protein / item.estimatedGrams) * 100),
                          carbs: Math.round((item.nutrition.carbs / item.estimatedGrams) * 100),
                          fat: Math.round((item.nutrition.fat / item.estimatedGrams) * 100),
                        },
                      };
                      confirmAdd(food, item.estimatedGrams);
                    }}
                    className="btn-primary text-xs w-full py-2"
                    aria-label={`Add ${item.name} to diary`}
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" /> Add to Diary
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Portion + Add button */}
        {selected && (
          <div className="p-5 border-t border-surface-border space-y-3">
            {preview && (
              <div className="flex gap-4 text-sm text-center text-zinc-400 bg-surface rounded-xl py-3 px-4">
                <div><p className="font-bold text-white">{preview.calories}</p><p className="text-xs">kcal</p></div>
                <div className="w-px bg-surface-border" />
                <div><p className="font-bold text-white">{preview.protein}g</p><p className="text-xs">protein</p></div>
                <div className="w-px bg-surface-border" />
                <div><p className="font-bold text-white">{preview.carbs}g</p><p className="text-xs">carbs</p></div>
                <div className="w-px bg-surface-border" />
                <div><p className="font-bold text-white">{preview.fat}g</p><p className="text-xs">fat</p></div>
              </div>
            )}
            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="portion-input" className="label text-xs">Portion (grams)</label>
                <input id="portion-input" type="number" className="input" value={portion}
                  onChange={(e) => setPortion(e.target.value)} min="1" max="2000"
                  aria-label="Portion size in grams" />
              </div>
              <div className="flex-1 flex items-end">
                <button onClick={() => confirmAdd(selected, parseFloat(portion))} disabled={saving}
                  className="btn-primary w-full" aria-label={`Add ${selected.name} to diary`}>
                  {saving
                    ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    : <><Plus className="w-4 h-4" aria-hidden="true" /> Add Food</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Diary Page ──
export default function Diary() {
  const { profile } = useAuth();
  const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const diary = useDiary(currentDate);
  const [openMeal, setOpenMeal] = useState<MealType | null>(null);

  useEffect(() => { diary.fetchEntries(); }, [currentDate]);

  const isToday = currentDate === format(new Date(), 'yyyy-MM-dd');
  const displayDate = isToday ? 'Today' : format(new Date(currentDate), 'EEEE, MMM d');

  const mealCalories = (meal: MealType) =>
    diary.byMeal(meal).reduce((s, e) => s + e.nutrition.calories, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header + date navigation */}
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-white">Food Diary</h1>
        <nav className="flex items-center gap-2" aria-label="Date navigation">
          <button onClick={() => setCurrentDate((d) => format(subDays(new Date(d), 1), 'yyyy-MM-dd'))}
            className="p-2 rounded-xl hover:bg-surface-elevated border border-surface-border"
            aria-label="Previous day">
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <span className="font-medium text-white min-w-[100px] text-center text-sm">{displayDate}</span>
          <button
            onClick={() => setCurrentDate((d) => format(addDays(new Date(d), 1), 'yyyy-MM-dd'))}
            disabled={isToday}
            className="p-2 rounded-xl hover:bg-surface-elevated border border-surface-border disabled:opacity-30"
            aria-label="Next day">
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </nav>
      </header>

      {/* Daily summary bar */}
      <div className="card flex flex-wrap gap-6 items-center">
        <div>
          <p className="text-xs text-zinc-500 mb-1">Calories</p>
          <p className="font-display text-2xl font-bold text-white">
            {Math.round(diary.total.calories).toLocaleString()}
            <span className="text-zinc-600 text-base font-normal ml-1">/ {profile?.dailyCalorieTarget ?? 2000}</span>
          </p>
        </div>
        {[
          { label: 'Protein', val: diary.total.protein, color: 'text-blue-400' },
          { label: 'Carbs', val: diary.total.carbs, color: 'text-amber-400' },
          { label: 'Fat', val: diary.total.fat, color: 'text-purple-400' },
        ].map(({ label, val, color }) => (
          <div key={label}>
            <p className="text-xs text-zinc-500 mb-1">{label}</p>
            <p className={`font-display text-lg font-bold ${color}`}>{Math.round(val)}g</p>
          </div>
        ))}
        <div className="ml-auto">
          <p className="text-xs text-zinc-500 mb-1">Water</p>
          <p className="font-display text-lg font-bold text-cyan-400">{diary.waterMl}ml</p>
        </div>
      </div>

      {/* Meal sections */}
      <div className="space-y-4">
        {MEAL_SECTIONS.map(({ id, label, emoji, color }) => {
          const entries = diary.byMeal(id);
          const sectionCal = mealCalories(id);
          return (
            <section key={id} className="card" aria-labelledby={`meal-${id}-heading`}>
              <div className="flex items-center justify-between mb-4">
                <h2 id={`meal-${id}-heading`} className={`font-display text-lg font-bold ${color} flex items-center gap-2`}>
                  <span aria-hidden="true">{emoji}</span> {label}
                  {sectionCal > 0 && (
                    <span className="text-sm font-normal text-zinc-500">{Math.round(sectionCal)} kcal</span>
                  )}
                </h2>
                <button
                  onClick={() => setOpenMeal(id)}
                  className="btn-primary text-sm py-1.5 px-3"
                  aria-label={`Add food to ${label}`}>
                  <Plus className="w-4 h-4" aria-hidden="true" /> Add
                </button>
              </div>

              {entries.length === 0 ? (
                <button onClick={() => setOpenMeal(id)}
                  className="w-full py-6 border-2 border-dashed border-surface-border rounded-xl
                    text-zinc-600 text-sm hover:border-brand-500/30 hover:text-zinc-500 transition-all text-center"
                  aria-label={`Add food to ${label}`}>
                  <Utensils className="w-5 h-5 mx-auto mb-1 opacity-50" aria-hidden="true" />
                  Tap to log {label.toLowerCase()}
                </button>
              ) : (
                <ul className="space-y-2">
                  {entries.map((entry) => (
                    <li key={entry.id}
                      className="flex items-center gap-3 p-3 bg-surface-elevated rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{entry.foodItem.name}</p>
                        <div className="flex gap-3 text-xs text-zinc-500 mt-0.5">
                          <span>{entry.portionGrams}g</span>
                          <span>P:{Math.round(entry.nutrition.protein)}g</span>
                          <span>C:{Math.round(entry.nutrition.carbs)}g</span>
                          <span>F:{Math.round(entry.nutrition.fat)}g</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" aria-hidden="true" />
                            {format(new Date(entry.loggedAt), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-brand-400 text-sm">
                          {Math.round(entry.nutrition.calories)} kcal
                        </span>
                        <button
                          onClick={() => {
                            diary.deleteEntry(entry.id);
                            toast.success('Entry removed');
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors"
                          aria-label={`Remove ${entry.foodItem.name} from diary`}
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {/* Nutrition breakdown */}
      {diary.total.calories > 0 && (
        <section className="card" aria-labelledby="nutrition-summary-heading">
          <h2 id="nutrition-summary-heading" className="section-title mb-4">Daily Nutrition Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Calories', val: Math.round(diary.total.calories), unit: 'kcal', color: 'text-brand-400' },
              { label: 'Protein', val: Math.round(diary.total.protein), unit: 'g', color: 'text-blue-400' },
              { label: 'Carbs', val: Math.round(diary.total.carbs), unit: 'g', color: 'text-amber-400' },
              { label: 'Fat', val: Math.round(diary.total.fat), unit: 'g', color: 'text-purple-400' },
              { label: 'Fiber', val: Math.round(diary.total.fiber ?? 0), unit: 'g', color: 'text-lime-400' },
              { label: 'Sugar', val: Math.round(diary.total.sugar ?? 0), unit: 'g', color: 'text-red-400' },
              { label: 'Sodium', val: Math.round(diary.total.sodium ?? 0), unit: 'mg', color: 'text-zinc-300' },
              { label: 'Sat. Fat', val: Math.round(diary.total.saturatedFat ?? 0), unit: 'g', color: 'text-orange-400' },
            ].map(({ label, val, unit, color }) => (
              <div key={label} className="bg-surface-elevated rounded-xl p-3 text-center">
                <p className={`font-display text-2xl font-bold ${color}`}>{val}<span className="text-base ml-0.5">{unit}</span></p>
                <p className="text-xs text-zinc-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Food log modal */}
      {openMeal && (
        <LogFoodModal
          mealType={openMeal}
          onClose={() => setOpenMeal(null)}
          onAdd={async (food, grams) => { await diary.addEntry(food, grams, openMeal); }}
        />
      )}
    </div>
  );
}
