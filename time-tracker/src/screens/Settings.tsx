import { useState } from 'react';
import { Save, CheckCircle, Database, Palette, Clock } from 'lucide-react';
import { useStore } from '../store';
import type { TimeCategory } from '../types';
import { DEFAULT_CATEGORIES, CATEGORY_COLORS } from '../types';

const CATEGORY_KEYS: Array<{ cat: TimeCategory; key: 'salgsmøde' | 'support' | 'grønne' | 'intern' | 'sitemanager' }> = [
  { cat: 'Salgsmøde', key: 'salgsmøde' },
  { cat: 'Support', key: 'support' },
  { cat: 'Grønne timer', key: 'grønne' },
  { cat: 'Intern timer', key: 'intern' },
  { cat: 'Site Manager', key: 'sitemanager' },
];

export function Settings() {
  const { settings, updateSettings } = useStore();
  const [saved, setSaved] = useState(false);
  const [localWeekly, setLocalWeekly] = useState(settings.weeklyHours.toString());
  const [localCategories, setLocalCategories] = useState({ ...settings.categoryNames });

  function handleSave() {
    const parsed = parseFloat(localWeekly);
    if (isNaN(parsed) || parsed <= 0 || parsed > 80) return;
    updateSettings({
      weeklyHours: parsed,
      categoryNames: localCategories,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleCategoryChange(key: string, value: string) {
    setLocalCategories((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Indstillinger</h1>

      {/* Normtime */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-blue-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Normtid</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Ugentlige normtimer
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={localWeekly}
              onChange={(e) => setLocalWeekly(e.target.value)}
              min="1"
              max="80"
              step="0.5"
              className="w-28 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">timer/uge</span>
            <span className="text-xs text-gray-400">
              = {(parseFloat(localWeekly || '0') / 5).toFixed(1)}t/dag
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Default: 37 timer (Jobløn / funktionæroverenskomst)
          </p>
        </div>
      </div>

      {/* Category names */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette size={18} className="text-purple-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Kategorier</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Omdøb kategorierne til din organisation. Farverne er faste.
        </p>
        <div className="space-y-3">
          {CATEGORY_KEYS.map(({ cat, key }) => (
            <div key={key} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[cat] }}
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={localCategories[key]}
                  onChange={(e) => handleCategoryChange(key, e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <span className="text-xs text-gray-400 w-28 shrink-0">
                (standard: {cat})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Database path */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database size={18} className="text-green-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Database</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Database-mappe
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={settings.databasePath || 'Lokal browser-lagring (localStorage)'}
                readOnly
                placeholder="Ikke valgt — data gemmes i browseren"
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 cursor-not-allowed"
              />
              <button
                disabled
                className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
                title="Tilgængelig i desktop-versionen (.exe)"
              >
                Vælg mappe…
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Valg af mappe kræver desktop-versionen (.exe via Electron). I web-versionen gemmes data i browseren.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3">
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">
              Nuværende lagringsmetode
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Data er gemt i din browsers localStorage. Brug Export-funktionen herunder for at tage en sikkerhedskopi.
            </p>
          </div>
        </div>
      </div>

      {/* Dark mode */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Udseende</h2>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Mørkt tema</p>
            <p className="text-xs text-gray-400 mt-0.5">Skift mellem lyst og mørkt farvetema</p>
          </div>
          <div
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${settings.darkMode ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.darkMode ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </div>
        </label>
      </div>

      {/* Export notice */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Export</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Export til Excel/CSV er tilgængeligt i desktop-versionen (.exe). Det vil indeholde alle tidsregistreringer for en valgfri periode.
        </p>
        <div className="flex gap-3">
          <button
            disabled
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed"
          >
            Export til Excel (.xlsx)
          </button>
          <button
            disabled
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed"
          >
            Export til CSV
          </button>
        </div>
      </div>

      {/* Kategori preview */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Forhåndsvisning af kategorier</h2>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_CATEGORIES.map((cat, i) => {
            const key = CATEGORY_KEYS[i].key;
            const displayName = localCategories[key] || cat;
            return (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: CATEGORY_COLORS[cat] }}
              >
                <span
                  className="w-2 h-2 rounded-full bg-white/30"
                />
                {displayName}
              </span>
            );
          })}
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3 pb-6">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Save size={16} />
          Gem indstillinger
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 font-medium">
            <CheckCircle size={16} />
            Gemt!
          </span>
        )}
      </div>
    </div>
  );
}
