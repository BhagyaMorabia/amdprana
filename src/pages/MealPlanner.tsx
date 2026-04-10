/** AI Meal Planner — Gemini generates a personalized 7-day plan */

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { generateMealPlan } from '../lib/gemini';
import type { MealPlanDay, DietaryPref, HealthGoal } from '../lib/types';
import { CalendarDays, Loader2, RefreshCw, ChevronDown, ChevronUp, Sparkles, Utensils } from 'lucide-react';
import toast from 'react-hot-toast';

const DIETARY_OPTIONS: Array<{ id: DietaryPref; label: string; emoji: string }> = [
  { id: 'vegetarian', label: 'Vegetarian', emoji: '🥦' },
  { id: 'vegan', label: 'Vegan', emoji: '🌱' },
  { id: 'gluten_free', label: 'Gluten-Free', emoji: '🌾' },
  { id: 'dairy_free', label: 'Dairy-Free', emoji: '🥛' },
  { id: 'keto', label: 'Keto', emoji: '🥑' },
  { id: 'halal', label: 'Halal', emoji: '🕌' },
];

const GOAL_OPTIONS: Array<{ id: HealthGoal; label: string }> = [
  { id: 'lose_weight', label: 'Lose Weight' },
  { id: 'build_muscle', label: 'Build Muscle' },
  { id: 'eat_balanced', label: 'Balanced Diet' },
  { id: 'maintain_weight', label: 'Maintain Weight' },
];

function MealCard({ meal }: { meal: { mealType: string; name: string; calories: number; protein: number; carbs: number; fat: number; recipe?: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-surface-elevated border border-surface-border rounded-xl overflow-hidden">
      <button
        className="w-full p-3 flex items-center justify-between text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`${meal.mealType}: ${meal.name}`}
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-500 capitalize mb-0.5">{meal.mealType}</p>
          <p className="text-sm font-medium text-white truncate">{meal.name}</p>
        </div>
        <div className="flex items-center gap-3 ml-3">
          <span className="text-brand-400 text-sm font-bold">{meal.calories} kcal</span>
          {open
            ? <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" aria-hidden="true" />
            : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" aria-hidden="true" />}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 border-t border-surface-border pt-3 animate-fade-in">
          <div className="flex gap-4 text-xs text-zinc-500 mb-3">
            <span className="text-blue-400">P: {meal.protein}g</span>
            <span className="text-amber-400">C: {meal.carbs}g</span>
            <span className="text-purple-400">F: {meal.fat}g</span>
          </div>
          {meal.recipe && (
            <p className="text-xs text-zinc-400 leading-relaxed">{meal.recipe}</p>
          )}
        </div>
      )}
    </div>
  );
}

function DayCard({ day }: { day: MealPlanDay }) {
  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-white">{day.dayName}</h3>
        <span className="badge bg-brand-500/15 text-brand-400">{day.totalCalories} kcal</span>
      </div>
      <div className="space-y-2">
        {day.meals.map((meal, i) => (
          <MealCard key={i} meal={meal} />
        ))}
      </div>
    </div>
  );
}

export default function MealPlanner() {
  const { profile } = useAuth();
  const [goal, setGoal] = useState<HealthGoal>(profile?.goal ?? 'eat_balanced');
  const [diets, setDiets] = useState<DietaryPref[]>(profile?.dietaryPrefs?.filter((d) => d !== 'none') ?? []);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [plan, setPlan] = useState<MealPlanDay[] | null>(null);
  const [generating, setGenerating] = useState(false);

  const toggleDiet = (id: DietaryPref) =>
    setDiets((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);

  const generate = async () => {
    setGenerating(true);
    try {
      const result = await generateMealPlan({
        goal,
        calories: profile?.dailyCalorieTarget ?? 2000,
        protein: profile?.dailyProteinTarget ?? 150,
        carbs: profile?.dailyCarbTarget ?? 200,
        fat: profile?.dailyFatTarget ?? 65,
        dietaryPrefs: diets,
        mealsPerDay,
      });
      if (result.length === 0) throw new Error('Empty response');
      setPlan(result);
      toast.success('7-day meal plan generated! 🎉');
    } catch {
      toast.error('Failed to generate plan. Check your Gemini API key in .env.local');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
          <CalendarDays className="w-8 h-8 text-blue-400" aria-hidden="true" />
          AI Meal Planner
        </h1>
        <p className="text-zinc-400 text-sm mt-2">
          Tell Gemini your preferences. Get a personalized 7-day meal plan in seconds.
        </p>
      </header>

      {/* Config panel */}
      <section className="card max-w-2xl" aria-labelledby="planner-config-heading">
        <h2 id="planner-config-heading" className="section-title mb-6">Your Preferences</h2>

        <div className="space-y-6">
          <div>
            <label className="label">Goal</label>
            <div className="grid grid-cols-2 gap-2">
              {GOAL_OPTIONS.map(({ id, label }) => (
                <button key={id} type="button" onClick={() => setGoal(id)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-all
                    ${goal === id ? 'bg-brand-500/15 border-brand-500 text-brand-400'
                      : 'bg-surface-elevated border-surface-border text-zinc-400 hover:border-zinc-600'}`}
                  aria-pressed={goal === id}
                >{label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Daily calorie target</label>
            <div className="input py-3 text-white font-semibold cursor-default">
              {profile?.dailyCalorieTarget ?? 2000} kcal · {profile?.dailyProteinTarget ?? 150}g protein
              <span className="text-xs text-zinc-500 font-normal ml-2">(from your profile)</span>
            </div>
          </div>

          <div>
            <label className="label">Dietary requirements <span className="text-zinc-600">(optional)</span></label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map(({ id, label, emoji }) => {
                const selected = diets.includes(id);
                return (
                  <button key={id} type="button" onClick={() => toggleDiet(id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all
                      ${selected ? 'bg-brand-500/15 border-brand-500 text-brand-400'
                        : 'bg-surface-elevated border-surface-border text-zinc-400 hover:border-zinc-600'}`}
                    aria-pressed={selected}
                  >
                    <span aria-hidden="true">{emoji}</span> {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label">Meals per day</label>
            <div className="flex gap-3">
              {[2, 3, 4].map((n) => (
                <button key={n} type="button" onClick={() => setMealsPerDay(n)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all
                    ${mealsPerDay === n ? 'bg-brand-500/15 border-brand-500 text-brand-400'
                      : 'bg-surface-elevated border-surface-border text-zinc-400'}`}
                  aria-pressed={mealsPerDay === n}
                >{n} meals</button>
              ))}
            </div>
          </div>

          <button onClick={generate} disabled={generating} className="btn-primary w-full text-base py-4">
            {generating ? (
              <><Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> Generating with Gemini AI...</>
            ) : (
              <><Sparkles className="w-5 h-5" aria-hidden="true" />
                {plan ? 'Regenerate My Plan' : 'Generate 7-Day Plan'}</>
            )}
          </button>
        </div>
      </section>

      {/* Generated plan */}
      {plan && plan.length > 0 && (
        <section aria-labelledby="plan-output-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="plan-output-heading" className="section-title flex items-center gap-2">
              <Utensils className="w-5 h-5 text-brand-400" aria-hidden="true" />
              Your 7-Day Plan
            </h2>
            <button onClick={generate} disabled={generating}
              className="btn-ghost text-sm gap-1.5"
              aria-label="Regenerate meal plan">
              <RefreshCw className="w-4 h-4" aria-hidden="true" /> Regenerate
            </button>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {plan.map((day, i) => (
              <DayCard key={i} day={day} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!plan && !generating && (
        <div className="text-center py-16">
          <CalendarDays className="w-14 h-14 text-zinc-700 mx-auto mb-4" aria-hidden="true" />
          <p className="text-zinc-500">Configure your preferences above and click Generate to create your plan.</p>
        </div>
      )}
    </div>
  );
}
