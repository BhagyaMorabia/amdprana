/**
 * Google Gemini 1.5 Flash API client
 * Used for: food photo analysis, meal plan generation, fasting tips, weekly health summaries
 * Free tier: 15 RPM, 1M tokens/day
 */

import type { NutritionInfo, HealthGoal, DietaryPref, MealPlanDay, FastingPlan } from './types';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/** Generic Gemini text generation */
async function generateText(prompt: string): Promise<string> {
  if (!API_KEY || API_KEY === 'PASTE_YOUR_GEMINI_KEY_HERE') {
    throw new Error('Gemini API key not configured. Please add it to .env.local');
  }

  const res = await fetch(`${GEMINI_BASE}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 0.9,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Gemini API error ${res.status}: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

/** Gemini multimodal call with image */
async function generateWithImage(prompt: string, base64Image: string, mimeType: string): Promise<string> {
  if (!API_KEY || API_KEY === 'PASTE_YOUR_GEMINI_KEY_HERE') {
    throw new Error('Gemini API key not configured.');
  }

  const res = await fetch(`${GEMINI_BASE}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Image } },
        ],
      }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini vision error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

/** Parse Gemini JSON output safely */
function safeParseJSON<T>(text: string): T | null {
  try {
    const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to extract JSON from the response
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try { return JSON.parse(match[0]) as T; }
      catch { return null; }
    }
    return null;
  }
}

/**
 * Analyze a food photo and return nutritional information
 */
export async function analyzeFoodPhoto(imageFile: File): Promise<{
  items: Array<{ name: string; estimatedGrams: number; nutrition: NutritionInfo }>;
  confidence: number;
  description: string;
} | null> {
  const base64 = await fileToBase64(imageFile);
  const mimeType = imageFile.type;

  const prompt = `You are a professional nutritionist analyzing a food photo.
Identify all food items visible in this image and estimate their nutritional content.

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "description": "brief description of what you see",
  "confidence": 0.85,
  "items": [
    {
      "name": "food item name",
      "estimatedGrams": 150,
      "nutrition": {
        "calories": 250,
        "protein": 12,
        "carbs": 30,
        "fat": 8,
        "fiber": 3,
        "sugar": 5
      }
    }
  ]
}

confidence should be 0-1 based on how clearly you can see and identify the food.
Estimates should be realistic portion sizes. If you cannot identify food, return confidence: 0.`;

  const text = await generateWithImage(prompt, base64, mimeType);
  return safeParseJSON(text);
}

/**
 * Generate a 7-day personalized meal plan
 */
export async function generateMealPlan(params: {
  goal: HealthGoal;
  calories: number;
  dietaryPrefs: DietaryPref[];
  mealsPerDay: number;
  protein: number;
  carbs: number;
  fat: number;
}): Promise<MealPlanDay[]> {
  const restrictionText = params.dietaryPrefs
    .filter((p) => p !== 'none')
    .join(', ') || 'no restrictions';

  const prompt = `Create a 7-day healthy meal plan with these requirements:
- Goal: ${params.goal.replace(/_/g, ' ')}
- Daily calories: ~${params.calories} kcal
- Protein: ~${params.protein}g, Carbs: ~${params.carbs}g, Fat: ~${params.fat}g
- Dietary restrictions: ${restrictionText}
- Meals per day: ${params.mealsPerDay}

Return ONLY valid JSON array (no markdown) with 7 objects for Mon-Sun:
[
  {
    "date": "Day 1",
    "dayName": "Monday",
    "totalCalories": 1800,
    "meals": [
      {
        "mealType": "breakfast",
        "name": "Oats with berries and almond milk",
        "calories": 350,
        "protein": 12,
        "carbs": 55,
        "fat": 8,
        "recipe": "Cook 60g oats with 200ml almond milk, top with 80g mixed berries and a drizzle of honey."
      }
    ]
  }
]

Make meals realistic, varied, and delicious. Recipe field should be a brief cooking instruction (1-2 sentences).`;

  const text = await generateText(prompt);
  const plan = safeParseJSON<MealPlanDay[]>(text);
  return plan ?? [];
}

/**
 * Generate contextual fasting tips based on the plan
 */
export async function generateFastingTips(plan: FastingPlan, hoursIntoFast: number): Promise<string[]> {
  const prompt = `A person is doing ${plan} intermittent fasting and is ${hoursIntoFast.toFixed(1)} hours into their fast.
Give exactly 3 helpful, science-backed tips to make this easier.

Return ONLY valid JSON array of 3 strings (no markdown):
["tip 1", "tip 2", "tip 3"]

Tips should be specific, actionable, and encouraging. Max 30 words each.`;

  const text = await generateText(prompt);
  const tips = safeParseJSON<string[]>(text);
  return tips ?? [
    'Stay hydrated — drink water, black coffee or plain tea to suppress hunger.',
    'Keep busy with light activities like walking to distract from hunger.',
    'Electrolytes like sodium and potassium help prevent lightheadedness during fasting.',
  ];
}

/**
 * Generate an AI food insight based on today's diary
 */
export async function generateDailyInsight(params: {
  calories: number;
  calGoal: number;
  protein: number;
  proteinGoal: number;
  carbs: number;
  fat: number;
}): Promise<string> {
  const pct = Math.round((params.calories / params.calGoal) * 100);
  const prompt = `A person has eaten ${params.calories} kcal (${pct}% of their ${params.calGoal} kcal goal),
with ${params.protein}g protein (goal: ${params.proteinGoal}g), ${params.carbs}g carbs, ${params.fat}g fat.

Write ONE concise, positive, actionable insight (max 25 words) about their nutrition today.
Do not start with "You" or "I". Be specific, friendly and science-backed.
Return ONLY the insight text, no quotes or extra formatting.`;

  const text = await generateText(prompt);
  return text.trim() || 'Great tracking today! Consistency is the key to lasting health improvements.';
}

/**
 * Generate a weekly health summary
 */
export async function generateWeeklySummary(stats: {
  avgCalories: number;
  calGoal: number;
  daysLogged: number;
  avgProtein: number;
  proteinGoal: number;
  streakDays: number;
}): Promise<string> {
  const prompt = `Weekly health summary for a user:
- Days logged: ${stats.daysLogged}/7
- Avg calories: ${stats.avgCalories} vs goal of ${stats.calGoal}
- Avg protein: ${stats.avgProtein}g vs goal of ${stats.proteinGoal}g
- Current streak: ${stats.streakDays} days

Write a warm, encouraging weekly summary (3-4 sentences, max 80 words).
Highlight what went well and give one specific improvement tip for next week.
Return ONLY the summary text.`;

  return generateText(prompt);
}

/**
 * Generate a healthy recipe from available ingredients
 */
export async function generateRecipeFromIngredients(
  ingredients: string[],
  dietaryPrefs: DietaryPref[]
): Promise<{ name: string; instructions: string; estimatedCalories: number } | null> {
  const restrictions = dietaryPrefs.filter((p) => p !== 'none').join(', ') || 'none';
  const prompt = `Create a healthy recipe using these ingredients: ${ingredients.join(', ')}.
Dietary restrictions: ${restrictions}.

Return ONLY valid JSON (no markdown):
{
  "name": "Recipe Name",
  "estimatedCalories": 400,
  "estimatedProtein": 25,
  "estimatedCarbs": 40,
  "estimatedFat": 12,
  "instructions": "Step-by-step cooking instructions here. Be detailed but concise."
}`;

  const text = await generateText(prompt);
  return safeParseJSON(text);
}

/** Convert File to base64 string */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Strip "data:image/jpeg;base64," prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
  });
}
