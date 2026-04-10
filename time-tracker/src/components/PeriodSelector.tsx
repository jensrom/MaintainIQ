import clsx from 'clsx';
import type { PeriodKey, DateRange } from '../types';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: '1uge', label: '1 uge' },
  { key: '1måned', label: '1 måned' },
  { key: '3måneder', label: '3 måneder' },
  { key: '6måneder', label: '6 måneder' },
  { key: '12måneder', label: '12 måneder' },
  { key: 'brugerdefineret', label: 'Brugerdefineret' },
];

interface Props {
  selected: PeriodKey;
  customRange: DateRange;
  onChange: (period: PeriodKey) => void;
  onCustomRange: (range: DateRange) => void;
}

export function PeriodSelector({ selected, customRange, onChange, onCustomRange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {PERIODS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={clsx(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              selected === key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {selected === 'brugerdefineret' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customRange.from}
            onChange={(e) => onCustomRange({ ...customRange, from: e.target.value })}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400 text-sm">–</span>
          <input
            type="date"
            value={customRange.to}
            onChange={(e) => onCustomRange({ ...customRange, to: e.target.value })}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
}
