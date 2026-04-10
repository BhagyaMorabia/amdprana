/** Macro progress bars for protein, carbs, fat */

interface MacroBarsProps {
  protein: number;
  proteinGoal: number;
  carbs: number;
  carbsGoal: number;
  fat: number;
  fatGoal: number;
}

interface MacroBarProps {
  label: string;
  value: number;
  goal: number;
  color: string;
  unit?: string;
}

function MacroBar({ label, value, goal, color, unit = 'g' }: MacroBarProps) {
  const pct = Math.min((value / Math.max(goal, 1)) * 100, 100);
  const isOver = value > goal;

  return (
    <div role="group" aria-label={`${label}: ${value}${unit} of ${goal}${unit}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm font-medium text-zinc-300">{label}</span>
        </div>
        <span className="text-sm text-zinc-400">
          <span className="font-semibold text-white">{Math.round(value)}{unit}</span>
          <span className="text-zinc-600"> / {goal}{unit}</span>
        </span>
      </div>
      <div className="h-2.5 bg-surface-elevated rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: isOver ? '#ef4444' : color,
            boxShadow: `0 0 8px ${color}60`,
          }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={goal}
        />
      </div>
    </div>
  );
}

export default function MacroBars({ protein, proteinGoal, carbs, carbsGoal, fat, fatGoal }: MacroBarsProps) {
  return (
    <div className="space-y-4">
      <MacroBar label="Protein" value={protein} goal={proteinGoal} color="#60a5fa" />
      <MacroBar label="Carbs" value={carbs} goal={carbsGoal} color="#f59e0b" />
      <MacroBar label="Fat" value={fat} goal={fatGoal} color="#c084fc" />
    </div>
  );
}
