/** Water intake tracker — click glasses to log hydration */

import { Droplets, Plus, Minus } from 'lucide-react';

interface WaterTrackerProps {
  currentMl: number;
  goalMl: number;
  onAdd: (glasses: number) => void;
}

const GLASS_ML = 250;

export default function WaterTracker({ currentMl, goalMl, onAdd }: WaterTrackerProps) {
  const glasses = Math.floor(currentMl / GLASS_ML);
  const goalGlasses = Math.ceil(goalMl / GLASS_ML);
  const pct = Math.min(currentMl / Math.max(goalMl, 1), 1);

  return (
    <div className="space-y-4" role="group" aria-label="Water intake tracker">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-400" aria-hidden="true" />
          <span className="font-medium text-white">Water</span>
        </div>
        <span className="text-sm text-zinc-400">
          <span className="font-semibold text-blue-400">{currentMl}ml</span>
          <span className="text-zinc-600"> / {goalMl}ml</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out bg-blue-400"
          style={{ width: `${pct * 100}%`, boxShadow: '0 0 8px rgba(96, 165, 250, 0.5)' }}
          role="progressbar"
          aria-valuenow={currentMl}
          aria-valuemin={0}
          aria-valuemax={goalMl}
          aria-label={`${Math.round(pct * 100)}% of daily water goal`}
        />
      </div>

      {/* Glass icons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {Array.from({ length: Math.min(goalGlasses, 12) }, (_, i) => (
          <button
            key={i}
            onClick={() => onAdd(i < glasses ? -1 : 1)}
            className={`w-8 h-10 rounded-lg border transition-all duration-200 flex items-end justify-center pb-1
              ${i < glasses
                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                : 'bg-surface-elevated border-surface-border text-zinc-600 hover:border-blue-500/50'
              }`}
            aria-label={`Glass ${i + 1} ${i < glasses ? '(logged)' : '(not logged)'}`}
            title={`${(i + 1) * GLASS_ML}ml`}
          >
            <Droplets className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => onAdd(-1)}
          disabled={glasses === 0}
          className="btn-ghost text-sm py-1.5 px-3 text-zinc-400 disabled:opacity-30"
          aria-label="Remove one glass"
        >
          <Minus className="w-3.5 h-3.5" aria-hidden="true" /> Remove
        </button>
        <button
          onClick={() => onAdd(1)}
          className="btn-primary text-sm py-1.5 px-4 flex-1"
          aria-label="Add one glass of water (250ml)"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Glass (250ml)
        </button>
      </div>
    </div>
  );
}
