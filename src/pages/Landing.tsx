/** Landing page — converts visitors to sign-ups */

import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Timer, CalendarDays, MapPin, BarChart3,
  ChevronRight, Star, Camera, Search, Utensils, ArrowRight,
  CheckCircle2, Flame
} from 'lucide-react';
import { useState } from 'react';
import { calculateBMI } from '../lib/calculators';

// ---- Sub-components ----

function FeatureCard({ icon: Icon, title, description, badge }: {
  icon: React.ElementType; title: string; description: string; badge: string;
}) {
  return (
    <div className="card-hover group cursor-default">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center
          group-hover:bg-brand-500/25 transition-colors shrink-0">
          <Icon className="w-5 h-5 text-brand-400" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white">{title}</h3>
            <span className="badge bg-brand-500/15 text-brand-400 text-[10px]">{badge}</span>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

function TestimonialCard({ name, location, quote, lost }: {
  name: string; location: string; quote: string; lost: string;
}) {
  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden="true" />
        ))}
      </div>
      <p className="text-zinc-300 text-sm leading-relaxed italic">"{quote}"</p>
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-surface-border">
        <div>
          <p className="font-semibold text-white text-sm">{name}</p>
          <p className="text-xs text-zinc-500">{location}</p>
        </div>
        <div className="text-right">
          <p className="text-brand-400 font-bold text-lg leading-none">{lost}</p>
          <p className="text-xs text-zinc-500">lost</p>
        </div>
      </div>
    </div>
  );
}

const GOALS = [
  { emoji: '⚖️', label: 'Lose Weight', color: 'text-blue-400' },
  { emoji: '💪', label: 'Build Muscle', color: 'text-brand-400' },
  { emoji: '🥗', label: 'Eat Balanced', color: 'text-lime-400' },
  { emoji: '📊', label: 'Track Macros', color: 'text-purple-400' },
  { emoji: '🧘', label: 'Eat Mindfully', color: 'text-amber-400' },
  { emoji: '🚫', label: 'Curb Cravings', color: 'text-red-400' },
  { emoji: '🔁', label: 'Build Routines', color: 'text-cyan-400' },
  { emoji: '✅', label: 'Maintain Weight', color: 'text-emerald-400' },
];

// ---- Inline BMI Calculator ----
function InlineBMICalculator() {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [result, setResult] = useState<{ bmi: number; label: string; color: string } | null>(null);

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h > 0 && w > 0) setResult(calculateBMI(w, h));
  };

  return (
    <section className="py-20 px-4 bg-surface-card/50" aria-labelledby="bmi-calc-heading">
      <div className="max-w-xl mx-auto text-center">
        <div className="badge bg-brand-500/15 text-brand-400 mb-4 mx-auto">Free Calculator</div>
        <h2 id="bmi-calc-heading" className="font-display text-3xl font-bold text-white mb-3">
          Check Your BMI Right Now
        </h2>
        <p className="text-zinc-400 mb-8">No sign-up required. Instant result.</p>

        <form onSubmit={calculate} className="card">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="bmi-height" className="label">Height (cm)</label>
              <input id="bmi-height" type="number" placeholder="175" value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="input" min="50" max="250" required aria-describedby="bmi-result" />
            </div>
            <div>
              <label htmlFor="bmi-weight" className="label">Weight (kg)</label>
              <input id="bmi-weight" type="number" placeholder="70" value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="input" min="20" max="500" required aria-describedby="bmi-result" />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full">
            Calculate BMI <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>

          {result && (
            <div id="bmi-result" className="mt-4 p-4 bg-surface-elevated rounded-xl text-center
              animate-fade-in" role="status" aria-live="polite">
              <p className="font-display text-4xl font-bold" style={{ color: result.color }}>
                {result.bmi}
              </p>
              <p className="font-semibold mt-1" style={{ color: result.color }}>{result.label}</p>
              <p className="text-xs text-zinc-500 mt-2">
                Track your health journey — <Link to="/auth" className="text-brand-400 hover:underline">
                  create a free account
                </Link>
              </p>
            </div>
          )}
        </form>

        <p className="text-xs text-zinc-600 mt-4">
          Also available: TDEE, Ideal Weight, Calories Burned, Macro Split calculators
          → <Link to="/calculators" className="text-brand-400 hover:underline">See all calculators</Link>
        </p>
      </div>
    </section>
  );
}

// ---- Main Landing Page ----
export default function Landing() {
  const { user } = useAuth();
  const ctaHref = user ? '/dashboard' : '/auth';
  const ctaText = user ? 'Go to Dashboard' : 'Get Your Free Plan';

  return (
    <div className="bg-surface">
      {/* ── Hero ── */}
      <section className="bg-hero-gradient min-h-[90vh] flex items-center px-4 pt-16 pb-24"
        aria-label="Hero section">
        <div className="max-w-7xl mx-auto w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 badge bg-brand-500/15 text-brand-400
              border border-brand-500/30 mb-6 px-4 py-2">
              <Flame className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Powered by Gemini AI · 100% Free</span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-black text-white leading-[1.05] mb-6">
              Eat Smart.{' '}
              <span className="text-gradient">Live Better.</span>
            </h1>

            <p className="text-xl text-zinc-400 leading-relaxed mb-8 max-w-xl">
              Your AI-powered food intelligence platform. Track calories, scan meals with AI,
              set fasting timers, and discover healthy restaurants nearby.
              Built entirely for the web.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Link to={ctaHref} className="btn-primary text-base px-8 py-3.5 shadow-glow">
                {ctaText} <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link to="/calculators" className="btn-secondary text-base px-8 py-3.5">
                Free Calculators
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap gap-6 text-sm text-zinc-500">
              {[
                '✓ No app download needed',
                '✓ Zero cost, no credit card',
                '✓ AI photo food scanning',
                '✓ Works in any browser',
              ].map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Goals Grid ── */}
      <section className="py-20 px-4" aria-labelledby="goals-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 id="goals-heading" className="font-display text-4xl font-bold text-white mb-4">
              What's Your Goal?
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              Prana adapts to your personal health objective and builds a custom plan around it.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {GOALS.map(({ emoji, label, color }) => (
              <Link
                key={label}
                to={user ? '/dashboard' : '/auth'}
                className="card-hover flex flex-col items-center gap-3 py-6 text-center group"
                aria-label={`Start with goal: ${label}`}
              >
                <span className="text-3xl" aria-hidden="true">{emoji}</span>
                <span className={`text-sm font-semibold ${color}`}>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-4 bg-surface-card/30" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 id="features-heading" className="font-display text-4xl font-bold text-white mb-4">
              Everything You Need. Nothing You Don't.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon={Camera}
              title="AI Food Scanner"
              description="Upload any food photo — Gemini analyzes it and logs the nutritional breakdown instantly. No barcode needed."
              badge="Gemini Flash"
            />
            <FeatureCard
              icon={Timer}
              title="Fasting Timer"
              description="16:8, 18:6, 20:4, 5:2 and custom plans. Live countdown persists across sessions so you never lose track."
              badge="Firestore"
            />
            <FeatureCard
              icon={CalendarDays}
              title="AI Meal Planner"
              description="Tell Gemini your goal and dietary preferences. Get a personalized 7-day meal plan in seconds."
              badge="Gemini Flash"
            />
            <FeatureCard
              icon={Search}
              title="Food Database"
              description="600,000+ foods from USDA FoodData Central + Open Food Facts. Full macro and micronutrient data."
              badge="Free API"
            />
            <FeatureCard
              icon={BarChart3}
              title="Progress Analytics"
              description="Calorie trends, macro history, weight progress, streak heatmaps. Your health story told through charts."
              badge="Recharts"
            />
            <FeatureCard
              icon={MapPin}
              title="Nearby Healthy Eats"
              description="Google Maps integration finds healthy restaurants and grocery stores near you, filtered by diet type."
              badge="Maps API"
            />
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 px-4" aria-labelledby="how-it-works-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 id="how-it-works-heading" className="font-display text-4xl font-bold text-white mb-4">
              Three Steps to Better Health
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Log Your Food', desc: 'Search 600K+ foods, scan a photo with AI, or enter manually. Takes under 30 seconds per meal.', icon: Utensils },
              { step: '02', title: 'Get Insights', desc: 'See your calorie ring fill up, review macros, and let Gemini tell you what to adjust today.', icon: BarChart3 },
              { step: '03', title: 'Build Habits', desc: 'Fasting streaks, meal plans, and weekly AI summaries turn one-off actions into lasting routines.', icon: Flame },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="flex flex-col items-center text-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-brand-500/15 border border-brand-500/30
                    flex items-center justify-center">
                    <Icon className="w-7 h-7 text-brand-400" aria-hidden="true" />
                  </div>
                  <span className="absolute -top-2 -right-2 font-display font-black text-xs
                    text-brand-400 bg-surface border border-brand-500/30 rounded-full
                    w-6 h-6 flex items-center justify-center">
                    {step.slice(1)}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-white">{title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Inline BMI Calculator ── */}
      <InlineBMICalculator />

      {/* ── Testimonials ── */}
      <section className="py-20 px-4" aria-labelledby="testimonials-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 id="testimonials-heading" className="font-display text-4xl font-bold text-white mb-4">
              Real People, Real Results
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard
              name="Priya M."
              location="Mumbai, India"
              quote="The AI photo scanner changed everything. I just snap my thali and the macros are logged instantly. The fasting timer keeps me accountable on 16:8."
              lost="8 kg"
            />
            <TestimonialCard
              name="James K."
              location="London, UK"
              quote="I've tried every calorie app. Prana is the only one where I didn't have to download anything. The meal planner gave me a full week in 10 seconds."
              lost="12 kg"
            />
            <TestimonialCard
              name="Sofia R."
              location="São Paulo, Brazil"
              quote="The macro split calculator alone is worth it. Other apps don't have it. I finally understand exactly how much protein I need for my muscle-building goal."
              lost="5 kg"
            />
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-4 bg-hero-gradient" aria-label="Call to action">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-5xl font-black text-white leading-tight mb-6">
            Start your health journey{' '}
            <span className="text-gradient">today.</span>
          </h2>
          <p className="text-zinc-400 text-lg mb-10">
            Free forever. No app download. AI-powered. Built with Google.
          </p>
          <Link to={ctaHref} className="btn-primary text-lg px-10 py-4 shadow-glow">
            {ctaText} <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </Link>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-zinc-600">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-600" aria-hidden="true" /> No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-600" aria-hidden="true" /> 30-second setup
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-600" aria-hidden="true" /> Cancel anytime
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
