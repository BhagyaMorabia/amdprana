/** Live fasting countdown timer widget */

import { Play, Square, Clock, Flame } from 'lucide-react';
import type { FastingPlan } from '../lib/types';

interface FastingTimerProps {
  isActive: boolean;
  plan: FastingPlan;
  phase: 'fasting' | 'eating';
  progress: number; // 0-1
  hoursIntoFast: number;
  minutesRemaining: number;
  secondsRemaining: number;
  streak: number;
  onStart: (plan: FastingPlan) => void;
  onStop: () => void;
  size?: 'sm' | 'lg';
}

export default function FastingTimer({
  isActive, plan, phase, progress, hoursIntoFast,
  minutesRemaining, secondsRemaining, streak, onStart, onStop, size = 'sm'
}: FastingTimerProps) {
  const totalHours = parseInt(plan.split(':')[0]) || 16;
  const circumference = size === 'lg' ? 753 : 502; // 2πr for r=120 or r=80
  const r = size === 'lg' ? 120 : 80;
  const svgSize = size === 'lg' ? 280 : 200;
  const cx = svgSize / 2;
  const dashOffset = circumference * (1 - progress);

  const isFasting = phase === 'fasting';
  const phaseColor = isFasting ? '#f59e0b' : '#22c55e';
  const bgColor = isFasting ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)';

  const pad = (n: number) => String(n).padStart(2, '0');
  const hrsRemaining = Math.floor(minutesRemaining / 60);
  const minsRemaining = minutesRemaining % 60;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Circular Timer */}
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="#1a2420" strokeWidth={size === 'lg' ? 16 : 12} />
          {isActive && (
            <circle
              cx={cx} cy={cx} r={r}
              fill="none"
              stroke={phaseColor}
              strokeWidth={size === 'lg' ? 16 : 12}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{
                transition: 'stroke-dashoffset 1s linear',
                filter: `drop-shadow(0 0 8px ${phaseColor}80)`,
              }}
            />
          )}
        </svg>

        {/* Center content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-full"
          style={{ background: bgColor }}
        >
          {isActive ? (
            <>
              <span className="text-xs font-medium uppercase tracking-widest mb-1"
                style={{ color: phaseColor }}>
                {isFasting ? '⚡ Fasting' : '🍽 Eating'}
              </span>
              <span className={`font-display font-bold text-white leading-none
                ${size === 'lg' ? 'text-4xl' : 'text-2xl'}`}>
                {pad(hrsRemaining)}:{pad(minsRemaining)}:{pad(secondsRemaining)}
              </span>
              <span className="text-xs text-zinc-500 mt-1">remaining</span>
              <span className="text-xs text-zinc-400 mt-0.5">
                {hoursIntoFast.toFixed(1)}h / {totalHours}h
              </span>
            </>
          ) : (
            <>
              <Clock className="w-8 h-8 text-zinc-500 mb-2" aria-hidden="true" />
              <span className="text-sm text-zinc-400 font-medium">Not fasting</span>
              <span className="text-xs text-zinc-600 mt-1">{plan} plan</span>
            </>
          )}
        </div>
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1.5">
          <Flame className="w-4 h-4 text-amber-400" aria-hidden="true" />
          <span className="text-sm font-semibold text-amber-400">{streak} day streak</span>
        </div>
      )}

      {/* Controls */}
      {isActive ? (
        <button
          onClick={onStop}
          className="btn-secondary gap-2 text-red-400 border-red-500/30 hover:border-red-500"
          aria-label="Stop current fast"
        >
          <Square className="w-4 h-4 fill-current" aria-hidden="true" /> End Fast
        </button>
      ) : (
        <button
          onClick={() => onStart(plan)}
          className="btn-primary"
          aria-label={`Start ${plan} intermittent fast`}
        >
          <Play className="w-4 h-4 fill-current" aria-hidden="true" /> Start Fast
        </button>
      )}
    </div>
  );
}
