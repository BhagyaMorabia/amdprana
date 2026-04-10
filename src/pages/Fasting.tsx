/** Fasting Timer page — full intermittent fasting suite */

import { useEffect, useState } from 'react';
import { useFasting } from '../hooks/useFasting';
import { generateFastingTips } from '../lib/gemini';
import FastingTimer from '../components/FastingTimer';
import type { FastingPlan } from '../lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Flame, Info, Sparkles, Clock } from 'lucide-react';

const PLAN_INFO: Record<FastingPlan, { description: string; emoji: string; benefits: string[] }> = {
  '16:8': {
    emoji: '⭐',
    description: 'Fast for 16 hours, eat within an 8-hour window. The most popular and sustainable protocol.',
    benefits: ['Weight loss', 'Improved insulin sensitivity', 'Cellular repair (autophagy)', 'Sustainable for daily practice'],
  },
  '18:6': {
    emoji: '🔥',
    description: 'Fast for 18 hours, eat within a 6-hour window. More aggressive fat burning.',
    benefits: ['Enhanced fat burn', 'Deeper ketosis', 'Greater autophagy', 'Recommended for experienced fasters'],
  },
  '20:4': {
    emoji: '⚡',
    description: 'Warrior diet — fast 20 hours, eat one large meal in a 4-hour window.',
    benefits: ['Maximum autophagy', 'Hormonal benefits', 'Growth hormone surge', 'Advanced protocol'],
  },
  '5:2': {
    emoji: '📅',
    description: 'Eat normally 5 days, restrict to ~500 calories on 2 non-consecutive days per week.',
    benefits: ['Flexible schedule', 'Clinically studied', 'Good for weekday discipline', 'No daily restriction'],
  },
  '6:1': {
    emoji: '🧘',
    description: 'One complete fasting day per week, eat normally the other 6 days.',
    benefits: ['Minimal restriction', 'Good for beginners', 'Weekly reset', 'Easy to maintain'],
  },
  custom: {
    emoji: '🎯',
    description: 'Set your own fasting and eating windows. Fully customizable to your schedule.',
    benefits: ['Total flexibility', 'Adapt to your lifestyle', 'Custom notifications', 'Perfect for shift workers'],
  },
};

const PLANS: FastingPlan[] = ['16:8', '18:6', '20:4', '5:2', '6:1'];

// Mock fasting history for demo (replace with real Firestore data)
const mockHistory = [
  { day: 'Mon', hours: 16 }, { day: 'Tue', hours: 14 },
  { day: 'Wed', hours: 16 }, { day: 'Thu', hours: 18 },
  { day: 'Fri', hours: 16 }, { day: 'Sat', hours: 12 },
  { day: 'Sun', hours: 16 },
];

export default function Fasting() {
  const { state, selectedPlan, setSelectedPlan, startFast, stopFast, PLAN_HOURS } = useFasting();
  const [tips, setTips] = useState<string[]>([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  const planInfo = PLAN_INFO[selectedPlan];

  // Load Gemini tips when plan changes or fast is active
  useEffect(() => {
    if (!state.isActive) return;
    setTipsLoading(true);
    generateFastingTips(state.plan, state.hoursIntoFast)
      .then(setTips)
      .catch(() => setTips([
        'Stay hydrated — drink water, black coffee, or plain herbal tea.',
        'Keep yourself occupied with work or light activity to reduce hunger focus.',
        'Electrolytes (zinc, magnesium) can help prevent headaches during fasting.',
      ]))
      .finally(() => setTipsLoading(false));
  }, [state.isActive, state.plan]);

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
          <Clock className="w-8 h-8 text-amber-400" aria-hidden="true" />
          Intermittent Fasting
        </h1>
        <p className="text-zinc-400 text-sm mt-2">
          Your fasting timer persists across sessions — close the tab and come back anytime.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left — Timer + plan selector */}
        <div className="lg:col-span-2 space-y-6">

          {/* Plan selector */}
          {!state.isActive && (
            <section className="card" aria-labelledby="plan-selector-heading">
              <h2 id="plan-selector-heading" className="section-title mb-4">Choose Your Plan</h2>
              <div className="flex gap-2 flex-wrap">
                {PLANS.map((plan) => (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all
                      ${selectedPlan === plan
                        ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                        : 'bg-surface-elevated border-surface-border text-zinc-400 hover:border-zinc-600'}`}
                    aria-pressed={selectedPlan === plan}
                  >
                    {plan}
                  </button>
                ))}
              </div>

              {/* Plan info */}
              <div className="mt-5 p-4 bg-surface-elevated rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden="true">{planInfo.emoji}</span>
                  <div>
                    <p className="font-semibold text-white text-sm mb-1">{selectedPlan} — {PLAN_HOURS[selectedPlan].fastHours}h fast / {PLAN_HOURS[selectedPlan].eatHours}h eat</p>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-3">{planInfo.description}</p>
                    <div className="grid grid-cols-2 gap-1">
                      {planInfo.benefits.map((b) => (
                        <div key={b} className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden="true" />
                          {b}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Timer */}
          <section className="card flex flex-col items-center py-10" aria-labelledby="timer-heading">
            <h2 id="timer-heading" className="sr-only">Fasting Timer</h2>
            <FastingTimer
              isActive={state.isActive}
              plan={state.isActive ? state.plan : selectedPlan}
              phase={state.phase}
              progress={state.progress}
              hoursIntoFast={state.hoursIntoFast}
              minutesRemaining={state.minutesRemaining}
              secondsRemaining={state.secondsRemaining}
              streak={state.streak}
              onStart={startFast}
              onStop={stopFast}
              size="lg"
            />
          </section>

          {/* Fasting history chart */}
          <section className="card" aria-labelledby="history-heading">
            <h2 id="history-heading" className="section-title mb-4">This Week's Fasts</h2>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={mockHistory} margin={{ left: -20 }}>
                <CartesianGrid stroke="#1a2420" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v: number) => `${v}h`} />
                <Tooltip
                  contentStyle={{ background: '#111916', border: '1px solid #2a3b30', borderRadius: 12 }}
                  formatter={(v: any) => [`${v}h fasted`, 'Duration']}
                  labelStyle={{ color: '#9ca3af' }}
                  itemStyle={{ color: '#f59e0b' }}
                />
                <Bar dataKey="hours" fill="#f59e0b" radius={[4, 4, 0, 0]}
                  maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
            {/* Target line label */}
            <p className="text-xs text-zinc-600 mt-2 text-center">
              Target: {PLAN_HOURS[selectedPlan].fastHours}h per day
            </p>
          </section>
        </div>

        {/* Right sidebar — Streak + Tips */}
        <div className="space-y-6">

          {/* Streak card */}
          <section className="card" aria-labelledby="streak-heading">
            <h2 id="streak-heading" className="section-title flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-amber-400" aria-hidden="true" /> Streak
            </h2>
            <div className="text-center py-4">
              <p className="font-display text-6xl font-black text-amber-400">{state.streak || 0}</p>
              <p className="text-zinc-400 text-sm mt-2">consecutive days</p>
              <div className="mt-4 pt-4 border-t border-surface-border">
                <p className="text-xs text-zinc-600">
                  {state.streak >= 7 ? '🏆 One week streak! Incredible.' :
                   state.streak >= 3 ? '💪 Building momentum. Keep going!' :
                   state.isActive ? '🔥 Currently fasting...' :
                   'Start your first fast to build a streak!'}
                </p>
              </div>
            </div>
          </section>

          {/* AI Tips */}
          <section className="card" aria-labelledby="tips-heading">
            <h2 id="tips-heading" className="section-title flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-brand-400" aria-hidden="true" /> AI Tips
            </h2>
            {tipsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-12 rounded-xl" aria-hidden="true" />
                ))}
              </div>
            ) : tips.length > 0 ? (
              <ul className="space-y-3">
                {tips.map((tip, i) => (
                  <li key={i} className="flex gap-3 text-sm text-zinc-300 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-xs
                      flex items-center justify-center shrink-0 mt-0.5 font-bold" aria-hidden="true">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <Info className="w-8 h-8 text-zinc-600 mx-auto mb-2" aria-hidden="true" />
                <p className="text-sm text-zinc-500">Start a fast to get AI-powered tips tailored to your plan.</p>
              </div>
            )}
          </section>

          {/* Fasting science quick facts */}
          <section className="card" aria-labelledby="facts-heading">
            <h2 id="facts-heading" className="text-sm font-semibold text-zinc-400 mb-3">Science Corner</h2>
            <ul className="space-y-3 text-xs text-zinc-500">
              {[
                { h: '12-16h', t: 'Ketosis begins. Body switches to fat burning.' },
                { h: '16-18h', t: 'Autophagy peaks. Cells start self-cleaning.' },
                { h: '24h', t: 'Maximum growth hormone surge (+1300% in women).' },
                { h: '72h', t: 'Deep immune system renewal begins.' },
              ].map(({ h, t }) => (
                <li key={h} className="flex gap-3">
                  <span className="badge bg-amber-500/10 text-amber-400 shrink-0">{h}</span>
                  <span className="leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
