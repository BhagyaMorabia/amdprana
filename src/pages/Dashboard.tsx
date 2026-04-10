/** Dashboard — the logged-in nerve center */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { useDiary, fetchCalorieHistory, fetchWeightHistory } from '../hooks/useDiary';
import { useFasting } from '../hooks/useFasting';
import CalorieRing from '../components/CalorieRing';
import MacroBars from '../components/MacroBars';
import WaterTracker from '../components/WaterTracker';
import FastingTimer from '../components/FastingTimer';
import { generateDailyInsight } from '../lib/gemini';
import { getRandomRecipe } from '../lib/themealdb';
import {
  Plus, Flame, BookOpen, Utensils, CalendarDays,
  TrendingUp, Sparkles, ChevronRight, Scale
} from 'lucide-react';

const today = format(new Date(), 'yyyy-MM-dd');

export default function Dashboard() {
  const { user, profile } = useAuth();
  const diary = useDiary(today);
  const fasting = useFasting();
  const [insight, setInsight] = useState<string>('');
  const [weightInput, setWeightInput] = useState('');

  // Fetch diary on mount
  useEffect(() => { diary.fetchEntries(); }, []);

  // AI insight — generate when diary has entries
  useEffect(() => {
    if (!profile || diary.total.calories === 0) return;
    generateDailyInsight({
      calories: diary.total.calories,
      calGoal: profile.dailyCalorieTarget,
      protein: diary.total.protein,
      proteinGoal: profile.dailyProteinTarget,
      carbs: diary.total.carbs,
      fat: diary.total.fat,
    }).then(setInsight).catch(() => {});
  }, [diary.total.calories]);

  // Calorie history chart
  const { data: calorieHistory = [] } = useQuery({
    queryKey: ['calorie-history', user?.uid],
    queryFn: () => fetchCalorieHistory(user!.uid, 7),
    enabled: !!user,
  });

  // Weight chart
  const { data: weightHistory = [] } = useQuery({
    queryKey: ['weight-history', user?.uid],
    queryFn: () => fetchWeightHistory(user!.uid, 14),
    enabled: !!user,
  });

  // Random recipe for the recommendation card
  const { data: featuredRecipe } = useQuery({
    queryKey: ['random-recipe'],
    queryFn: getRandomRecipe,
    staleTime: 60 * 60 * 1000,
  });

  const goal = profile?.dailyCalorieTarget ?? 2000;
  const pName = profile?.displayName?.split(' ')[0] ?? 'There';

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header>
        <h1 className="font-display text-3xl font-bold text-white">
          {greeting()}, {pName} 👋
        </h1>
        <p className="text-zinc-400 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </header>

      {/* ── Main grid ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left column — primary */}
        <div className="lg:col-span-2 space-y-6">

          {/* Calorie Ring + Macros card */}
          <section className="card" aria-labelledby="calorie-section-heading">
            <h2 id="calorie-section-heading" className="section-title mb-6">Today's Nutrition</h2>
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="shrink-0">
                <CalorieRing consumed={diary.total.calories} goal={goal} size={200} />
              </div>
              <div className="flex-1 w-full">
                <MacroBars
                  protein={diary.total.protein} proteinGoal={profile?.dailyProteinTarget ?? 150}
                  carbs={diary.total.carbs} carbsGoal={profile?.dailyCarbTarget ?? 250}
                  fat={diary.total.fat} fatGoal={profile?.dailyFatTarget ?? 65}
                />
              </div>
            </div>
          </section>

          {/* Water tracker */}
          <section className="card" aria-labelledby="water-section-heading">
            <h2 id="water-section-heading" className="section-title mb-6">Hydration</h2>
            <WaterTracker
              currentMl={diary.waterMl}
              goalMl={profile?.dailyWaterTargetMl ?? 2500}
              onAdd={diary.addWater}
            />
          </section>

          {/* Calorie History Chart */}
          <section className="card" aria-labelledby="chart-heading">
            <div className="flex items-center justify-between mb-6">
              <h2 id="chart-heading" className="section-title flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-400" aria-hidden="true" />
                Weekly Calories
              </h2>
              <Link to="/diary" className="btn-ghost text-xs">
                View Diary <ChevronRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={calorieHistory} margin={{ left: -20 }}>
                <CartesianGrid stroke="#1a2420" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickFormatter={(d: string) => d.slice(5)} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#111916', border: '1px solid #2a3b30', borderRadius: 12 }}
                  labelStyle={{ color: '#9ca3af' }}
                  itemStyle={{ color: '#22c55e' }}
                />
                <Line type="monotone" dataKey="calories" stroke="#22c55e" strokeWidth={2}
                  dot={{ fill: '#22c55e', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
            {goal > 0 && (
              <p className="text-xs text-zinc-600 mt-2 text-center">
                Daily goal: {goal.toLocaleString()} kcal
              </p>
            )}
          </section>

          {/* Weight chart (if logs exist) */}
          {weightHistory.length > 1 && (
            <section className="card" aria-labelledby="weight-chart-heading">
              <div className="flex items-center justify-between mb-6">
                <h2 id="weight-chart-heading" className="section-title flex items-center gap-2">
                  <Scale className="w-5 h-5 text-purple-400" aria-hidden="true" />
                  Weight Progress
                </h2>
                <div className="flex gap-2">
                  <input
                    type="number" placeholder="Log weight (kg)" value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="input py-1.5 px-3 text-xs w-36"
                    aria-label="Log today's weight in kilograms"
                  />
                  <button className="btn-primary text-xs py-1.5 px-3"
                    onClick={() => { /* log weight */ setWeightInput(''); }}
                    aria-label="Save weight entry">
                    Log
                  </button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={weightHistory} margin={{ left: -20 }}>
                  <CartesianGrid stroke="#1a2420" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }}
                    tickFormatter={(d: string) => d.slice(5)} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ background: '#111916', border: '1px solid #2a3b30', borderRadius: 12 }}
                    itemStyle={{ color: '#c084fc' }}
                  />
                  <Line type="monotone" dataKey="weightKg" stroke="#c084fc" strokeWidth={2}
                    dot={{ fill: '#c084fc', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </section>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">

          {/* Quick Actions */}
          <section className="card" aria-labelledby="quick-actions-heading">
            <h2 id="quick-actions-heading" className="section-title mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { to: '/diary', icon: Plus, label: 'Log Food', color: 'text-brand-400', bg: 'bg-brand-500/10' },
                { to: '/fasting', icon: Flame, label: 'Fasting', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                { to: '/meal-planner', icon: CalendarDays, label: 'Meal Plan', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { to: '/diary', icon: BookOpen, label: 'Diary', color: 'text-purple-400', bg: 'bg-purple-500/10' },
              ].map(({ to, icon: Icon, label, color, bg }) => (
                <Link key={label} to={to}
                  className={`${bg} border border-surface-border rounded-xl p-4 flex flex-col
                    items-center gap-2 hover:border-zinc-600 transition-all text-center`}
                  aria-label={`Go to ${label}`}>
                  <Icon className={`w-5 h-5 ${color}`} aria-hidden="true" />
                  <span className="text-xs font-medium text-zinc-300">{label}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Fasting widget */}
          {profile?.fastingPlan && (
            <section className="card" aria-labelledby="fasting-widget-heading">
              <h2 id="fasting-widget-heading" className="section-title mb-4">Fasting Timer</h2>
              <FastingTimer
                isActive={fasting.state.isActive}
                plan={fasting.state.plan}
                phase={fasting.state.phase}
                progress={fasting.state.progress}
                hoursIntoFast={fasting.state.hoursIntoFast}
                minutesRemaining={fasting.state.minutesRemaining}
                secondsRemaining={fasting.state.secondsRemaining}
                streak={fasting.state.streak}
                onStart={fasting.startFast}
                onStop={fasting.stopFast}
                size="sm"
              />
              <Link to="/fasting" className="btn-ghost w-full mt-3 text-xs justify-center">
                Full timer <ChevronRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </section>
          )}

          {/* AI Insight */}
          {insight && (
            <section className="card border-brand-500/20" aria-labelledby="ai-insight-heading">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-brand-400" aria-hidden="true" />
                <h2 id="ai-insight-heading" className="text-sm font-semibold text-brand-400">AI Coach</h2>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">{insight}</p>
            </section>
          )}

          {/* Featured Recipe */}
          {featuredRecipe && (
            <section className="card" aria-labelledby="recipe-card-heading">
              <div className="flex items-center gap-2 mb-3">
                <Utensils className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <h2 id="recipe-card-heading" className="text-sm font-semibold text-white">Recipe Idea</h2>
              </div>
              {featuredRecipe.thumbnailUrl && (
                <img src={featuredRecipe.thumbnailUrl} alt={featuredRecipe.name}
                  className="w-full h-32 object-cover rounded-xl mb-3" loading="lazy" />
              )}
              <p className="font-semibold text-white text-sm mb-1">{featuredRecipe.name}</p>
              <p className="text-xs text-zinc-500">{featuredRecipe.category} · {featuredRecipe.area}</p>
              <Link to="/meal-planner" className="btn-ghost text-xs mt-3 w-full justify-center">
                See Meal Planner <ChevronRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
