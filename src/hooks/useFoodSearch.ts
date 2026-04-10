/**
 * Combined food search hook — merges USDA + Open Food Facts results
 * with debouncing, caching, and loading states
 */

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchUSDA } from '../lib/usda';
import { searchOpenFoodFacts } from '../lib/openfoodfacts';
import type { FoodItem } from '../lib/types';

const DEBOUNCE_MS = 350;

export function useFoodSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const { data: results = [], isLoading, error } = useQuery({
    queryKey: ['food-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim() || debouncedQuery.length < 2) return [];

      // Run both searches in parallel, merge results
      const [usdaResults, offResults] = await Promise.allSettled([
        searchUSDA(debouncedQuery, 10),
        searchOpenFoodFacts(debouncedQuery, 8),
      ]);

      const usda = usdaResults.status === 'fulfilled' ? usdaResults.value : [];
      const off = offResults.status === 'fulfilled' ? offResults.value : [];

      // Deduplicate by name (case-insensitive)
      const seen = new Set<string>();
      const merged: FoodItem[] = [];
      for (const item of [...usda, ...off]) {
        const key = item.name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(item);
        }
      }
      return merged;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { query, setQuery, results, isLoading, error };
}
