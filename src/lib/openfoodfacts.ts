/**
 * Open Food Facts API client
 * Free, open-source database for branded/packaged products globally
 * https://world.openfoodfacts.org/data
 */

import type { FoodItem, NutritionInfo } from './types';

const OFF_BASE = 'https://world.openfoodfacts.org';

/** Map Open Food Facts product to FoodItem */
function mapOFFProduct(product: OFFProduct): FoodItem {
  const n = product.nutriments ?? {};

  const nutritionPer100g: NutritionInfo = {
    calories: n['energy-kcal_100g'] ?? n['energy_100g'] ? Math.round((n['energy_100g'] ?? 0) / 4.184) : 0,
    protein: n['proteins_100g'] ?? 0,
    fat: n['fat_100g'] ?? 0,
    carbs: n['carbohydrates_100g'] ?? 0,
    fiber: n['fiber_100g'],
    sugar: n['sugars_100g'],
    sodium: n['sodium_100g'] ? n['sodium_100g'] * 1000 : undefined, // convert g to mg
    saturatedFat: n['saturated-fat_100g'],
  };

  // Use energy-kcal directly if available
  if (n['energy-kcal_100g']) {
    nutritionPer100g.calories = n['energy-kcal_100g'];
  }

  const nutriscore = product.nutriscore_grade?.toUpperCase() as FoodItem['nutriscore'];

  return {
    id: `off_${product.code}`,
    name: product.product_name_en ?? product.product_name ?? 'Unknown Product',
    brand: product.brands,
    source: 'openfoodfacts',
    nutritionPer100g,
    servingSize: product.serving_quantity,
    servingUnit: 'g',
    imageUrl: product.image_front_url ?? product.image_url,
    nutriscore: ['A', 'B', 'C', 'D', 'E'].includes(nutriscore ?? '') ? nutriscore : undefined,
    allergens: product.allergens_tags?.map((a) => a.replace('en:', '')),
  };
}

/**
 * Search Open Food Facts by product name
 */
export async function searchOpenFoodFacts(query: string, pageSize = 10): Promise<FoodItem[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    search_terms: query.trim(),
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: String(pageSize),
    fields: 'code,product_name,product_name_en,brands,nutriments,nutriscore_grade,image_front_url,serving_quantity,allergens_tags',
  });

  const res = await fetch(`${OFF_BASE}/cgi/search.pl?${params}`);
  if (!res.ok) throw new Error(`Open Food Facts search failed: ${res.status}`);

  const data: OFFSearchResponse = await res.json();
  return (data.products ?? [])
    .filter((p) => p.product_name || p.product_name_en)
    .map(mapOFFProduct);
}

/**
 * Lookup a product by barcode number
 */
export async function lookupBarcode(barcode: string): Promise<FoodItem | null> {
  const res = await fetch(`${OFF_BASE}/api/v0/product/${barcode}.json`);
  if (!res.ok) return null;

  const data: { status: number; product: OFFProduct } = await res.json();
  if (data.status !== 1 || !data.product) return null;

  return mapOFFProduct(data.product);
}

// --- Open Food Facts Response types ---
interface OFFProduct {
  code: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  nutriments?: Record<string, number>;
  nutriscore_grade?: string;
  image_front_url?: string;
  image_url?: string;
  serving_quantity?: number;
  allergens_tags?: string[];
}

interface OFFSearchResponse {
  products: OFFProduct[];
  count: number;
  page: number;
}
