/**
 * Intermittent Fasting timer hook
 * Manages fasting state, live countdown, streak tracking
 * State persisted in Firestore so it survives tab closes
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import type { FastingPlan, FastingSession } from '../lib/types';

const PLAN_HOURS: Record<FastingPlan, { fastHours: number; eatHours: number }> = {
  '16:8': { fastHours: 16, eatHours: 8 },
  '18:6': { fastHours: 18, eatHours: 6 },
  '20:4': { fastHours: 20, eatHours: 4 },
  '5:2': { fastHours: 24, eatHours: 0 }, // special: 2 days full fast per week
  '6:1': { fastHours: 24, eatHours: 0 },
  custom: { fastHours: 16, eatHours: 8 },
};

interface FastingState {
  isActive: boolean;
  plan: FastingPlan;
  startTime: Date | null;
  targetEndTime: Date | null;
  phase: 'fasting' | 'eating';
  hoursIntoFast: number;
  minutesRemaining: number;
  secondsRemaining: number;
  progress: number; // 0-1
  streak: number;
}

export function useFasting() {
  const { user } = useAuth();
  const [state, setState] = useState<FastingState>({
    isActive: false,
    plan: '16:8',
    startTime: null,
    targetEndTime: null,
    phase: 'eating',
    hoursIntoFast: 0,
    minutesRemaining: 0,
    secondsRemaining: 0,
    progress: 0,
    streak: 0,
  });
  const [selectedPlan, setSelectedPlan] = useState<FastingPlan>('16:8');
  const [loading, setLoading] = useState(true);

  // Load saved fasting state from Firestore
  useEffect(() => {
    if (!user) return;
    const loadState = async () => {
      const ref = doc(db, 'users', user.uid, 'fasting', 'current');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as FastingSession;
        if (!data.completed && data.startTime) {
          const start = new Date(data.startTime);
          const end = new Date(data.targetEndTime);
          setState((prev) => ({ ...prev, isActive: true, plan: data.plan, startTime: start, targetEndTime: end }));
          setSelectedPlan(data.plan);
        }
      }
      setLoading(false);
    };
    loadState();
  }, [user]);

  // Live countdown tick — updates every second
  useEffect(() => {
    if (!state.isActive || !state.startTime || !state.targetEndTime) return;

    const tick = () => {
      const now = new Date();
      const { fastHours } = PLAN_HOURS[state.plan];
      const totalMs = fastHours * 3600 * 1000;
      const elapsedMs = now.getTime() - state.startTime!.getTime();
      const remainingMs = Math.max(0, state.targetEndTime!.getTime() - now.getTime());

      const hoursInto = elapsedMs / 3600000;
      const totalRemainingSeconds = Math.floor(remainingMs / 1000);
      const minutesRemaining = Math.floor(totalRemainingSeconds / 60);
      const secondsRemaining = totalRemainingSeconds % 60;
      const progress = Math.min(1, elapsedMs / totalMs);

      setState((prev) => ({
        ...prev,
        phase: remainingMs > 0 ? 'fasting' : 'eating',
        hoursIntoFast: Math.min(hoursInto, fastHours),
        minutesRemaining,
        secondsRemaining,
        progress,
      }));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [state.isActive, state.startTime, state.targetEndTime, state.plan]);

  const startFast = useCallback(async (plan: FastingPlan) => {
    if (!user) return;
    const { fastHours } = PLAN_HOURS[plan];
    const startTime = new Date();
    const targetEndTime = new Date(startTime.getTime() + fastHours * 3600 * 1000);

    const session: FastingSession = {
      id: `fast_${Date.now()}`,
      userId: user.uid,
      plan,
      startTime: startTime.toISOString(),
      targetEndTime: targetEndTime.toISOString(),
      completed: false,
    };

    await setDoc(doc(db, 'users', user.uid, 'fasting', 'current'), session);
    setState((prev) => ({ ...prev, isActive: true, plan, startTime, targetEndTime, phase: 'fasting' }));
  }, [user]);

  const stopFast = useCallback(async () => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid, 'fasting', 'current'), { completed: true }, { merge: true });
    setState((prev) => ({
      ...prev, isActive: false, startTime: null, targetEndTime: null,
      phase: 'eating', progress: 0, hoursIntoFast: 0,
    }));
  }, [user]);

  return {
    state,
    selectedPlan,
    setSelectedPlan,
    loading,
    startFast,
    stopFast,
    PLAN_HOURS,
  };
}
