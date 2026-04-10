// Central TypeScript types for Prana

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  age: number;
  sex: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  goalWeightKg?: number;
  activityLevel: ActivityLevel;
  goal: HealthGoal;
  dietaryPrefs: DietaryPref[];
  fastingPlan?: FastingPlan;
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  dailyCarbTarget: number;
  dailyFatTarget: number;
  dailyWaterTargetMl: number;
  createdAt: string;
  onboardingComplete: boolean;
}

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';

export type HealthGoal =
  | 'lose_weight'
  | 'build_muscle'
  | 'eat_balanced'
  | 'track_macros'
  | 'mindful_eating'
  | 'curb_cravings'
  | 'build_routines'
  | 'maintain_weight';

export type DietaryPref =
  | 'vegetarian'
  | 'vegan'
  | 'gluten_free'
  | 'dairy_free'
  | 'keto'
  | 'halal'
  | 'none';

export type FastingPlan = '16:8' | '18:6' | '20:4' | '5:2' | '6:1' | 'custom';

// --- Nutrition Types ---
export interface NutritionInfo {
  calories: number;
  protein: number;    // grams
  carbs: number;      // grams
  fat: number;        // grams
  fiber?: number;     // grams
  sugar?: number;     // grams
  sodium?: number;    // mg
  potassium?: number; // mg
  calcium?: number;   // mg
  iron?: number;      // mg
  vitaminC?: number;  // mg
  saturatedFat?: number; // grams
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  source: 'usda' | 'openfoodfacts' | 'custom' | 'gemini';
  nutritionPer100g: NutritionInfo;
  servingSize?: number; // grams
  servingUnit?: string;
  imageUrl?: string;
  nutriscore?: 'A' | 'B' | 'C' | 'D' | 'E';
  allergens?: string[];
  glycemicIndex?: number;
}

// --- Diary Types ---
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface DiaryEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  foodItem: FoodItem;
  portionGrams: number;
  nutrition: NutritionInfo; // calculated for portion
  loggedAt: string;
}

export interface DailyDiary {
  date: string;
  entries: DiaryEntry[];
  waterMl: number;
  weightKg?: number;
  totalNutrition: NutritionInfo;
}

// --- Fasting Types ---
export interface FastingSession {
  id: string;
  userId: string;
  plan: FastingPlan;
  startTime: string; // ISO string
  targetEndTime: string; // ISO string
  actualEndTime?: string;
  completed: boolean;
  eatingWindowStart?: string;
  eatingWindowEnd?: string;
}

// --- Recipe Types ---
export interface Recipe {
  id: string;
  name: string;
  category: string;
  area?: string;
  instructions: string;
  ingredients: RecipeIngredient[];
  thumbnailUrl?: string;
  tags?: string[];
  estimatedCalories?: number;
  estimatedProtein?: number;
  estimatedCarbs?: number;
  estimatedFat?: number;
  prepTime?: number; // minutes
  servings?: number;
}

export interface RecipeIngredient {
  name: string;
  measure: string;
}

// --- Meal Plan Types ---
export interface MealPlan {
  id: string;
  userId: string;
  weekStart: string; // YYYY-MM-DD of Monday
  days: MealPlanDay[];
  goal: HealthGoal;
  generatedAt: string;
}

export interface MealPlanDay {
  date: string;
  dayName: string;
  meals: MealPlanMeal[];
  totalCalories: number;
}

export interface MealPlanMeal {
  mealType: MealType;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  recipe?: string;
}

// --- Calculator Types ---
export interface BMIResult {
  bmi: number;
  category: 'underweight' | 'normal' | 'overweight' | 'obese';
  label: string;
  color: string;
}

export interface TDEEResult {
  bmr: number;
  tdee: number;
  goalCalories: number;
}

// --- Streak Types ---
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastLogDate: string;
}
