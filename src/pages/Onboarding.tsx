/** 5-step onboarding wizard — collects user stats and saves to Firestore */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { calculateTDEE, calculateMacros, calculateWaterIntake } from '../lib/calculators';
import type { ActivityLevel, HealthGoal, DietaryPref, FastingPlan, UserProfile } from '../lib/types';
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const GOALS: Array<{ id: HealthGoal; emoji: string; label: string; desc: string }> = [
  { id: 'lose_weight', emoji: '⚖️', label: 'Lose Weight', desc: 'Create a calorie deficit' },
  { id: 'build_muscle', emoji: '💪', label: 'Build Muscle', desc: 'High protein plan' },
  { id: 'eat_balanced', emoji: '🥗', label: 'Eat Balanced', desc: 'Nutritious, varied diet' },
  { id: 'maintain_weight', emoji: '✅', label: 'Maintain Weight', desc: 'Keep current weight' },
  { id: 'track_macros', emoji: '📊', label: 'Track Macros', desc: 'Precision nutrition' },
  { id: 'mindful_eating', emoji: '🧘', label: 'Mindful Eating', desc: 'Awareness-first approach' },
];

const ACTIVITY_LEVELS: Array<{ id: ActivityLevel; label: string; desc: string }> = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Little/no exercise, desk job' },
  { id: 'light', label: 'Lightly Active', desc: '1-3 days/week exercise' },
  { id: 'moderate', label: 'Moderately Active', desc: '3-5 days/week exercise' },
  { id: 'active', label: 'Very Active', desc: '6-7 days/week hard exercise' },
  { id: 'very_active', label: 'Athlete', desc: 'Hard exercise + physical job' },
];

const DIETS: Array<{ id: DietaryPref; label: string; emoji: string }> = [
  { id: 'vegetarian', label: 'Vegetarian', emoji: '🥦' },
  { id: 'vegan', label: 'Vegan', emoji: '🌱' },
  { id: 'gluten_free', label: 'Gluten-Free', emoji: '🌾' },
  { id: 'dairy_free', label: 'Dairy-Free', emoji: '🥛' },
  { id: 'keto', label: 'Keto', emoji: '🥑' },
  { id: 'halal', label: 'Halal', emoji: '🕌' },
];

const FASTING_PLANS: Array<{ id: FastingPlan; hours: string; desc: string }> = [
  { id: '16:8', hours: '16h fast', desc: 'Most popular. Fast 16, eat in 8.' },
  { id: '18:6', hours: '18h fast', desc: 'Advanced. Fast 18, eat in 6.' },
  { id: '5:2', hours: '2 days 500cal', desc: 'Restrictive 2 days, normal 5.' },
];

interface FormData {
  name: string;
  age: string;
  sex: 'male' | 'female';
  heightCm: string;
  weightKg: string;
  goalWeightKg: string;
  goal: HealthGoal;
  activityLevel: ActivityLevel;
  dietaryPrefs: DietaryPref[];
  fastingPlan: FastingPlan | 'none';
}

const initialData: FormData = {
  name: '', age: '', sex: 'male', heightCm: '', weightKg: '', goalWeightKg: '',
  goal: 'lose_weight', activityLevel: 'moderate', dietaryPrefs: [],
  fastingPlan: '16:8',
};

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-500
          ${i + 1 <= current ? 'bg-brand-500' : 'bg-surface-border'}`} />
      ))}
    </div>
  );
}

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(initialData);
  const [saving, setSaving] = useState(false);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const totalSteps = 5;

  const update = (fields: Partial<FormData>) => setData((prev) => ({ ...prev, ...fields }));

  const toggleDiet = (id: DietaryPref) => {
    setData((prev) => ({
      ...prev,
      dietaryPrefs: prev.dietaryPrefs.includes(id)
        ? prev.dietaryPrefs.filter((d) => d !== id)
        : [...prev.dietaryPrefs, id],
    }));
  };

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const age = parseInt(data.age);
      const heightCm = parseFloat(data.heightCm);
      const weightKg = parseFloat(data.weightKg);
      const tdee = calculateTDEE(weightKg, heightCm, age, data.sex, data.activityLevel, data.goal);
      const macros = calculateMacros(tdee.goalCalories, data.goal);
      const waterMl = calculateWaterIntake(weightKg);

      const profile: UserProfile = {
        uid: user.uid,
        displayName: data.name || user.displayName || 'User',
        email: user.email ?? '',
        photoURL: user.photoURL ?? undefined,
        age, sex: data.sex, heightCm, weightKg,
        goalWeightKg: data.goalWeightKg ? parseFloat(data.goalWeightKg) : undefined,
        activityLevel: data.activityLevel,
        goal: data.goal,
        dietaryPrefs: data.dietaryPrefs.length ? data.dietaryPrefs : ['none'],
        fastingPlan: data.fastingPlan !== 'none' ? data.fastingPlan : undefined,
        dailyCalorieTarget: tdee.goalCalories,
        dailyProteinTarget: macros.protein,
        dailyCarbTarget: macros.carbs,
        dailyFatTarget: macros.fat,
        dailyWaterTargetMl: waterMl,
        createdAt: new Date().toISOString(),
        onboardingComplete: true,
      };

      await setDoc(doc(db, 'users', user.uid, 'profile', 'main'), profile);
      await refreshProfile();
      toast.success('Profile set up! Your custom plan is ready. 🎉');
      navigate('/dashboard', { replace: true });
    } catch {
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-white mb-2">Let's personalize your plan</h1>
          <p className="text-zinc-400">Step {step} of {totalSteps}</p>
        </div>

        <StepIndicator current={step} total={totalSteps} />

        <div className="card animate-slide-up">
          {/* Step 1 — Basic Info */}
          {step === 1 && (
            <fieldset>
              <legend className="font-display text-xl font-bold text-white mb-6">About you</legend>
              <div className="space-y-4">
                <div>
                  <label htmlFor="ob-name" className="label">Your Name</label>
                  <input id="ob-name" type="text" className="input" placeholder="First name"
                    value={data.name} onChange={(e) => update({ name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ob-age" className="label">Age</label>
                    <input id="ob-age" type="number" className="input" placeholder="25"
                      value={data.age} onChange={(e) => update({ age: e.target.value })} min="13" max="100" />
                  </div>
                  <div>
                    <label className="label">Sex</label>
                    <div className="flex gap-2" role="radiogroup" aria-label="Biological sex">
                      {(['male', 'female'] as const).map((s) => (
                        <button key={s} type="button"
                          onClick={() => update({ sex: s })}
                          className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all
                            ${data.sex === s ? 'bg-brand-500/15 border-brand-500 text-brand-400'
                              : 'bg-surface-elevated border-surface-border text-zinc-400 hover:border-zinc-500'}`}
                          role="radio" aria-checked={data.sex === s}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="ob-height" className="label">Height (cm)</label>
                    <input id="ob-height" type="number" className="input" placeholder="175"
                      value={data.heightCm} onChange={(e) => update({ heightCm: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor="ob-weight" className="label">Weight (kg)</label>
                    <input id="ob-weight" type="number" className="input" placeholder="70"
                      value={data.weightKg} onChange={(e) => update({ weightKg: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor="ob-goal-weight" className="label">Goal (kg)</label>
                    <input id="ob-goal-weight" type="number" className="input" placeholder="65"
                      value={data.goalWeightKg} onChange={(e) => update({ goalWeightKg: e.target.value })} />
                  </div>
                </div>
              </div>
            </fieldset>
          )}

          {/* Step 2 — Goal */}
          {step === 2 && (
            <fieldset>
              <legend className="font-display text-xl font-bold text-white mb-6">What's your goal?</legend>
              <div className="grid grid-cols-2 gap-3">
                {GOALS.map(({ id, emoji, label, desc }) => (
                  <button key={id} type="button" onClick={() => update({ goal: id })}
                    className={`p-4 text-left rounded-xl border transition-all
                      ${data.goal === id ? 'bg-brand-500/15 border-brand-500'
                        : 'bg-surface-elevated border-surface-border hover:border-zinc-500'}`}
                    role="radio" aria-checked={data.goal === id}
                  >
                    <span className="text-2xl mb-2 block" aria-hidden="true">{emoji}</span>
                    <p className={`text-sm font-semibold ${data.goal === id ? 'text-brand-400' : 'text-white'}`}>{label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* Step 3 — Activity */}
          {step === 3 && (
            <fieldset>
              <legend className="font-display text-xl font-bold text-white mb-6">Activity level</legend>
              <div className="space-y-3">
                {ACTIVITY_LEVELS.map(({ id, label, desc }) => (
                  <button key={id} type="button" onClick={() => update({ activityLevel: id })}
                    className={`w-full p-4 text-left rounded-xl border transition-all flex items-center gap-4
                      ${data.activityLevel === id ? 'bg-brand-500/15 border-brand-500'
                        : 'bg-surface-elevated border-surface-border hover:border-zinc-500'}`}
                    role="radio" aria-checked={data.activityLevel === id}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                      ${data.activityLevel === id ? 'border-brand-400 bg-brand-400' : 'border-zinc-600'}`}>
                      {data.activityLevel === id && <Check className="w-2.5 h-2.5 text-white" aria-hidden="true" />}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${data.activityLevel === id ? 'text-brand-400' : 'text-white'}`}>{label}</p>
                      <p className="text-xs text-zinc-500">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* Step 4 — Dietary preferences */}
          {step === 4 && (
            <fieldset>
              <legend className="font-display text-xl font-bold text-white mb-2">Dietary preferences</legend>
              <p className="text-sm text-zinc-400 mb-5">Select all that apply (optional)</p>
              <div className="grid grid-cols-3 gap-3">
                {DIETS.map(({ id, label, emoji }) => {
                  const selected = data.dietaryPrefs.includes(id);
                  return (
                    <button key={id} type="button" onClick={() => toggleDiet(id)}
                      className={`p-3 rounded-xl border text-center transition-all
                        ${selected ? 'bg-brand-500/15 border-brand-500' : 'bg-surface-elevated border-surface-border hover:border-zinc-500'}`}
                      aria-pressed={selected}
                    >
                      <span className="text-2xl mb-1 block" aria-hidden="true">{emoji}</span>
                      <span className={`text-xs font-medium ${selected ? 'text-brand-400' : 'text-zinc-300'}`}>{label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* Step 5 — Fasting plan */}
          {step === 5 && (
            <fieldset>
              <legend className="font-display text-xl font-bold text-white mb-2">Intermittent fasting</legend>
              <p className="text-sm text-zinc-400 mb-5">Choose a plan to enable the fasting timer (optional)</p>
              <div className="space-y-3">
                {[...FASTING_PLANS, { id: 'none' as const, hours: 'No fasting', desc: "I'll skip fasting for now" }].map((plan) => (
                  <button key={plan.id} type="button" onClick={() => update({ fastingPlan: plan.id as FastingPlan | 'none' })}
                    className={`w-full p-4 text-left rounded-xl border transition-all flex justify-between items-center
                      ${data.fastingPlan === plan.id ? 'bg-brand-500/15 border-brand-500'
                        : 'bg-surface-elevated border-surface-border hover:border-zinc-500'}`}
                    role="radio" aria-checked={data.fastingPlan === plan.id}
                  >
                    <div>
                      <p className={`text-sm font-semibold ${data.fastingPlan === plan.id ? 'text-brand-400' : 'text-white'}`}>
                        {'id' in plan && plan.id !== 'none' ? plan.id : 'No Fasting'}
                      </p>
                      <p className="text-xs text-zinc-500">{plan.desc}</p>
                    </div>
                    <span className={`badge ${data.fastingPlan === plan.id ? 'bg-brand-500/20 text-brand-400' : 'bg-surface-border text-zinc-500'}`}>
                      {plan.hours}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-border">
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 1}
              className="btn-secondary disabled:opacity-30"
              aria-label="Previous step"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Back
            </button>

            {step < totalSteps ? (
              <button type="button" onClick={() => setStep((s) => s + 1)} className="btn-primary" aria-label="Next step">
                Next <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <button type="button" onClick={finish} disabled={saving} className="btn-primary" aria-label="Complete setup">
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Saving...</>
                  : <><Check className="w-4 h-4" aria-hidden="true" /> Let's Go!</>
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
