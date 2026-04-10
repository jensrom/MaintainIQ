import { Moon, Sun } from 'lucide-react';
import { useStore } from '../store';
import { formatDisplay, today } from '../utils/dates';
import { getHolidayName } from '../utils/danishHolidays';

export function Topbar() {
  const { settings, updateSettings } = useStore();
  const todayStr = today();
  const holidayToday = getHolidayName(todayStr);

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatDisplay(todayStr)}
        </span>
        {holidayToday && (
          <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
            {holidayToday}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => updateSettings({ darkMode: !settings.darkMode })}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={settings.darkMode ? 'Skift til lystema' : 'Skift til mørkt tema'}
        >
          {settings.darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
