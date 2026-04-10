/**
 * TheMealDB API client
 * Free tier: hundreds of recipes with photos, ingredients, instructions
 * https://www.themealdb.com/api.php
 */

import type { Recipe, RecipeIngredient } from './types';

const MEAL_DB_BASE = 'https://www.themealdb.com/api/json/v1/1';

/** Map MealDB API meal to our Recipe type */
function mapMeal(meal: MealDBMeal): Recipe {
  const ingredients: RecipeIngredient[] = [];

  // MealDB stores up to 20 ingredient/measure pairs as numbered fields
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}` as keyof MealDBMeal];
    const measure = meal[`strMeasure${i}` as keyof MealDBMeal];
    if (ingredient && String(ingredient).trim()) {
      ingredients.push({ name: String(ingredient), measure: String(measure ?? '') });
    }
  }

  const tags = meal.strTags
    ? meal.strTags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  return {
    id: `mealdb_${meal.idMeal}`,
    name: meal.strMeal,
    category: meal.strCategory ?? 'Miscellaneous',
    area: meal.strArea,
    instructions: meal.strInstructions ?? '',
    ingredients,
    thumbnailUrl: meal.strMealThumb,
    tags,
    servings: 4,
  };
}

/**
 * Search recipes by name
 */
export async function searchRecipes(query: string): Promise<Recipe[]> {
  const res = await fetch(`${MEAL_DB_BASE}/search.php?s=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`TheMealDB search failed: ${res.status}`);
  const data: { meals: MealDBMeal[] | null } = await res.json();
  return (data.meals ?? []).map(mapMeal);
}

/**
 * Get recipes by category (e.g. "Chicken", "Vegetarian", "Seafood")
 */
export async function getRecipesByCategory(category: string): Promise<Recipe[]> {
  const res = await fetch(`${MEAL_DB_BASE}/filter.php?c=${encodeURIComponent(category)}`);
  if (!res.ok) return [];
  const data: { meals: Array<{ idMeal: string; strMeal: string; strMealThumb: string }> | null } = await res.json();
  return (data.meals ?? []).map((m) => ({
    id: `mealdb_${m.idMeal}`,
    name: m.strMeal,
    category,
    instructions: '',
    ingredients: [],
    thumbnailUrl: m.strMealThumb,
  }));
}

/**
 * Get full recipe details by ID
 */
export async function getRecipeById(id: string): Promise<Recipe | null> {
  const numericId = id.replace('mealdb_', '');
  const res = await fetch(`${MEAL_DB_BASE}/lookup.php?i=${numericId}`);
  if (!res.ok) return null;
  const data: { meals: MealDBMeal[] | null } = await res.json();
  const meal = data.meals?.[0];
  return meal ? mapMeal(meal) : null;
}

/**
 * Get random featured recipe for the dashboard card
 */
export async function getRandomRecipe(): Promise<Recipe | null> {
  const res = await fetch(`${MEAL_DB_BASE}/random.php`);
  if (!res.ok) return null;
  const data: { meals: MealDBMeal[] | null } = await res.json();
  const meal = data.meals?.[0];
  return meal ? mapMeal(meal) : null;
}

/**
 * Get all available recipe categories
 */
export async function getCategories(): Promise<string[]> {
  const res = await fetch(`${MEAL_DB_BASE}/categories.php`);
  if (!res.ok) return [];
  const data: { categories: Array<{ strCategory: string }> } = await res.json();
  return data.categories.map((c) => c.strCategory);
}

// MealDB API response type
type MealDBMeal = {
  idMeal: string;
  strMeal: string;
  strCategory?: string;
  strArea?: string;
  strInstructions?: string;
  strMealThumb?: string;
  strTags?: string;
  [key: string]: string | undefined;
};
