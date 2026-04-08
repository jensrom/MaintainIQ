import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  ClipboardList, AlertTriangle, Zap, CheckCircle2, Package, MessageSquare,
  BarChart2, PieChart as PieIcon, Hash, Percent, ChevronDown, ChevronUp,
} from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'
import type { WidgetConfig } from '../types'
import { format, parseISO, isValid } from 'date-fns'
import { da } from 'date-fns/locale'

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
const CATEGORY_COLORS = ['#3b82f6', '#f59e0b', '#22c55e', '#a855f7', '#06b6d4']

function fmt(dateStr: string) {
  try {
    const d = parseISO(dateStr)
    if (!isValid(d)) return dateStr
    return format(d, 'd. MMM', { locale: da })
  } catch { return dateStr }
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'Åben': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'I gang': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'Planlagt': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    'Afventer': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    'Afsluttet': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    'Annulleret': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    'Arbejdsanmodning': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  }
  return (
    <span className={clsx('inline-block px-2 py-0.5 rounded text-[11px] font-medium', colors[status] ?? 'bg-gray-100 text-gray-600')}>
      {status}
    </span>
  )
}

interface KpiWidgetProps {
  id: string
  title: string
  value: number
  total?: number
  color: string
  icon: React.ReactNode
  displayType: WidgetConfig['displayType']
  onClick?: () => void
  onChangeDisplay: (t: WidgetConfig['displayType']) => void
}

function KpiWidget({ id, title, value, total, color, icon, displayType, onClick, onChangeDisplay }: KpiWidgetProps) {
  const [showMenu, setShowMenu] = useState(false)
  const pct = total ? Math.round((value / total) * 100) : 0

  const pieData = [
    { name: title, value },
    { name: 'Rest', value: Math.max(0, (total ?? 100) - value) },
  ]
  const barData = [{ name: title, value }]

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-2 relative cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color }} className="opacity-80">{icon}</span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{title}</span>
        </div>
        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu(v => !v)}
            className="p-1 rounded text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400"
          >
            <BarChart2 size={13} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 overflow-hidden text-xs">
              {(['count', 'percent', 'pie', 'bar'] as WidgetConfig['displayType'][]).map(t => (
                <button
                  key={t}
                  onClick={() => { onChangeDisplay(t); setShowMenu(false) }}
                  className={clsx(
                    'w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                    displayType === t && 'text-blue-600 dark:text-blue-400 font-medium'
                  )}
                >
                  {t === 'count' && <Hash size={12} />}
                  {t === 'percent' && <Percent size={12} />}
                  {t === 'pie' && <PieIcon size={12} />}
                  {t === 'bar' && <BarChart2 size={12} />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {displayType === 'count' && (
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100" style={{ color }}>{value}</p>
      )}
      {displayType === 'percent' && (
        <div>
          <p className="text-3xl font-bold" style={{ color }}>{pct}%</p>
          <div className="mt-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
          </div>
        </div>
      )}
      {displayType === 'pie' && (
        <ResponsiveContainer width="100%" height={70}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={20} outerRadius={30} dataKey="value" strokeWidth={0}>
              <Cell fill={color} />
              <Cell fill="#e5e7eb" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      )}
      {displayType === 'bar' && (
        <ResponsiveContainer width="100%" height={60}>
          <BarChart data={barData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
            <XAxis dataKey="name" hide />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const workOrders = useStore(s => s.workOrders)
  const spareParts = useStore(s => s.spareParts)
  const pmTasks = useStore(s => s.pmTasks)
  const widgetConfigs = useStore(s => s.widgetConfigs)
  const updateWidgetConfig = useStore(s => s.updateWidgetConfig)
  const assets = useStore(s => s.assets)

  const today = new Date().toISOString().split('T')[0]
  const activeWOs = workOrders.filter(wo => !['Afsluttet', 'Annulleret'].includes(wo.status))
  const openWOs = workOrders.filter(wo => wo.status === 'Åben').length
  const overdueWOs = workOrders.filter(wo =>
    !['Afsluttet', 'Annulleret', 'Arbejdsanmodning'].includes(wo.status) && wo.dueDate < today
  ).length
  const criticalWOs = workOrders.filter(wo =>
    wo.priority === 'Kritisk' && !['Afsluttet', 'Annulleret'].includes(wo.status)
  ).length
  const doneOnTime = pmTasks.filter(pm => pm.status === 'Udført').length
  const pmCompliance = pmTasks.length ? Math.round((doneOnTime / pmTasks.length) * 100) : 0
  const lowStockCount = spareParts.filter(sp => sp.quantity < sp.minQuantity).length
  const requestCount = workOrders.filter(wo => wo.status === 'Arbejdsanmodning').length

  const wCfg = (id: string) => widgetConfigs.find(w => w.id === id)?.displayType ?? 'count'

  // Chart data
  const statusData = Object.entries(
    activeWOs.reduce((acc, wo) => {
      acc[wo.status] = (acc[wo.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  const priorityData = Object.entries(
    workOrders
      .filter(wo => !['Afsluttet', 'Annulleret'].includes(wo.status))
      .reduce((acc, wo) => {
        acc[wo.priority] = (acc[wo.priority] || 0) + 1
        return acc
      }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  const categoryData = Object.entries(
    workOrders
      .filter(wo => !['Afsluttet', 'Annulleret'].includes(wo.status))
      .reduce((acc, wo) => {
        acc[wo.category] = (acc[wo.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  const recentWOs = [...workOrders]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  const lowStockParts = spareParts.filter(sp => sp.quantity < sp.minQuantity)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Overblik over Horsens Produktionssite</p>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiWidget
          id="open"
          title="Åbne arbejdsordrer"
          value={openWOs}
          total={workOrders.length}
          color="#3b82f6"
          icon={<ClipboardList size={18} />}
          displayType={wCfg('open')}
          onClick={() => navigate('/arbejdsordrer')}
          onChangeDisplay={t => updateWidgetConfig('open', t)}
        />
        <KpiWidget
          id="overdue"
          title="Forfaldne ordrer"
          value={overdueWOs}
          total={workOrders.length}
          color="#ef4444"
          icon={<AlertTriangle size={18} />}
          displayType={wCfg('overdue')}
          onClick={() => navigate('/arbejdsordrer')}
          onChangeDisplay={t => updateWidgetConfig('overdue', t)}
        />
        <KpiWidget
          id="critical"
          title="Kritiske ordrer"
          value={criticalWOs}
          total={workOrders.length}
          color="#f97316"
          icon={<Zap size={18} />}
          displayType={wCfg('critical')}
          onClick={() => navigate('/arbejdsordrer')}
          onChangeDisplay={t => updateWidgetConfig('critical', t)}
        />
        <KpiWidget
          id="pm_compliance"
          title="PM-compliance"
          value={pmCompliance}
          total={100}
          color="#22c55e"
          icon={<CheckCircle2 size={18} />}
          displayType={wCfg('pm_compliance')}
          onClick={() => navigate('/planlagt')}
          onChangeDisplay={t => updateWidgetConfig('pm_compliance', t)}
        />
        <KpiWidget
          id="low_stock"
          title="Lavt lager"
          value={lowStockCount}
          total={spareParts.length}
          color="#f59e0b"
          icon={<Package size={18} />}
          displayType={wCfg('low_stock')}
          onClick={() => navigate('/reservedele')}
          onChangeDisplay={t => updateWidgetConfig('low_stock', t)}
        />
        <KpiWidget
          id="requests"
          title="Anmodninger"
          value={requestCount}
          total={workOrders.length}
          color="#a855f7"
          icon={<MessageSquare size={18} />}
          displayType={wCfg('requests')}
          onClick={() => navigate('/anmodninger')}
          onChangeDisplay={t => updateWidgetConfig('requests', t)}
        />
      </div>

      {/* Recent WOs + Low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Work Orders */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Seneste arbejdsordrer</h2>
            <button onClick={() => navigate('/arbejdsordrer')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Se alle</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-4 py-2 font-medium">AO-nr.</th>
                <th className="text-left px-4 py-2 font-medium">Titel</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Forfald</th>
              </tr>
            </thead>
            <tbody>
              {recentWOs.map(wo => {
                const assetName = assets.find(a => a.id === wo.assetId)?.name ?? '—'
                const isOverdue = wo.dueDate < today && !['Afsluttet', 'Annulleret'].includes(wo.status)
                return (
                  <tr
                    key={wo.id}
                    onClick={() => navigate('/arbejdsordrer')}
                    className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                  >
                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 font-mono text-xs">{wo.id}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {wo.isPharma && <span title="GMP/Pharma">🧪</span>}
                        <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px]">{wo.title}</span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{assetName}</p>
                    </td>
                    <td className="px-4 py-2.5"><StatusBadge status={wo.status} /></td>
                    <td className={clsx('px-4 py-2.5 text-xs', isOverdue ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400')}>
                      {isOverdue && <AlertTriangle size={11} className="inline mr-1" />}
                      {fmt(wo.dueDate)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Low stock */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Lavt lager</h2>
            <button onClick={() => navigate('/reservedele')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Se alle</button>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {lowStockParts.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">Ingen lagervarer på lavt/tomt lager</p>
            ) : (
              lowStockParts.map(sp => (
                <div key={sp.id} className="px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{sp.name}</p>
                    <p className="text-xs text-gray-400">{sp.partNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className={clsx(
                      'text-xs font-semibold',
                      sp.quantity === 0 ? 'text-red-500' : 'text-amber-500'
                    )}>
                      {sp.quantity} / {sp.minQuantity}
                    </span>
                    <p className="text-[10px] text-gray-400">min. {sp.minQuantity}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* By status */}
        <ChartCard title="Arbejdsordrer efter status">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, value }) => `${value}`} labelLine={false}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.name] ?? '#9ca3af'} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
            {statusData.map(d => (
              <div key={d.name} className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[d.name] ?? '#9ca3af' }} />
                {d.name}: {d.value}
              </div>
            ))}
          </div>
        </ChartCard>

        {/* By priority */}
        <ChartCard title="Arbejdsordrer efter prioritet">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={priorityData} cx="50%" cy="50%" outerRadius={65} dataKey="value" labelLine={false}>
                {priorityData.map((entry, i) => (
                  <Cell key={i} fill={PRIORITY_COLORS[entry.name] ?? '#9ca3af'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
            {priorityData.map(d => (
              <div key={d.name} className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[d.name] ?? '#9ca3af' }} />
                {d.name}: {d.value}
              </div>
            ))}
          </div>
        </ChartCard>

        {/* By category */}
        <ChartCard title="Arbejdsordrer efter kategori">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" outerRadius={65} dataKey="value" labelLine={false}>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
            {categoryData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                {d.name}: {d.value}
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">{title}</h3>
      {children}
    </div>
  )
}
