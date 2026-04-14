import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { useStore } from '../store';
import type { PeriodKey, DateRange } from '../types';
import { PeriodSelector } from '../components/PeriodSelector';
import { currentWeekRange, periodToDateRange, getWeekdaysInRange, formatShortDay } from '../utils/dates';
import { getHolidaysInRange, isHoliday } from '../utils/danishHolidays';
import clsx from 'clsx';

export function OvertimeDashboard() {
  const { timeEntries, settings } = useStore();
  const weeklyHours = settings.weeklyHours;
  const dailyHours = weeklyHours / 5;

  const [period, setPeriod] = useState<PeriodKey>('1uge');
  const [customRange, setCustomRange] = useState<DateRange>(currentWeekRange());

  const dateRange = useMemo((): DateRange => {
    if (period === 'brugerdefineret') return customRange;
    return periodToDateRange(period);
  }, [period, customRange]);

  // All workdays in range (Mon–Fri, excl. holidays)
  const workdays = useMemo(() => {
    const days = getWeekdaysInRange(dateRange.from, dateRange.to);
    return days.filter((d) => !isHoliday(d));
  }, [dateRange]);

  const holidaysInRange = useMemo(
    () => getHolidaysInRange(dateRange.from, dateRange.to),
    [dateRange]
  );

  // Normtime = workdays × daily hours
  const normTime = workdays.length * dailyHours;

  // Registered hours in range
  const registeredHours = useMemo(
    () => timeEntries
      .filter((te) => te.date >= dateRange.from && te.date <= dateRange.to)
      .reduce((s, te) => s + te.hours, 0),
    [timeEntries, dateRange]
  );

  const balance = registeredHours - normTime;
  const isPositive = balance > 0.05;
  const isNegative = balance < -0.05;

  // Chart data: daily hours vs daily norm
  const isWeekView = period === '1uge';

  const chartData = useMemo(() => {
    if (isWeekView) {
      const days = getWeekdaysInRange(dateRange.from, dateRange.to);
      return days.map((d) => {
        const dayHours = timeEntries
          .filter((te) => te.date === d)
          .reduce((s, te) => s + te.hours, 0);
        const holiday = isHoliday(d);
        return {
          name: formatShortDay(d),
          timer: parseFloat(dayHours.toFixed(2)),
          normtid: holiday ? 0 : parseFloat(dailyHours.toFixed(2)),
          helligdag: holiday,
        };
      });
    } else {
      // Group by week
      const weekMap = new Map<string, { hours: number; workdays: number }>();
      const allDays = getWeekdaysInRange(dateRange.from, dateRange.to);
      allDays.forEach((d) => {
        const date = new Date(d + 'T12:00:00');
        const dow = date.getDay();
        const diff = dow === 0 ? -6 : 1 - dow;
        const mon = new Date(date);
        mon.setDate(date.getDate() + diff);
        const key = mon.toISOString().slice(0, 10);
        if (!weekMap.has(key)) weekMap.set(key, { hours: 0, workdays: 0 });
        const w = weekMap.get(key)!;
        if (!isHoliday(d)) w.workdays++;
      });
      timeEntries
        .filter((te) => te.date >= dateRange.from && te.date <= dateRange.to)
        .forEach((te) => {
          const date = new Date(te.date + 'T12:00:00');
          const dow = date.getDay();
          const diff = dow === 0 ? -6 : 1 - dow;
          const mon = new Date(date);
          mon.setDate(date.getDate() + diff);
          const key = mon.toISOString().slice(0, 10);
          if (weekMap.has(key)) weekMap.get(key)!.hours += te.hours;
        });
      const sorted = Array.from(weekMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      return sorted.map(([monday, { hours, workdays: wd }]) => ({
        name: `${formatShortDay(monday).split('/')[0].trim()}`,
        timer: parseFloat(hours.toFixed(2)),
        normtid: parseFloat((wd * dailyHours).toFixed(2)),
        helligdag: false,
      }));
    }
  }, [timeEntries, dateRange, isWeekView, dailyHours]);

  // Accumulated balance over weeks in range (for longer periods)
  const weeklyBalances = useMemo(() => {
    const weekMap = new Map<string, { registered: number; norm: number }>();
    const allDays = getWeekdaysInRange(dateRange.from, dateRange.to);
    allDays.forEach((d) => {
      const date = new Date(d + 'T12:00:00');
      const dow = date.getDay();
      const diff = dow === 0 ? -6 : 1 - dow;
      const mon = new Date(date);
      mon.setDate(date.getDate() + diff);
      const key = mon.toISOString().slice(0, 10);
      if (!weekMap.has(key)) weekMap.set(key, { registered: 0, norm: 0 });
      if (!isHoliday(d)) weekMap.get(key)!.norm += dailyHours;
    });
    timeEntries
      .filter((te) => te.date >= dateRange.from && te.date <= dateRange.to)
      .forEach((te) => {
        const date = new Date(te.date + 'T12:00:00');
        const dow = date.getDay();
        const diff = dow === 0 ? -6 : 1 - dow;
        const mon = new Date(date);
        mon.setDate(date.getDate() + diff);
        const key = mon.toISOString().slice(0, 10);
        if (weekMap.has(key)) weekMap.get(key)!.registered += te.hours;
      });
    return Array.from(weekMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, { registered, norm }]) => ({
        balance: parseFloat((registered - norm).toFixed(2)),
      }));
  }, [timeEntries, dateRange, dailyHours]);

  const accumulatedBalance = weeklyBalances.reduce((s, w) => s + w.balance, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Normtid & Afspadsering
        </h1>
        <PeriodSelector
          selected={period}
          customRange={customRange}
          onChange={setPeriod}
          onCustomRange={setCustomRange}
        />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Registered */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Registreret</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {registeredHours.toFixed(1)}<span className="text-base font-normal text-gray-400 ml-1">t</span>
          </p>
        </div>

        {/* Normtime */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Normtid</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {normTime.toFixed(1)}<span className="text-base font-normal text-gray-400 ml-1">t</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{workdays.length} arbejdsdage</p>
        </div>

        {/* Weekly balance */}
        <div className={clsx(
          'rounded-2xl shadow-sm border p-5',
          isPositive ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
          isNegative ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
          'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        )}>
          <p className={clsx(
            'text-xs font-medium uppercase tracking-wide mb-1',
            isPositive ? 'text-green-600 dark:text-green-400' :
            isNegative ? 'text-red-600 dark:text-red-400' :
            'text-gray-400'
          )}>
            Balance (periode)
          </p>
          <p className={clsx(
            'text-3xl font-bold flex items-center gap-1',
            isPositive ? 'text-green-700 dark:text-green-300' :
            isNegative ? 'text-red-700 dark:text-red-300' :
            'text-gray-900 dark:text-white'
          )}>
            {isPositive ? <TrendingUp size={22} /> : isNegative ? <TrendingDown size={22} /> : <Minus size={22} />}
            {isPositive ? '+' : ''}{balance.toFixed(1)}<span className="text-base font-normal text-gray-400 ml-1">t</span>
          </p>
          <p className="text-xs mt-0.5" style={{ color: isPositive ? '#16a34a' : isNegative ? '#dc2626' : '#9ca3af' }}>
            {isPositive ? 'Overarbejde → afspadsering' : isNegative ? 'Under normtid' : 'Præcis normtid'}
          </p>
        </div>

        {/* Accumulated balance (only shows for longer periods) */}
        {period !== '1uge' && (
          <div className={clsx(
            'rounded-2xl shadow-sm border p-5',
            accumulatedBalance > 0.05 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
            accumulatedBalance < -0.05 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
            'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          )}>
            <p className={clsx(
              'text-xs font-medium uppercase tracking-wide mb-1',
              accumulatedBalance > 0.05 ? 'text-green-600 dark:text-green-400' :
              accumulatedBalance < -0.05 ? 'text-red-600 dark:text-red-400' :
              'text-gray-400'
            )}>
              Akkumuleret saldo
            </p>
            <p className={clsx(
              'text-3xl font-bold',
              accumulatedBalance > 0.05 ? 'text-green-700 dark:text-green-300' :
              accumulatedBalance < -0.05 ? 'text-red-700 dark:text-red-300' :
              'text-gray-900 dark:text-white'
            )}>
              {accumulatedBalance > 0 ? '+' : ''}{accumulatedBalance.toFixed(1)}<span className="text-base font-normal text-gray-400 ml-1">t</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Over {weeklyBalances.length} uger</p>
          </div>
        )}

        {/* If week view, show the 4th card as daily norm */}
        {period === '1uge' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Dagsnorm</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {dailyHours.toFixed(1)}<span className="text-base font-normal text-gray-400 ml-1">t</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{weeklyHours}t / 5 dage</p>
          </div>
        )}
      </div>

      {/* Holiday notice */}
      {holidaysInRange.length > 0 && (
        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
          <AlertCircle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-700 dark:text-amber-300">
            <span className="font-medium">{holidaysInRange.length} helligdag{holidaysInRange.length > 1 ? 'e' : ''} i perioden</span>
            {' · '}
            {holidaysInRange.map((h) => h.name).join(', ')}
            {' · '}Disse er trukket fra normtiden.
          </div>
        </div>
      )}

      {/* Daily bar chart with norm line */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            {isWeekView ? 'Timer pr. dag vs. dagsnorm' : 'Timer pr. uge vs. normtid'}
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
                formatter={(value, name) => [
                  `${Number(value ?? 0).toFixed(1)}t`,
                  name === 'timer' ? 'Registrerede timer' : 'Normtid',
                ]}
              />
              <ReferenceLine
                y={isWeekView ? dailyHours : weeklyHours}
                stroke="#ef4444"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{ value: 'Norm', position: 'right', fontSize: 10, fill: '#ef4444' }}
              />
              <Bar dataKey="timer" fill="#3B82F6" radius={[4, 4, 0, 0]} name="timer" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Den røde stiplede linje viser dagsnormen ({isWeekView ? `${dailyHours.toFixed(1)}t` : `${weeklyHours}t`})
          </p>
        </div>
      )}

      {/* Weekly breakdown table (for longer periods) */}
      {!isWeekView && weeklyBalances.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ugentlig oversigt</h2>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {weeklyBalances.map((row, i) => {
              const bal = row.balance;
              const isPos = bal > 0.05;
              const isNeg = bal < -0.05;
              return (
                <div key={i} className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Uge {i + 1}</span>
                  <span
                    className={clsx(
                      'text-sm font-semibold',
                      isPos ? 'text-green-600 dark:text-green-400' :
                      isNeg ? 'text-red-600 dark:text-red-400' :
                      'text-gray-600 dark:text-gray-400'
                    )}
                  >
                    {isPos ? '+' : ''}{bal.toFixed(1)}t
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
