/** Calculators page — 5 health calculators, no API calls, pure browser math */

import { useState } from 'react';
import {
  calculateBMI, calculateTDEE, calculateIBW,
  calculateCaloriesBurned, calculateCustomMacroSplit, ACTIVITIES
} from '../lib/calculators';
import type { ActivityLevel, HealthGoal } from '../lib/types';
import { Link } from 'react-router-dom';
import { Calculator, Scale, Flame, Activity, Utensils, Dumbbell, ChevronRight, Info } from 'lucide-react';

const TABS = [
  { id: 'bmi', label: 'BMI', icon: Scale },
  { id: 'tdee', label: 'Calorie Intake', icon: Flame },
  { id: 'ibw', label: 'Ideal Weight', icon: Utensils },
  { id: 'burned', label: 'Calories Burned', icon: Activity },
  { id: 'macro', label: 'Macro Split', icon: Dumbbell },
] as const;
type TabId = typeof TABS[number]['id'];

// ── Result Card ──
function ResultCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-brand-500/10 border border-brand-500/30 rounded-2xl p-6 mt-6 animate-scale-in">
      {children}
    </div>
  );
}

function ResultNumber({ value, unit, label }: { value: string | number; unit?: string; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-4xl font-black text-brand-400">
        {value}<span className="text-2xl text-brand-500 ml-1">{unit}</span>
      </div>
      <p className="text-sm text-zinc-400 mt-1">{label}</p>
    </div>
  );
}

// ── BMI Calculator ──
function BMICalc() {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const result = height && weight ? calculateBMI(parseFloat(weight), parseFloat(height)) : null;

  const bmiRanges = [
    { label: 'Underweight', min: 0, max: 18.5, color: '#60a5fa' },
    { label: 'Healthy', min: 18.5, max: 25, color: '#22c55e' },
    { label: 'Overweight', min: 25, max: 30, color: '#f59e0b' },
    { label: 'Obese', min: 30, max: 40, color: '#ef4444' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="bmi-h" className="label">Height (cm)</label>
          <input id="bmi-h" type="number" className="input" placeholder="175" value={height}
            onChange={(e) => setHeight(e.target.value)} min="50" max="250" />
        </div>
        <div>
          <label htmlFor="bmi-w" className="label">Weight (kg)</label>
          <input id="bmi-w" type="number" className="input" placeholder="70" value={weight}
            onChange={(e) => setWeight(e.target.value)} min="20" max="500" />
        </div>
      </div>

      {result && (
        <ResultCard>
          <ResultNumber value={result.bmi} label={result.label} />
          {/* BMI range bar */}
          <div className="mt-6">
            <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-2">
              {bmiRanges.map((r) => (
                <div key={r.label} className="flex-1 rounded-sm" style={{ backgroundColor: r.color, opacity: result.category === r.label.toLowerCase().replace('healthy', 'normal') ? 1 : 0.3 }} />
              ))}
            </div>
            <div className="flex justify-between text-xs text-zinc-500">
              {bmiRanges.map((r) => <span key={r.label}>{r.label}</span>)}
            </div>
          </div>
          <p className="text-center text-sm text-zinc-400 mt-4">
            Healthy range: <strong className="text-white">18.5 – 24.9</strong>
          </p>
          <div className="text-center mt-4">
            <Link to="/auth" className="btn-primary text-sm">
              Track your weight journey <ChevronRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
        </ResultCard>
      )}
    </div>
  );
}

// ── TDEE Calculator ──
function TDEECalc() {
  const [form, setForm] = useState({ age: '', sex: 'male' as 'male'|'female', height: '', weight: '', activity: 'moderate' as ActivityLevel, goal: 'lose_weight' as HealthGoal });
  const result = [form.age, form.height, form.weight].every(Boolean)
    ? calculateTDEE(parseFloat(form.weight), parseFloat(form.height), parseInt(form.age), form.sex, form.activity, form.goal)
    : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="tdee-age" className="label">Age</label>
          <input id="tdee-age" type="number" className="input" placeholder="25"
            value={form.age} onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))} />
        </div>
        <div>
          <label className="label">Sex</label>
          <div className="flex gap-2">
            {(['male', 'female'] as const).map((s) => (
              <button key={s} type="button"
                onClick={() => setForm((p) => ({ ...p, sex: s }))}
                className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all
                  ${form.sex === s ? 'bg-brand-500/15 border-brand-500 text-brand-400' : 'bg-surface-elevated border-surface-border text-zinc-400'}`}
                aria-pressed={form.sex === s}
              >{s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="tdee-h" className="label">Height (cm)</label>
          <input id="tdee-h" type="number" className="input" placeholder="175"
            value={form.height} onChange={(e) => setForm((p) => ({ ...p, height: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="tdee-w" className="label">Weight (kg)</label>
          <input id="tdee-w" type="number" className="input" placeholder="70"
            value={form.weight} onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))} />
        </div>
      </div>
      <div>
        <label htmlFor="tdee-activity" className="label">Activity Level</label>
        <select id="tdee-activity" className="input" value={form.activity}
          onChange={(e) => setForm((p) => ({ ...p, activity: e.target.value as ActivityLevel }))}>
          <option value="sedentary">Sedentary — little/no exercise</option>
          <option value="light">Light — 1-3 days/week</option>
          <option value="moderate">Moderate — 3-5 days/week</option>
          <option value="active">Very Active — 6-7 days/week</option>
          <option value="very_active">Athlete — hard exercise + physical job</option>
        </select>
      </div>
      <div>
        <label htmlFor="tdee-goal" className="label">Goal</label>
        <select id="tdee-goal" className="input" value={form.goal}
          onChange={(e) => setForm((p) => ({ ...p, goal: e.target.value as HealthGoal }))}>
          <option value="lose_weight">Lose Weight (−500 kcal/day)</option>
          <option value="maintain_weight">Maintain Weight</option>
          <option value="build_muscle">Build Muscle (+300 kcal/day)</option>
        </select>
      </div>
      {result && (
        <ResultCard>
          <div className="grid grid-cols-3 gap-4 text-center divide-x divide-surface-border">
            <div><p className="font-display text-3xl font-bold text-zinc-300">{result.bmr.toLocaleString()}</p><p className="text-xs text-zinc-500 mt-1">BMR (rest)</p></div>
            <div><p className="font-display text-3xl font-bold text-white">{result.tdee.toLocaleString()}</p><p className="text-xs text-zinc-500 mt-1">TDEE (active)</p></div>
            <div><p className="font-display text-3xl font-bold text-brand-400">{result.goalCalories.toLocaleString()}</p><p className="text-xs text-zinc-500 mt-1">Your Goal</p></div>
          </div>
          <div className="flex items-start gap-2 mt-4 p-3 bg-surface rounded-xl">
            <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-zinc-500">BMR is calories burned at rest. TDEE includes your activity. Your goal calories are TDEE adjusted for your target.</p>
          </div>
        </ResultCard>
      )}
    </div>
  );
}

// ── Ideal Body Weight ──
function IBWCalc() {
  const [height, setHeight] = useState('');
  const [sex, setSex] = useState<'male'|'female'>('male');
  const result = height ? calculateIBW(parseFloat(height), sex) : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="ibw-h" className="label">Height (cm)</label>
          <input id="ibw-h" type="number" className="input" placeholder="175" value={height}
            onChange={(e) => setHeight(e.target.value)} />
        </div>
        <div>
          <label className="label">Sex</label>
          <div className="flex gap-2">
            {(['male', 'female'] as const).map((s) => (
              <button key={s} type="button" onClick={() => setSex(s)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all
                  ${sex === s ? 'bg-brand-500/15 border-brand-500 text-brand-400' : 'bg-surface-elevated border-surface-border text-zinc-400'}`}
                aria-pressed={sex === s}
              >{s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
        </div>
      </div>
      {result && (
        <ResultCard>
          <ResultNumber value={result} unit="kg" label="Ideal Body Weight (Hamwi formula)" />
          <p className="text-center text-xs text-zinc-500 mt-3">Healthy range: {result - 5} – {result + 5} kg</p>
        </ResultCard>
      )}
    </div>
  );
}

// ── Calories Burned ──
function BurnedCalc() {
  const [activity, setActivity] = useState(ACTIVITIES[0].id);
  const [weight, setWeight] = useState('');
  const [duration, setDuration] = useState('');
  const act = ACTIVITIES.find((a) => a.id === activity)!;
  const result = weight && duration ? calculateCaloriesBurned(act.met, parseFloat(weight), parseFloat(duration)) : null;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="burn-activity" className="label">Activity</label>
        <select id="burn-activity" className="input" value={activity} onChange={(e) => setActivity(e.target.value)}>
          {ACTIVITIES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="burn-w" className="label">Weight (kg)</label>
          <input id="burn-w" type="number" className="input" placeholder="70" value={weight}
            onChange={(e) => setWeight(e.target.value)} />
        </div>
        <div>
          <label htmlFor="burn-d" className="label">Duration (min)</label>
          <input id="burn-d" type="number" className="input" placeholder="30" value={duration}
            onChange={(e) => setDuration(e.target.value)} />
        </div>
      </div>
      {result && (
        <ResultCard>
          <ResultNumber value={result.toLocaleString()} unit="kcal" label={`Estimated calories burned — ${act.label}`} />
          <p className="text-center text-xs text-zinc-500 mt-3">MET value: {act.met} · Formula: MET × weight × time(h)</p>
        </ResultCard>
      )}
    </div>
  );
}

// ── Macro Split ──
function MacroSplitCalc() {
  const [calories, setCalories] = useState('');
  const [split, setSplit] = useState<'cutting'|'bulking'|'maintaining'|'keto'>('maintaining');
  const result = calories ? calculateCustomMacroSplit(parseFloat(calories), split) : null;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="macro-cal" className="label">Daily Calorie Target</label>
        <input id="macro-cal" type="number" className="input" placeholder="2000 kcal" value={calories}
          onChange={(e) => setCalories(e.target.value)} />
      </div>
      <div>
        <label className="label">Goal</label>
        <div className="grid grid-cols-2 gap-2">
          {(['cutting', 'maintaining', 'bulking', 'keto'] as const).map((s) => (
            <button key={s} type="button" onClick={() => setSplit(s)}
              className={`py-2.5 rounded-xl text-sm font-medium border transition-all capitalize
                ${split === s ? 'bg-brand-500/15 border-brand-500 text-brand-400' : 'bg-surface-elevated border-surface-border text-zinc-400'}`}
              aria-pressed={split === s}
            >{s}</button>
          ))}
        </div>
      </div>
      {result && (
        <ResultCard>
          <div className="grid grid-cols-3 gap-4 text-center divide-x divide-surface-border">
            <div>
              <p className="font-display text-3xl font-bold text-blue-400">{result.protein}g</p>
              <p className="text-xs text-zinc-500 mt-1">Protein</p>
              <p className="text-xs text-zinc-600">{result.protein * 4} kcal</p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-amber-400">{result.carbs}g</p>
              <p className="text-xs text-zinc-500 mt-1">Carbs</p>
              <p className="text-xs text-zinc-600">{result.carbs * 4} kcal</p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-purple-400">{result.fat}g</p>
              <p className="text-xs text-zinc-500 mt-1">Fat</p>
              <p className="text-xs text-zinc-600">{result.fat * 9} kcal</p>
            </div>
          </div>
          <div className="flex gap-1 h-3 rounded-full overflow-hidden mt-5">
            {[
              { w: result.protein * 4 / parseFloat(calories) * 100, c: '#60a5fa' },
              { w: result.carbs * 4 / parseFloat(calories) * 100, c: '#f59e0b' },
              { w: result.fat * 9 / parseFloat(calories) * 100, c: '#c084fc' },
            ].map((seg, i) => (
              <div key={i} className="rounded-sm transition-all duration-500"
                style={{ width: `${seg.w}%`, backgroundColor: seg.c }} />
            ))}
          </div>
          <div className="flex justify-center mt-3">
            <Link to="/auth" className="btn-primary text-xs py-2">
              Set these as my targets <ChevronRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
        </ResultCard>
      )}
    </div>
  );
}

// ── Main Page ──
export default function Calculators() {
  const [activeTab, setActiveTab] = useState<TabId>('bmi');

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
          <Calculator className="w-8 h-8 text-brand-400" aria-hidden="true" />
          Health Calculators
        </h1>
        <p className="text-zinc-400 text-sm mt-2">
          All calculations run instantly in your browser. No sign-in required.
        </p>
      </header>

      {/* Tab switcher */}
      <nav className="flex gap-2 flex-wrap" role="tablist" aria-label="Calculator tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`calc-panel-${id}`}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
              border transition-all focus-visible:ring-2 focus-visible:ring-brand-400
              ${activeTab === id
                ? 'bg-brand-500/15 border-brand-500 text-brand-400'
                : 'bg-surface-card border-surface-border text-zinc-400 hover:border-zinc-600'
              }`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>

      {/* Calculator panels */}
      <div className="card max-w-2xl">
        <div id={`calc-panel-${activeTab}`} role="tabpanel" aria-label={TABS.find((t) => t.id === activeTab)?.label}>
          {activeTab === 'bmi' && <BMICalc />}
          {activeTab === 'tdee' && <TDEECalc />}
          {activeTab === 'ibw' && <IBWCalc />}
          {activeTab === 'burned' && <BurnedCalc />}
          {activeTab === 'macro' && <MacroSplitCalc />}
        </div>
      </div>

      {/* Info footer */}
      <div className="card max-w-2xl border-zinc-800">
        <h2 className="font-semibold text-white mb-2 text-sm">About These Calculators</h2>
        <p className="text-xs text-zinc-500 leading-relaxed">
          BMI uses the standard formula (weight/height²). BMR uses the Mifflin-St Jeor equation (most accurate).
          TDEE applies Harris-Benedict activity multipliers. IBW uses the Hamwi method. Calorie burn uses MET values
          from the Compendium of Physical Activities. Macro Split ratios are evidence-based for each goal.
          These are estimates — consult a healthcare professional for medical advice.
        </p>
      </div>
    </div>
  );
}
