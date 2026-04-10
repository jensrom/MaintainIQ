import { useState } from 'react';
import { Plus, MapPin, CheckCircle, Trash2, AlertCircle } from 'lucide-react';
import { useStore, categories } from '../store';
import type { TimeCategory, OnSiteType } from '../types';
import { CATEGORY_COLORS } from '../types';
import { today, formatDisplay, formatDayName } from '../utils/dates';
import { getHolidayName, isWeekend } from '../utils/danishHolidays';
import { CategoryBadge } from '../components/CategoryBadge';
import clsx from 'clsx';

const ON_SITE_TYPES: OnSiteType[] = ['Undervisning', 'Installation', 'Salgsmøde'];

export function TimeTracking() {
  const { clients, cases, timeEntries, addTimeEntry, deleteTimeEntry, settings } = useStore();

  const [date, setDate] = useState(today());
  const [clientId, setClientId] = useState('');
  const [caseId, setCaseId] = useState('');
  const [category, setCategory] = useState<TimeCategory | ''>('');
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [onSite, setOnSite] = useState(false);
  const [onSiteType, setOnSiteType] = useState<OnSiteType | ''>('');
  const [invoiced, setInvoiced] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const holiday = getHolidayName(date);
  const weekend = isWeekend(date);
  const filteredCases = cases.filter((c) => c.clientId === clientId && c.status !== 'Lukket' && c.status !== 'Faktureret');

  const todayEntries = timeEntries.filter((te) => te.date === today()).slice(0, 10);
  const todayHours = todayEntries.reduce((s, te) => s + te.hours, 0);

  // Current week hours
  const weekStart = (() => {
    const d = new Date();
    const dow = d.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
  })();
  const weekEnd = (() => {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + 4);
    return d.toISOString().slice(0, 10);
  })();
  const weekHours = timeEntries
    .filter((te) => te.date >= weekStart && te.date <= weekEnd)
    .reduce((s, te) => s + te.hours, 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!clientId) return setError('Vælg en kunde.');
    if (!caseId) return setError('Vælg en sag.');
    if (!category) return setError('Vælg en kategori.');
    const h = parseFloat(hours);
    if (!hours || isNaN(h) || h <= 0 || h > 24) return setError('Angiv gyldigt antal timer (0–24).');
    if (!description.trim()) return setError('Beskriv hvad du lavede.');
    if (onSite && !onSiteType) return setError('Angiv type for on-site besøg.');

    addTimeEntry({
      caseId,
      date,
      hours: h,
      category: category as TimeCategory,
      description: description.trim(),
      onSite,
      onSiteType: onSite ? (onSiteType as OnSiteType) : undefined,
      invoiced,
    });

    // Reset form
    setCategory('');
    setHours('');
    setDescription('');
    setOnSite(false);
    setOnSiteType('');
    setInvoiced(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleClientChange(id: string) {
    setClientId(id);
    setCaseId('');
  }

  const dateLabel = `${formatDayName(date)}, ${formatDisplay(date)}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header with today's summary */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Timeregistrering
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">I dag</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{todayHours.toFixed(1)}t</div>
          </div>
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Denne uge</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{weekHours.toFixed(1)}t</div>
          </div>
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Normtid</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{settings.weeklyHours}t</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Dato
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={date}
                    max={today()}
                    onChange={(e) => setDate(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">{dateLabel}</span>
                    {holiday && (
                      <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                        🎄 {holiday}
                      </span>
                    )}
                    {!holiday && weekend && (
                      <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                        Weekend
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Client + Case */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Kunde
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Vælg kunde…</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Sag
                  </label>
                  <select
                    value={caseId}
                    onChange={(e) => setCaseId(e.target.value)}
                    disabled={!clientId}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="">Vælg sag…</option>
                    {filteredCases.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Kategori
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const isSelected = category === cat;
                    const color = CATEGORY_COLORS[cat];
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all',
                          isSelected
                            ? 'text-white border-transparent'
                            : 'bg-transparent border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                        )}
                        style={isSelected ? { backgroundColor: color, borderColor: color } : {}}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hours + Description */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Timer
                  </label>
                  <input
                    type="number"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    min="0.25"
                    max="24"
                    step="0.25"
                    placeholder="f.eks. 2.5"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Beskrivelse
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={1}
                    placeholder="Hvad lavede du?"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* On-site toggle */}
              <div className="flex flex-wrap items-start gap-6">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      className={clsx(
                        'w-10 h-5 rounded-full transition-colors relative',
                        onSite ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                      )}
                      onClick={() => { setOnSite((v) => !v); setOnSiteType(''); }}
                    >
                      <div
                        className={clsx(
                          'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                          onSite ? 'translate-x-5' : 'translate-x-0.5'
                        )}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <MapPin size={14} />
                      On-site hos kunde
                    </span>
                  </label>

                  {onSite && (
                    <div className="mt-2 flex gap-2">
                      {ON_SITE_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setOnSiteType(type)}
                          className={clsx(
                            'px-3 py-1 text-xs rounded-full border font-medium transition-colors',
                            onSiteType === type
                              ? 'bg-blue-500 border-blue-500 text-white'
                              : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400'
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      className={clsx(
                        'w-10 h-5 rounded-full transition-colors relative',
                        invoiced ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      )}
                      onClick={() => setInvoiced((v) => !v)}
                    >
                      <div
                        className={clsx(
                          'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                          invoiced ? 'translate-x-5' : 'translate-x-0.5'
                        )}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Faktureret
                    </span>
                  </label>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              {/* Submit */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  Gem registrering
                </button>
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 font-medium">
                    <CheckCircle size={16} />
                    Gemt!
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Today's entries */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center justify-between">
              Dagens registreringer
              <span className="text-lg font-bold text-gray-900 dark:text-white">{todayHours.toFixed(1)}t</span>
            </h2>

            {todayEntries.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
                Ingen registreringer i dag
              </p>
            ) : (
              <ul className="space-y-2">
                {todayEntries.map((te) => {
                  const caseItem = cases.find((c) => c.id === te.caseId);
                  const client = clients.find((c) => c.id === caseItem?.clientId);
                  return (
                    <li
                      key={te.id}
                      className="flex items-start gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <CategoryBadge category={te.category} />
                          {te.onSite && (
                            <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                              <MapPin size={10} /> {te.onSiteType}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {client?.name} · {caseItem?.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 truncate">
                          {te.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {te.hours}t
                        </span>
                        <button
                          onClick={() => deleteTimeEntry(te.id)}
                          className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          title="Slet registrering"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
