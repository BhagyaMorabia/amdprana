/**
 * Food diary Firestore hook — CRUD for diary entries, calorie aggregation
 */

import { useState, useCallback } from 'react';
import {
  collection, doc, addDoc, deleteDoc, updateDoc,
  query, where, getDocs, orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import type { DiaryEntry, MealType, FoodItem, NutritionInfo } from '../lib/types';
import { scaleNutrition } from '../lib/calculators';
import { format } from 'date-fns';

const EMPTY_NUTRITION: NutritionInfo = {
  calories: 0, protein: 0, carbs: 0, fat: 0,
};

function sumNutrition(entries: DiaryEntry[]): NutritionInfo {
  return entries.reduce((acc, e) => ({
    calories: acc.calories + e.nutrition.calories,
    protein: acc.protein + e.nutrition.protein,
    carbs: acc.carbs + e.nutrition.carbs,
    fat: acc.fat + e.nutrition.fat,
    fiber: (acc.fiber ?? 0) + (e.nutrition.fiber ?? 0),
    sugar: (acc.sugar ?? 0) + (e.nutrition.sugar ?? 0),
    sodium: (acc.sodium ?? 0) + (e.nutrition.sodium ?? 0),
  }), { ...EMPTY_NUTRITION });
}

export function useDiary(date: string) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [waterMl, setWaterMl] = useState(0);
  const [loading, setLoading] = useState(false);

  const diaryRef = () => collection(db, 'users', user!.uid, 'diary');

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(diaryRef(), where('date', '==', date), orderBy('loggedAt', 'asc'));
      const snap = await getDocs(q);
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() } as DiaryEntry)));
    } finally {
      setLoading(false);
    }
  }, [user, date]);

  const addEntry = async (food: FoodItem, portionGrams: number, mealType: MealType) => {
    if (!user) return;
    const raw = scaleNutrition(food.nutritionPer100g as unknown as Record<string, number | undefined>, portionGrams);
    const nutrition: NutritionInfo = {
      calories: raw['calories'] ?? 0,
      protein: raw['protein'] ?? 0,
      carbs: raw['carbs'] ?? 0,
      fat: raw['fat'] ?? 0,
      fiber: raw['fiber'],
      sugar: raw['sugar'],
      sodium: raw['sodium'],
      potassium: raw['potassium'],
      calcium: raw['calcium'],
      iron: raw['iron'],
      vitaminC: raw['vitaminC'],
      saturatedFat: raw['saturatedFat'],
    };
    const entry: Omit<DiaryEntry, 'id'> = {
      userId: user.uid,
      date,
      mealType,
      foodItem: food,
      portionGrams,
      nutrition,
      loggedAt: new Date().toISOString(),
    };
    const ref = await addDoc(diaryRef(), entry);
    setEntries((prev) => [...prev, { id: ref.id, ...entry }]);
    return ref.id;
  };

  const deleteEntry = async (entryId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'diary', entryId));
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  };

  const updatePortion = async (entryId: string, newGrams: number) => {
    if (!user) return;
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    const raw = scaleNutrition(entry.foodItem.nutritionPer100g as unknown as Record<string, number | undefined>, newGrams);
    const nutrition: NutritionInfo = {
      calories: raw['calories'] ?? 0,
      protein: raw['protein'] ?? 0,
      carbs: raw['carbs'] ?? 0,
      fat: raw['fat'] ?? 0,
      fiber: raw['fiber'],
      sugar: raw['sugar'],
      sodium: raw['sodium'],
    };
    await updateDoc(doc(db, 'users', user.uid, 'diary', entryId), { portionGrams: newGrams, nutrition });
    setEntries((prev) => prev.map((e) => e.id === entryId ? { ...e, portionGrams: newGrams, nutrition } : e));
  };

  const addWater = async (glassesCount: number) => {
    // 1 glass = 250ml
    const newTotal = waterMl + glassesCount * 250;
    setWaterMl(newTotal);
    // Persist to Firestore meta doc
    if (user) {
      const metaRef = doc(db, 'users', user.uid, 'diary_meta', date);
      await updateDoc(metaRef, { waterMl: newTotal }).catch(() =>
        addDoc(collection(db, 'users', user.uid, 'diary_meta'), { date, waterMl: newTotal })
      );
    }
  };

  const byMeal = (meal: MealType) => entries.filter((e) => e.mealType === meal);
  const total = sumNutrition(entries);

  return {
    entries,
    loading,
    waterMl,
    total,
    byMeal,
    fetchEntries,
    addEntry,
    deleteEntry,
    updatePortion,
    addWater,
  };
}

/** Fetch calorie history for the last N days (for charts) */
export async function fetchCalorieHistory(
  uid: string,
  days: number
): Promise<Array<{ date: string; calories: number }>> {
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return format(d, 'yyyy-MM-dd');
  }).reverse();

  const results: Array<{ date: string; calories: number }> = [];

  for (const date of dates) {
    const q = query(
      collection(db, 'users', uid, 'diary'),
      where('date', '==', date)
    );
    const snap = await getDocs(q);
    const totalCal = snap.docs.reduce((sum, d) => sum + ((d.data() as DiaryEntry).nutrition.calories ?? 0), 0);
    results.push({ date, calories: Math.round(totalCal) });
  }

  return results;
}

/** Log a weight entry */
export async function logWeight(uid: string, weightKg: number, date: string) {
  await addDoc(collection(db, 'users', uid, 'weight_log'), {
    weightKg,
    date,
    loggedAt: new Date().toISOString(),
  });
}

/** Fetch weight history */
export async function fetchWeightHistory(uid: string, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const q = query(
    collection(db, 'users', uid, 'weight_log'),
    where('date', '>=', format(startDate, 'yyyy-MM-dd')),
    orderBy('date', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as { date: string; weightKg: number });
}
