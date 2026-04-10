/**
 * Health calculators — all math runs entirely in the browser, zero API calls.
 * Formulas: Harris-Benedict (BMR), Mifflin-St Jeor (alternative), Hamwi/Devine (IBW), MET (calories burned)
 */

import type { ActivityLevel, BMIResult, TDEEResult, HealthGoal } from './types';

// Activity level TDEE multipliers
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,       // little/no exercise
  light: 1.375,         // light exercise 1-3 days/week
  moderate: 1.55,       // moderate exercise 3-5 days/week
  active: 1.725,        // hard exercise 6-7 days/week
  very_active: 1.9,     // very hard exercise + physical job
};

// Goal calorie adjustments relative to TDEE
const GOAL_ADJUSTMENTS: Record<HealthGoal, number> = {
  lose_weight: -500,
  maintain_weight: 0,
  build_muscle: 300,
  eat_balanced: 0,
  track_macros: 0,
  mindful_eating: -200,
  curb_cravings: -300,
  build_routines: 0,
};

/**
 * Calculate Body Mass Index
 */
export function calculateBMI(weightKg: number, heightCm: number): BMIResult {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const rounded = Math.round(bmi * 10) / 10;

  if (bmi < 18.5) return { bmi: rounded, category: 'underweight', label: 'Underweight', color: '#60a5fa' };
  if (bmi < 25) return { bmi: rounded, category: 'normal', label: 'Healthy Weight', color: '#22c55e' };
  if (bmi < 30) return { bmi: rounded, category: 'overweight', label: 'Overweight', color: '#f59e0b' };
  return { bmi: rounded, category: 'obese', label: 'Obese', color: '#ef4444' };
}

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor (most accurate)
 * Male: 10W + 6.25H - 5A + 5
 * Female: 10W + 6.25H - 5A - 161
 */
export function calculateBMR(weightKg: number, heightCm: number, age: number, sex: 'male' | 'female'): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === 'male' ? base + 5 : base - 161);
}

/**
 * Calculate Total Daily Energy Expenditure
 */
export function calculateTDEE(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: 'male' | 'female',
  activityLevel: ActivityLevel,
  goal: HealthGoal
): TDEEResult {
  const bmr = calculateBMR(weightKg, heightCm, age, sex);
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
  const goalCalories = Math.max(1200, tdee + GOAL_ADJUSTMENTS[goal]);
  return { bmr, tdee, goalCalories };
}

/**
 * Calculate Ideal Body Weight using Hamwi method
 */
export function calculateIBW(heightCm: number, sex: 'male' | 'female'): number {
  const heightIn = heightCm / 2.54;
  const over5ft = Math.max(0, heightIn - 60);
  const base = sex === 'male' ? 48 : 45.5;
  const extra = sex === 'male' ? 2.7 : 2.2;
  return Math.round(base + extra * over5ft);
}

/**
 * Calculate macro gram targets from calorie goal
 */
export function calculateMacros(
  calories: number,
  goal: HealthGoal
): { protein: number; carbs: number; fat: number } {
  // Protein %: higher for muscle building
  const proteinPct = goal === 'build_muscle' ? 0.35 : goal === 'lose_weight' ? 0.30 : 0.25;
  const fatPct = 0.25;
  const carbPct = 1 - proteinPct - fatPct;

  return {
    protein: Math.round((calories * proteinPct) / 4),  // 4 kcal/g
    carbs: Math.round((calories * carbPct) / 4),        // 4 kcal/g
    fat: Math.round((calories * fatPct) / 9),           // 9 kcal/g
  };
}

// MET values for common activities (Metabolic Equivalent of Task)
export const ACTIVITIES: Array<{ id: string; label: string; met: number; category: string }> = [
  { id: 'walking_slow', label: 'Walking (slow, 2mph)', met: 2.5, category: 'Walking' },
  { id: 'walking_moderate', label: 'Walking (moderate, 3mph)', met: 3.5, category: 'Walking' },
  { id: 'walking_fast', label: 'Walking (fast, 4mph)', met: 4.5, category: 'Walking' },
  { id: 'running_5mph', label: 'Running (5mph / 8km/h)', met: 8.3, category: 'Running' },
  { id: 'running_6mph', label: 'Running (6mph / 10km/h)', met: 9.8, category: 'Running' },
  { id: 'running_8mph', label: 'Running (8mph / 13km/h)', met: 11.8, category: 'Running' },
  { id: 'cycling_moderate', label: 'Cycling (moderate, 12-14mph)', met: 8.0, category: 'Cycling' },
  { id: 'cycling_vigorous', label: 'Cycling (vigorous, 16-19mph)', met: 10.0, category: 'Cycling' },
  { id: 'swimming_moderate', label: 'Swimming (moderate)', met: 6.0, category: 'Swimming' },
  { id: 'swimming_vigorous', label: 'Swimming (vigorous)', met: 9.8, category: 'Swimming' },
  { id: 'yoga', label: 'Yoga / Stretching', met: 2.5, category: 'Mind & Body' },
  { id: 'pilates', label: 'Pilates', met: 3.0, category: 'Mind & Body' },
  { id: 'weight_training', label: 'Weight Training', met: 3.5, category: 'Strength' },
  { id: 'hiit', label: 'HIIT / Circuit Training', met: 8.0, category: 'Strength' },
  { id: 'dancing', label: 'Dancing (moderate)', met: 4.8, category: 'Other' },
  { id: 'basketball', label: 'Basketball', met: 6.5, category: 'Sports' },
  { id: 'football', label: 'Football / Soccer', met: 7.0, category: 'Sports' },
  { id: 'tennis', label: 'Tennis', met: 7.3, category: 'Sports' },
  { id: 'jump_rope', label: 'Jump Rope (moderate)', met: 10.0, category: 'Cardio' },
  { id: 'rowing', label: 'Rowing Machine (moderate)', met: 7.0, category: 'Cardio' },
];

/**
 * Calories burned using MET formula: MET × weight(kg) × time(hours)
 */
export function calculateCaloriesBurned(met: number, weightKg: number, durationMinutes: number): number {
  return Math.round(met * weightKg * (durationMinutes / 60));
}

/**
 * Water intake recommendation — 35ml per kg body weight
 */
export function calculateWaterIntake(weightKg: number): number {
  return Math.round(weightKg * 35);
}

/**
 * Macro split calculator for custom calorie targets
 */
export function calculateCustomMacroSplit(
  calories: number,
  split: 'cutting' | 'bulking' | 'maintaining' | 'keto'
): { protein: number; carbs: number; fat: number } {
  const splits = {
    cutting:     { protein: 0.35, fat: 0.25, carbs: 0.40 },
    bulking:     { protein: 0.25, fat: 0.25, carbs: 0.50 },
    maintaining: { protein: 0.25, fat: 0.30, carbs: 0.45 },
    keto:        { protein: 0.25, fat: 0.70, carbs: 0.05 },
  };
  const s = splits[split];
  return {
    protein: Math.round((calories * s.protein) / 4),
    carbs: Math.round((calories * s.carbs) / 4),
    fat: Math.round((calories * s.fat) / 9),
  };
}

/**
 * Scale nutrition from 100g to a given portion
 */
export function scaleNutrition<T extends Record<string, number | undefined>>(
  per100g: T,
  portionGrams: number
): T {
  const factor = portionGrams / 100;
  return Object.fromEntries(
    Object.entries(per100g).map(([k, v]) =>
      [k, v !== undefined ? Math.round((v as number) * factor * 10) / 10 : undefined]
    )
  ) as T;
}
