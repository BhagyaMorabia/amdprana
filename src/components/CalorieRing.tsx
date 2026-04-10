/**
 * CalorieRing — SVG donut chart showing consumed vs. daily goal
 * Animates from 0 on mount using CSS stroke-dashoffset trick
 */

import { useEffect, useRef } from 'react';

interface CalorieRingProps {
  consumed: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
}

export default function CalorieRing({ consumed, goal, size = 200, strokeWidth = 18 }: CalorieRingProps) {
  const progressRef = useRef<SVGCircleElement>(null);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(consumed / Math.max(goal, 1), 1);
  const remaining = Math.max(0, goal - consumed);
  const isOver = consumed > goal;

  useEffect(() => {
    if (!progressRef.current) return;
    // Animate from empty to current value
    progressRef.current.style.transition = 'none';
    progressRef.current.style.strokeDashoffset = String(circumference);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (progressRef.current) {
          progressRef.current.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
          progressRef.current.style.strokeDashoffset = String(circumference * (1 - pct));
        }
      });
    });
  }, [consumed, goal, circumference, pct]);

  const arcColor = isOver ? '#ef4444' : pct > 0.9 ? '#f59e0b' : '#22c55e';
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="flex flex-col items-center gap-4" role="img" aria-label={`Calorie ring: ${consumed} of ${goal} calories consumed`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke="#1a2420"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            ref={progressRef}
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke={arcColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            style={{ filter: `drop-shadow(0 0 8px ${arcColor}60)` }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-bold text-white leading-none">
            {remaining.toLocaleString()}
          </span>
          <span className="text-xs text-zinc-400 mt-1 font-medium">
            {isOver ? 'over limit' : 'kcal left'}
          </span>
          <div className="mt-2 px-3 py-1 bg-surface-elevated rounded-full">
            <span className="text-xs text-zinc-300">
              <span className="text-white font-semibold">{consumed.toLocaleString()}</span>
              <span className="text-zinc-500"> / {goal.toLocaleString()}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-6 text-center">
        <div>
          <p className="font-display text-xl font-bold text-white">{consumed.toLocaleString()}</p>
          <p className="text-xs text-zinc-500">Consumed</p>
        </div>
        <div className="w-px bg-surface-border" />
        <div>
          <p className="font-display text-xl font-bold" style={{ color: arcColor }}>
            {goal.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500">Goal</p>
        </div>
        <div className="w-px bg-surface-border" />
        <div>
          <p className="font-display text-xl font-bold text-zinc-300">{Math.round(pct * 100)}%</p>
          <p className="text-xs text-zinc-500">Complete</p>
        </div>
      </div>
    </div>
  );
}
