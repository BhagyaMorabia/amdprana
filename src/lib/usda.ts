/**
 * USDA FoodData Central API client
 * Free API: https://fdc.nal.usda.gov/
 * Covers 600,000+ foods with complete nutritional data
 */

import type { FoodItem, NutritionInfo } from './types';

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';
const API_KEY = import.meta.env.VITE_USDA_API_KEY || 'DEMO_KEY';

// USDA nutrient IDs that we care about
const NUTRIENT_IDS = {
  calories: 1008,
  protein: 1003,
  fat: 1004,
  carbs: 1005,
  fiber: 1079,
  sugar: 2000,
  sodium: 1093,
  potassium: 1092,
  calcium: 1087,
  iron: 1089,
  vitaminC: 1162,
  saturatedFat: 1258,
};

/** Extract a specific nutrient value from USDA foodNutrients array */
function extractNutrient(nutrients: USDANutrient[], id: number): number {
  const n = nutrients.find((n) => n.nutrientId === id || n.nutrient?.id === id);
  return n ? Math.round((n.value ?? n.amount ?? 0) * 10) / 10 : 0;
}

/** Map USDA API response to our FoodItem type */
function mapUSDAFood(food: USDAFood): FoodItem {
  const nutrients = food.foodNutrients ?? [];

  const nutritionPer100g: NutritionInfo = {
    calories: extractNutrient(nutrients, NUTRIENT_IDS.calories),
    protein: extractNutrient(nutrients, NUTRIENT_IDS.protein),
    fat: extractNutrient(nutrients, NUTRIENT_IDS.fat),
    carbs: extractNutrient(nutrients, NUTRIENT_IDS.carbs),
    fiber: extractNutrient(nutrients, NUTRIENT_IDS.fiber),
    sugar: extractNutrient(nutrients, NUTRIENT_IDS.sugar),
    sodium: extractNutrient(nutrients, NUTRIENT_IDS.sodium),
    potassium: extractNutrient(nutrients, NUTRIENT_IDS.potassium),
    calcium: extractNutrient(nutrients, NUTRIENT_IDS.calcium),
    iron: extractNutrient(nutrients, NUTRIENT_IDS.iron),
    vitaminC: extractNutrient(nutrients, NUTRIENT_IDS.vitaminC),
    saturatedFat: extractNutrient(nutrients, NUTRIENT_IDS.saturatedFat),
  };

  return {
    id: `usda_${food.fdcId}`,
    name: food.description ?? 'Unknown Food',
    brand: food.brandOwner || food.brandName,
    source: 'usda',
    nutritionPer100g,
    servingSize: food.servingSize,
    servingUnit: food.servingSizeUnit,
  };
}

/**
 * Search USDA foods by query string
 */
export async function searchUSDA(query: string, pageSize = 15): Promise<FoodItem[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    query: query.trim(),
    api_key: API_KEY,
    pageSize: String(pageSize),
    dataType: 'Foundation,SR Legacy,Branded',
  });

  const res = await fetch(`${USDA_BASE}/foods/search?${params}`);
  if (!res.ok) throw new Error(`USDA search failed: ${res.status}`);

  const data: USDASearchResponse = await res.json();
  return (data.foods ?? []).map(mapUSDAFood);
}

/**
 * Get a single food by FDC ID
 */
export async function getFoodByFDCId(fdcId: string): Promise<FoodItem | null> {
  const params = new URLSearchParams({ api_key: API_KEY });
  const id = fdcId.replace('usda_', '');

  const res = await fetch(`${USDA_BASE}/food/${id}?${params}`);
  if (!res.ok) return null;

  const food: USDAFood = await res.json();
  return mapUSDAFood(food);
}

/**
 * Browse foods by category
 */
export async function browseByCategory(category: string, pageSize = 20): Promise<FoodItem[]> {
  return searchUSDA(category, pageSize);
}

// --- USDA API Response types ---
interface USDANutrient {
  nutrientId?: number;
  nutrient?: { id: number; name: string };
  value?: number;
  amount?: number;
}

interface USDAFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: USDANutrient[];
}

interface USDASearchResponse {
  foods: USDAFood[];
  totalHits: number;
}
