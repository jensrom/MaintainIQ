import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useStore } from '../store';
import type { TimeCategory, PeriodKey, DateRange } from '../types';
import { CATEGORY_COLORS, DEFAULT_CATEGORIES } from '../types';
import { PeriodSelector } from '../components/PeriodSelector';
import { CategoryBadge } from '../components/CategoryBadge';
import { currentWeekRange, periodToDateRange, getWeekdaysInRange, formatShortDay, formatDisplay } from '../utils/dates';
import { getHolidayName } from '../utils/danishHolidays';
import { MapPin, CheckCircle2 } from 'lucide-react';

const CHART_COLORS: Record<TimeCategory, string> = CATEGORY_COLORS;

export function TimeDashboard() {
  const { timeEntries, cases, clients } = useStore();

  const [period, setPeriod] = useState<PeriodKey>('1uge');
  const [customRange, setCustomRange] = useState<DateRange>(currentWeekRange());

  const dateRange = useMemo((): DateRange => {
    if (period === 'brugerdefineret') return customRange;
    return periodToDateRange(period);
  }, [period, customRange]);

  const filteredEntries = useMemo(
    () => timeEntries.filter((te) => te.date >= dateRange.from && te.date <= dateRange.to),
    [timeEntries, dateRange]
  );

  // KPI per category
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    DEFAULT_CATEGORIES.forEach((cat) => (totals[cat] = 0));
    filteredEntries.forEach((te) => {
      totals[te.category] = (totals[te.category] ?? 0) + te.hours;
    });
    return totals;
  }, [filteredEntries]);

  const totalHours = Object.values(categoryTotals).reduce((s, v) => s + v, 0);
  const invoicedHours = filteredEntries.filter((te) => te.invoiced).reduce((s, te) => s + te.hours, 0);
  const onSiteHours = filteredEntries.filter((te) => te.onSite).reduce((s, te) => s + te.hours, 0);

  // Chart data - group by day (for 1 week) or by week
  const isWeekView = period === '1uge';
  const chartData = useMemo(() => {
    if (isWeekView) {
      const days = getWeekdaysInRange(dateRange.from, dateRange.to);
      return days.map((d) => {
        const dayEntries = filteredEntries.filter((te) => te.date === d);
        const holiday = getHolidayName(d);
        const row: Record<string, string | number> = {
          name: formatShortDay(d),
          _date: d,
          _holiday: holiday ?? '',
        };
        DEFAULT_CATEGORIES.forEach((cat) => {
          row[cat] = dayEntries
            .filter((te) => te.category === cat)
            .reduce((s, te) => s + te.hours, 0);
        });
        return row;
      });
    } else {
      // Group by week
      const weekMap = new Map<string, Record<string, number>>();
      filteredEntries.forEach((te) => {
        const d = new Date(te.date + 'T12:00:00');
        const dow = d.getDay();
        const diff = dow === 0 ? -6 : 1 - dow;
        const mon = new Date(d);
        mon.setDate(d.getDate() + diff);
        const key = mon.toISOString().slice(0, 10);
        if (!weekMap.has(key)) {
          const init: Record<string, number> = {};
          DEFAULT_CATEGORIES.forEach((cat) => (init[cat] = 0));
          weekMap.set(key, init);
        }
        const w = weekMap.get(key)!;
        w[te.category] = (w[te.category] ?? 0) + te.hours;
      });
      const sorted = Array.from(weekMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      return sorted.map(([monday, vals]) => ({
        name: `Uge ${formatShortDay(monday).split(' ')[1] ?? monday.slice(5)}`,
        ...vals,
      }));
    }
  }, [filteredEntries, isWeekView, dateRange]);

  const recentEntries = [...filteredEntries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Timer Dashboard</h1>
        <PeriodSelector
          selected={period}
          customRange={customRange}
          onChange={setPeriod}
          onCustomRange={setCustomRange}
        />
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Total timer</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalHours.toFixed(1)}<span className="text-base font-normal text-gray-400 ml-1">t</span></p>
          <p className="text-xs text-gray-400 mt-1">{dateRange.from} – {dateRange.to}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
            <CheckCircle2 size={11} /> Fakturerede timer
          </p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{invoicedHours.toFixed(1)}<span className="text-base font-normal text-gray-400 ml-1">t</span></p>
          <p className="text-xs text-gray-400 mt-1">
            {totalHours > 0 ? `${((invoicedHours / totalHours) * 100).toFixed(0)}% af totale timer` : '–'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
            <MapPin size={11} /> On-site timer
          </p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{onSiteHours.toFixed(1)}<span className="text-base font-normal text-gray-400 ml-1">t</span></p>
          <p className="text-xs text-gray-400 mt-1">{filteredEntries.filter((te) => te.onSite).length} besøg</p>
        </div>
      </div>

      {/* Per-category KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {DEFAULT_CATEGORIES.map((cat) => {
          const hours = categoryTotals[cat] ?? 0;
          const pct = totalHours > 0 ? (hours / totalHours) * 100 : 0;
          return (
            <div
              key={cat}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
              style={{ borderLeftWidth: 3, borderLeftColor: CATEGORY_COLORS[cat] }}
            >
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate mb-1">{cat}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{hours.toFixed(1)}<span className="text-sm font-normal text-gray-400">t</span></p>
              <p className="text-xs text-gray-400 mt-0.5">{pct.toFixed(0)}%</p>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      {chartData.length > 0 && totalHours > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            {isWeekView ? 'Timer pr. dag' : 'Timer pr. uge'}
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                unit="t"
              />
              <Tooltip
                contentStyle={{
                  background: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#f9fafb',
                  fontSize: 12,
                }}
                formatter={(value) => [`${Number(value ?? 0).toFixed(1)}t`]}
              />
              <Legend
                iconType="square"
                iconSize={10}
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              />
              {DEFAULT_CATEGORIES.map((cat) => (
                <Bar
                  key={cat}
                  dataKey={cat}
                  stackId="hours"
                  fill={CHART_COLORS[cat]}
                  radius={cat === DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1] ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent entries table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Seneste registreringer ({filteredEntries.length})
          </h2>
        </div>
        {recentEntries.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
            Ingen registreringer i den valgte periode
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {recentEntries.map((te) => {
              const caseItem = cases.find((c) => c.id === te.caseId);
              const client = clients.find((c) => c.id === caseItem?.clientId);
              const holiday = getHolidayName(te.date);
              return (
                <div key={te.id} className="flex items-center gap-4 px-6 py-3">
                  <div className="w-24 shrink-0">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{formatDisplay(te.date)}</span>
                    {holiday && (
                      <span className="block text-xs text-red-500">{holiday}</span>
                    )}
                  </div>
                  <CategoryBadge category={te.category} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{te.description}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {client?.name} · {caseItem?.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {te.onSite && (
                      <span className="text-blue-500" title={`On-site: ${te.onSiteType}`}>
                        <MapPin size={13} />
                      </span>
                    )}
                    {te.invoiced && (
                      <span className="text-green-500" title="Faktureret">
                        <CheckCircle2 size={13} />
                      </span>
                    )}
                    <span className="text-sm font-semibold text-gray-900 dark:text-white w-10 text-right">
                      {te.hours}t
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
