import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  ClipboardList, AlertTriangle, Clock, Package, CalendarCheck, TrendingUp, Activity, Settings2,
} from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'
import { format, parseISO, isValid } from 'date-fns'
import { da } from 'date-fns/locale'
import type { WidgetConfig } from '../types'

// ─── Color maps ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  'Åben': '#3b82f6',
  'I gang': '#f59e0b',
  'Planlagt': '#06b6d4',
  'Afventer': '#f97316',
  'Afsluttet': '#22c55e',
  'Annulleret': '#9ca3af',
  'Arbejdsanmodning': '#a855f7',
}

const PRIORITY_COLORS: Record<string, string> = {
  'Kritisk': '#ef4444',
  'Høj': '#f97316',
  'Normal': '#3b82f6',
  'Lav': '#9ca3af',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(dateStr: string) {
  try {
    const d = parseISO(dateStr)
    if (!isValid(d)) return dateStr
    return format(d, 'd. MMM', { locale: da })
  } catch {
    return dateStr
  }
}

function isOverdueDate(dateStr: string, todayStr: string) {
  return dateStr < todayStr
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'Åben': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'I gang': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'Planlagt': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    'Afventer': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    'Afsluttet': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    'Annulleret': 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    'Arbejdsanmodning': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    'Forfaldne': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    'Kommende': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'Udført': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  }
  return (
    <span className={clsx(
      'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap',
      colors[status] ?? 'bg-slate-100 text-slate-500'
    )}>
      {status}
    </span>
  )
}

function PriorityDot({ priority }: { priority: string }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: PRIORITY_COLORS[priority] ?? '#9ca3af' }}
      title={priority}
    />
  )
}

type PeriodKey = 'dag' | 'uge' | 'maaned' | 'aar'
const PERIOD_LABELS: Record<PeriodKey, string> = {
  dag: 'Dag',
  uge: 'Uge',
  maaned: 'Måned',
  aar: 'År',
}

// ─── Widget KPI Card (store-backed, cycling display types) ────────────────────

const DISPLAY_CYCLE: WidgetConfig['displayType'][] = ['count', 'percent', 'pie', 'bar']

interface ChartEntry { name: string; value: number; color: string }

interface WidgetCardProps {
  widgetId: string
  label: string
  value: number
  total?: number
  accentColor: string
  icon: React.ReactNode
  onClick?: () => void
  alert?: boolean
  pieData?: ChartEntry[]
  barData?: ChartEntry[]
}

function WidgetCard({ widgetId, label, value, total, accentColor, icon, onClick, alert, pieData, barData }: WidgetCardProps) {
  const { widgetConfigs, updateWidgetConfig } = useStore()
  const cfg = widgetConfigs.find(w => w.id === widgetId)
  const displayType = cfg?.displayType ?? 'count'

  const hasPie = (pieData?.length ?? 0) > 0
  const hasBar = (barData?.length ?? 0) > 0

  function cycle(e: React.MouseEvent) {
    e.stopPropagation()
    const available = DISPLAY_CYCLE.filter(t =>
      t === 'count' ||
      (t === 'percent' && total !== undefined) ||
      (t === 'pie' && hasPie) ||
      (t === 'bar' && hasBar)
    )
    const idx = available.indexOf(displayType)
    updateWidgetConfig(widgetId, available[(idx + 1) % available.length])
  }

  const pct = total != null && total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg',
        'flex flex-col gap-1 px-4 py-3 relative overflow-hidden group min-h-[76px]',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
      )}
      style={{ borderTopWidth: 3, borderTopColor: accentColor }}
    >
      {/* Cycle button */}
      <button
        onClick={cycle}
        className="absolute top-2 right-2 p-0.5 rounded text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title={`Visning: ${displayType}`}
      >
        <Settings2 size={11} />
      </button>

      {/* Background icon */}
      <span className="absolute top-3 right-7 opacity-10" style={{ color: accentColor }}>{icon}</span>

      {/* count */}
      {(displayType === 'count' || (!hasPie && !hasBar && displayType !== 'percent')) && (
        <>
          <span className={clsx(
            'text-2xl font-semibold leading-none',
            alert && value > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'
          )}>{value}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{label}</span>
        </>
      )}

      {/* percent */}
      {displayType === 'percent' && (
        <>
          <span className="text-2xl font-semibold leading-none text-slate-900 dark:text-slate-100">{pct}%</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{label}</span>
          <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded mt-0.5">
            <div className="h-1 rounded transition-all" style={{ width: `${pct}%`, backgroundColor: accentColor }} />
          </div>
        </>
      )}

      {/* pie */}
      {displayType === 'pie' && hasPie && (
        <div className="flex items-center gap-2 -mx-1 -my-0.5">
          <PieChart width={56} height={56}>
            <Pie data={pieData} cx={24} cy={24} innerRadius={12} outerRadius={24} paddingAngle={2} dataKey="value">
              {pieData!.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
          </PieChart>
          <div>
            <span className={clsx('text-xl font-semibold leading-none', alert && value > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100')}>{value}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block">{label}</span>
          </div>
        </div>
      )}

      {/* bar */}
      {displayType === 'bar' && hasBar && (
        <div className="-mx-2 -mt-0.5">
          <div className="px-2">
            <span className={clsx('text-xl font-semibold leading-none', alert && value > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100')}>{value}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight ml-1">{label}</span>
          </div>
          <BarChart width={130} height={34} data={barData} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
            <Bar dataKey="value" radius={[2, 2, 0, 0]} maxBarSize={14}>
              {barData!.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Bar>
          </BarChart>
        </div>
      )}
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function SectionCard({ title, children, action }: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden flex flex-col">
      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{title}</span>
        {action}
      </div>
      {children}
    </div>
  )
}

// ─── Custom tooltip for recharts ──────────────────────────────────────────────

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs shadow">
      <span className="font-medium text-slate-700 dark:text-slate-200">{payload[0].name}</span>
      <span className="text-slate-500 dark:text-slate-400 ml-1">{payload[0].value}</span>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const workOrders = useStore(s => s.workOrders)
  const spareParts = useStore(s => s.spareParts)
  const pmTasks = useStore(s => s.pmTasks)
  const assets = useStore(s => s.assets)
  // widget config not destructured here — WidgetCard pulls it internally

  const [period, setPeriod] = useState<PeriodKey>('maaned')

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  // ── KPI computations ──────────────────────────────────────────────────────

  const {
    active,
    overdue,
    dueToday,
    requests,
    overduePMs,
    lowStockParts,
    pmCompliance,
  } = useMemo(() => {
    const active = workOrders.filter(wo =>
      ['Åben', 'I gang', 'Planlagt', 'Afventer'].includes(wo.status)
    )
    const overdue = workOrders.filter(wo =>
      !['Afsluttet', 'Annulleret'].includes(wo.status) && wo.dueDate < todayStr
    )
    const dueToday = workOrders.filter(wo =>
      !['Afsluttet', 'Annulleret'].includes(wo.status) && wo.dueDate === todayStr
    )
    const requests = workOrders.filter(wo => wo.status === 'Arbejdsanmodning')
    const overduePMs = pmTasks.filter(pm => pm.status === 'Forfaldne')
    const lowStockParts = spareParts.filter(sp => sp.quantity <= sp.minQuantity)
    const donePMs = pmTasks.filter(pm => pm.status === 'Udført').length
    const pmCompliance = pmTasks.length
      ? Math.round((donePMs / pmTasks.length) * 100)
      : 0

    return { active, overdue, dueToday, requests, overduePMs, lowStockParts, pmCompliance }
  }, [workOrders, spareParts, pmTasks, todayStr])

  // ── Widget mini chart data ─────────────────────────────────────────────────

  const widgetChartData = useMemo(() => {
    const activeWOs = workOrders.filter(wo => !['Afsluttet', 'Annulleret'].includes(wo.status))
    const totalWOs = workOrders.length

    // open widget: active WOs by status (pie) + by priority (bar)
    const statusCounts: Record<string, number> = {}
    activeWOs.forEach(wo => { statusCounts[wo.status] = (statusCounts[wo.status] ?? 0) + 1 })
    const openPie: ChartEntry[] = Object.entries(statusCounts).map(([name, value]) => ({ name, value, color: STATUS_COLORS[name] ?? '#9ca3af' }))
    const priMap: Record<string, string> = { 'Kritisk': '#ef4444', 'Høj': '#f97316', 'Normal': '#3b82f6', 'Lav': '#9ca3af' }
    const priCounts: Record<string, number> = { 'Kritisk': 0, 'Høj': 0, 'Normal': 0, 'Lav': 0 }
    activeWOs.forEach(wo => { if (wo.priority in priCounts) priCounts[wo.priority]++ })
    const openBar: ChartEntry[] = Object.entries(priCounts).map(([name, value]) => ({ name, value, color: priMap[name] ?? '#9ca3af' }))

    // overdue widget: overdue by priority (pie)
    const overduePriCounts: Record<string, number> = { 'Kritisk': 0, 'Høj': 0, 'Normal': 0, 'Lav': 0 }
    workOrders.filter(wo => !['Afsluttet', 'Annulleret'].includes(wo.status) && wo.dueDate < new Date().toISOString().split('T')[0])
      .forEach(wo => { if (wo.priority in overduePriCounts) overduePriCounts[wo.priority]++ })
    const overduePie: ChartEntry[] = Object.entries(overduePriCounts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value, color: priMap[name] ?? '#9ca3af' }))

    // pm_compliance widget: done vs pending (pie)
    const pmDone = pmTasks.filter(pm => pm.status === 'Udført').length
    const pmPending = pmTasks.length - pmDone
    const pmPie: ChartEntry[] = [
      { name: 'Udført', value: pmDone, color: '#22c55e' },
      { name: 'Afventer', value: pmPending, color: '#f59e0b' },
    ].filter(e => e.value > 0)

    // low_stock widget: empty vs low vs ok (pie)
    const emptyCount = spareParts.filter(sp => sp.quantity === 0).length
    const lowCount = spareParts.filter(sp => sp.quantity > 0 && sp.quantity < sp.minQuantity).length
    const okCount = spareParts.length - emptyCount - lowCount
    const stockPie: ChartEntry[] = [
      { name: 'Tomt', value: emptyCount, color: '#ef4444' },
      { name: 'Lavt', value: lowCount, color: '#f59e0b' },
      { name: 'OK', value: okCount, color: '#22c55e' },
    ].filter(e => e.value > 0)

    return { openPie, openBar, overduePie, pmPie, stockPie, totalWOs }
  }, [workOrders, spareParts, pmTasks])

  // ── Chart data ────────────────────────────────────────────────────────────

  const { statusPieData, priorityBarData } = useMemo(() => {
    const activeWOs = workOrders.filter(wo => !['Afsluttet', 'Annulleret'].includes(wo.status))

    const statusCounts = activeWOs.reduce((acc, wo) => {
      acc[wo.status] = (acc[wo.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const statusPieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

    const priorityCounts: Record<string, number> = { 'Kritisk': 0, 'Høj': 0, 'Normal': 0, 'Lav': 0 }
    activeWOs.forEach(wo => {
      if (wo.priority in priorityCounts) priorityCounts[wo.priority]++
    })
    const priorityBarData = Object.entries(priorityCounts).map(([name, value]) => ({ name, value }))

    return { statusPieData, priorityBarData }
  }, [workOrders])

  // ── Overdue WOs by status (for middle col) ────────────────────────────────

  const overdueByStatus = useMemo(() => {
    const counts = overdue.reduce((acc, wo) => {
      acc[wo.status] = (acc[wo.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return Object.entries(counts).map(([status, count]) => ({ status, count }))
  }, [overdue])

  // ── Recent WOs (8 most recent non-completed) ──────────────────────────────

  const recentWOs = useMemo(() =>
    [...workOrders]
      .filter(wo => !['Afsluttet', 'Annulleret'].includes(wo.status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8),
    [workOrders]
  )

  // ── Next 5 PM tasks by nextDue ────────────────────────────────────────────

  const upcomingPMs = useMemo(() =>
    [...pmTasks]
      .sort((a, b) => a.nextDue.localeCompare(b.nextDue))
      .slice(0, 5),
    [pmTasks]
  )

  // ── Asset name lookup ─────────────────────────────────────────────────────

  const assetMap = useMemo(() => {
    const m: Record<string, string> = {}
    assets.forEach(a => { m[a.id] = a.name })
    return m
  }, [assets])

  return (
    <div className="p-5 bg-slate-50 dark:bg-slate-950 min-h-full space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Dashboard
        </h1>

        {/* Period filter */}
        <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
          {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map(key => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={clsx(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                period === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              )}
            >
              {PERIOD_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Stats Row ── */}
      <div className="grid grid-cols-7 gap-3">
        <WidgetCard
          widgetId="open"
          label="Aktive AO'er"
          value={active.length}
          total={widgetChartData.totalWOs}
          accentColor="#3b82f6"
          icon={<ClipboardList size={22} />}
          onClick={() => navigate('/arbejdsordrer')}
          pieData={widgetChartData.openPie}
          barData={widgetChartData.openBar}
        />
        <WidgetCard
          widgetId="overdue"
          label="Forfaldne"
          value={overdue.length}
          total={active.length}
          accentColor="#ef4444"
          icon={<AlertTriangle size={22} />}
          onClick={() => navigate('/arbejdsordrer')}
          alert
          pieData={widgetChartData.overduePie}
        />
        <WidgetCard
          widgetId="critical"
          label="Forfald i dag"
          value={dueToday.length}
          accentColor="#f97316"
          icon={<Clock size={22} />}
          onClick={() => navigate('/arbejdsordrer')}
          alert
        />
        <WidgetCard
          widgetId="requests"
          label="Anmodninger"
          value={requests.length}
          accentColor="#a855f7"
          icon={<Activity size={22} />}
          onClick={() => navigate('/anmodninger')}
        />
        <WidgetCard
          widgetId="pm_compliance"
          label="PM compliance"
          value={pmCompliance}
          total={100}
          accentColor="#22c55e"
          icon={<TrendingUp size={22} />}
          onClick={() => navigate('/planlagt')}
          pieData={widgetChartData.pmPie}
        />
        <WidgetCard
          widgetId="low_stock"
          label="Lav lager"
          value={lowStockParts.length}
          total={spareParts.length}
          accentColor="#06b6d4"
          icon={<Package size={22} />}
          onClick={() => navigate('/reservedele')}
          pieData={widgetChartData.stockPie}
        />
        <WidgetCard
          widgetId="pm_overdue"
          label="PM forfaldne"
          value={overduePMs.length}
          accentColor="#f59e0b"
          icon={<CalendarCheck size={22} />}
          onClick={() => navigate('/planlagt')}
          alert
        />
      </div>

      {/* ── Middle Row ── */}
      <div className="grid grid-cols-5 gap-3">

        {/* Col 1 (2/5): Seneste arbejdsordrer */}
        <div className="col-span-2">
          <SectionCard
            title="Seneste arbejdsordrer"
            action={
              <button
                onClick={() => navigate('/arbejdsordrer')}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
              >
                Se alle
              </button>
            }
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-slate-400 uppercase tracking-wide">ID</th>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-slate-400 uppercase tracking-wide">Titel</th>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-slate-400 uppercase tracking-wide">Aktiv</th>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-slate-400 uppercase tracking-wide">Pri</th>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-slate-400 uppercase tracking-wide">Forfald</th>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-slate-400 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentWOs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-xs text-slate-400">
                      Ingen åbne arbejdsordrer
                    </td>
                  </tr>
                ) : recentWOs.map(wo => {
                  const assetName = assetMap[wo.assetId] ?? '—'
                  const woOverdue = isOverdueDate(wo.dueDate, todayStr)
                  return (
                    <tr
                      key={wo.id}
                      onClick={() => navigate('/arbejdsordrer')}
                      className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                    >
                      <td className="px-3 py-1.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {wo.id}
                      </td>
                      <td className="px-3 py-1.5 max-w-[160px]">
                        <div className="flex items-center gap-1 min-w-0">
                          {wo.isPharma && (
                            <span className="text-[10px] flex-shrink-0" title="GMP/Pharma">🧪</span>
                          )}
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                            {wo.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-[11px] text-slate-500 dark:text-slate-400 max-w-[80px]">
                        <span className="truncate block">{assetName}</span>
                      </td>
                      <td className="px-3 py-1.5">
                        <PriorityDot priority={wo.priority} />
                      </td>
                      <td className={clsx(
                        'px-3 py-1.5 text-[11px] whitespace-nowrap',
                        woOverdue
                          ? 'text-red-600 dark:text-red-400 font-medium'
                          : 'text-slate-500 dark:text-slate-400'
                      )}>
                        {woOverdue && <AlertTriangle size={10} className="inline mr-0.5 mb-0.5" />}
                        {fmt(wo.dueDate)}
                      </td>
                      <td className="px-3 py-1.5">
                        <StatusBadge status={wo.status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </SectionCard>
        </div>

        {/* Col 2 (1/5): Forfaldne AO fordelt */}
        <div className="col-span-1">
          <SectionCard title="Forfaldne AO fordelt">
            {overdue.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-slate-400">
                Ingen forfaldne ordrer
              </div>
            ) : (
              <div className="p-3 space-y-1.5">
                {overdueByStatus.map(({ status, count }) => {
                  const pct = Math.round((count / overdue.length) * 100)
                  return (
                    <div key={status} className="space-y-0.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 dark:text-slate-300">{status}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: STATUS_COLORS[status] ?? '#9ca3af',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}

                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Total forfaldne</span>
                    <span className="font-bold text-red-600 dark:text-red-400">{overdue.length}</span>
                  </div>
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Col 3 (2/5): AO fordeling charts */}
        <div className="col-span-2 grid grid-rows-2 gap-3">
          {/* By status pie */}
          <SectionCard title="AO efter status">
            <div className="flex items-center gap-2 px-3 py-2">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={48}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {statusPieData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.name] ?? '#9ca3af'} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                {statusPieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between gap-1 text-[11px]">
                    <div className="flex items-center gap-1 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: STATUS_COLORS[d.name] ?? '#9ca3af' }}
                      />
                      <span className="text-slate-500 dark:text-slate-400 truncate">{d.name}</span>
                    </div>
                    <span className="font-medium text-slate-700 dark:text-slate-300 flex-shrink-0">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* By priority horizontal bar */}
          <SectionCard title="AO efter prioritet">
            <div className="px-3 py-2">
              <ResponsiveContainer width="100%" height={100}>
                <BarChart
                  data={priorityBarData}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={52}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
                  <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={12}>
                    {priorityBarData.map((entry, i) => (
                      <Cell key={i} fill={PRIORITY_COLORS[entry.name] ?? '#9ca3af'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-5 gap-3">

        {/* Col 1 (3/5): PM opgaver der snart forfalder */}
        <div className="col-span-3">
          <SectionCard
            title="PM opgaver der snart forfalder"
            action={
              <button
                onClick={() => navigate('/planlagt')}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
              >
                Se alle
              </button>
            }
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-slate-400 uppercase tracking-wide">Titel</th>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-slate-400 uppercase tracking-wide">Aktiver</th>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-slate-400 uppercase tracking-wide">Næste forfald</th>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-slate-400 uppercase tracking-wide">Interval</th>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-slate-400 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingPMs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-xs text-slate-400">
                      Ingen PM-opgaver
                    </td>
                  </tr>
                ) : upcomingPMs.map(pm => {
                  const pmAssets = pm.assetIds.map(id => assetMap[id] ?? id).join(', ')
                  const pmOverdue = pm.status === 'Forfaldne' || pm.nextDue < todayStr
                  return (
                    <tr
                      key={pm.id}
                      onClick={() => navigate('/planlagt')}
                      className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                    >
                      <td className="px-3 py-1.5 max-w-[180px]">
                        <div className="flex items-center gap-1 min-w-0">
                          {pm.isPharma && <span className="text-[10px] flex-shrink-0">🧪</span>}
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                            {pm.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-[11px] text-slate-500 dark:text-slate-400 max-w-[120px]">
                        <span className="truncate block">{pmAssets || '—'}</span>
                      </td>
                      <td className={clsx(
                        'px-3 py-1.5 text-[11px] whitespace-nowrap',
                        pmOverdue
                          ? 'text-red-600 dark:text-red-400 font-medium'
                          : 'text-slate-500 dark:text-slate-400'
                      )}>
                        {pmOverdue && <AlertTriangle size={10} className="inline mr-0.5 mb-0.5" />}
                        {fmt(pm.nextDue)}
                      </td>
                      <td className="px-3 py-1.5 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {pm.frequencyLabel}
                      </td>
                      <td className="px-3 py-1.5">
                        <StatusBadge status={pm.status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </SectionCard>
        </div>

        {/* Col 2 (2/5): Lav lagerstatus */}
        <div className="col-span-2">
          <SectionCard
            title="Lav lagerstatus"
            action={
              <button
                onClick={() => navigate('/reservedele')}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
              >
                Se alle
              </button>
            }
          >
            {lowStockParts.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-slate-400">
                Alle lagervarer er tilstrækkelige
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="text-left px-3 py-2 text-[11px] font-medium text-slate-400 uppercase tracking-wide">Del</th>
                    <th className="text-right px-3 py-2 text-[11px] font-medium text-slate-400 uppercase tracking-wide">Antal / Min</th>
                    <th className="text-left px-3 py-2 text-[11px] font-medium text-slate-400 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockParts.map(sp => {
                    const isEmpty = sp.quantity === 0
                    return (
                      <tr
                        key={sp.id}
                        onClick={() => navigate('/reservedele')}
                        className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                      >
                        <td className="px-3 py-1.5 max-w-[140px]">
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                            {sp.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">{sp.partNumber}</p>
                        </td>
                        <td className="px-3 py-1.5 text-right whitespace-nowrap">
                          <span className={clsx(
                            'text-xs font-semibold',
                            isEmpty
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-amber-600 dark:text-amber-400'
                          )}>
                            {sp.quantity}
                          </span>
                          <span className="text-[10px] text-slate-400"> / {sp.minQuantity}</span>
                        </td>
                        <td className="px-3 py-1.5">
                          <span className={clsx(
                            'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium',
                            isEmpty
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          )}>
                            {isEmpty ? 'Tomt' : 'Lav'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
