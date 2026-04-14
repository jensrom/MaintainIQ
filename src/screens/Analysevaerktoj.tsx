import { useState, useMemo } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from 'recharts'
import clsx from 'clsx'
import { useStore } from '../store'

// ─── colours ──────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  Kritisk: '#ef4444',
  Høj:     '#f97316',
  Normal:  '#3b82f6',
  Lav:     '#9ca3af',
}

const TYPE_COLORS = [
  '#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#f472b6','#84cc16',
]

const LATE_COLORS = ['#ef4444','#f97316','#f59e0b','#fbbf24','#d1d5db']

// ─── helpers ──────────────────────────────────────────────────────────────────

function KPI({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 text-center">
      <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden', className)}>
      <div className="px-4 pt-3.5 pb-2 border-b border-gray-100 dark:border-gray-800">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2 text-xs">
      {label && <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name ?? p.dataKey}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  )
}

const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, value }: any) => {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  if (value === 0) return null
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="600">
      {value}
    </text>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function Analysevaerktoj() {
  const { workOrders, users, assets } = useStore()
  const today = new Date().toISOString().split('T')[0]

  const [filterUserId, setFilterUserId] = useState<string>('')

  // Active WOs (not done/cancelled)
  const activeWOs = useMemo(() =>
    workOrders.filter(wo => !['Afsluttet', 'Annulleret', 'Arbejdsanmodning'].includes(wo.status)),
  [workOrders])

  const filteredWOs = useMemo(() =>
    filterUserId ? activeWOs.filter(wo => wo.assigneeId === filterUserId) : activeWOs,
  [activeWOs, filterUserId])

  // KPIs
  const lateWOs    = filteredWOs.filter(wo => wo.dueDate < today)
  const todayWOs   = filteredWOs.filter(wo => wo.dueDate === today)
  const noDueWOs   = filteredWOs.filter(wo => !wo.dueDate)

  // Late WOs by how overdue
  const lateGroups = useMemo(() => {
    const now = new Date()
    const counts = { 'I dag': 0, 'Denne uge': 0, 'Forrige uge': 0, '2+ uger': 0, 'Måneder': 0 }
    lateWOs.forEach(wo => {
      const days = Math.floor((now.getTime() - new Date(wo.dueDate).getTime()) / 86400000)
      if (days <= 1) counts['I dag']++
      else if (days <= 7) counts['Denne uge']++
      else if (days <= 14) counts['Forrige uge']++
      else if (days <= 60) counts['2+ uger']++
      else counts['Måneder']++
    })
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }))
  }, [lateWOs])

  // Active WOs by priority
  const byPriority = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredWOs.forEach(wo => { counts[wo.priority] = (counts[wo.priority] ?? 0) + 1 })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => ['Kritisk','Høj','Normal','Lav'].indexOf(a.name) - ['Kritisk','Høj','Normal','Lav'].indexOf(b.name))
  }, [filteredWOs])

  // Active WOs by type
  const byType = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredWOs.forEach(wo => { counts[wo.category] = (counts[wo.category] ?? 0) + 1 })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [filteredWOs])

  // Active WOs by user
  const byUser = useMemo(() => {
    const counts: Record<string, { name: string; planned: number; unplanned: number }> = {}
    filteredWOs.forEach(wo => {
      const u = users.find(u => u.id === wo.assigneeId)
      const key = wo.assigneeId ?? 'Ingen'
      const name = u?.name ?? 'Ikke tildelt'
      if (!counts[key]) counts[key] = { name, planned: 0, unplanned: 0 }
      if (['Forebyggende','Inspektion'].includes(wo.category)) counts[key].planned++
      else counts[key].unplanned++
    })
    return Object.values(counts).sort((a, b) => (b.planned + b.unplanned) - (a.planned + a.unplanned))
  }, [filteredWOs, users])

  // Late high-priority WOs by user
  const lateHighByUser = useMemo(() => {
    const counts: Record<string, { name: string; value: number }> = {}
    lateWOs
      .filter(wo => wo.priority === 'Kritisk' || wo.priority === 'Høj')
      .forEach(wo => {
        const u = users.find(u => u.id === wo.assigneeId)
        const key = wo.assigneeId ?? 'Ingen'
        const name = u?.name ?? 'Ikke tildelt'
        if (!counts[key]) counts[key] = { name, value: 0 }
        counts[key].value++
      })
    return Object.values(counts).sort((a, b) => b.value - a.value)
  }, [lateWOs, users])

  // Top assets by open WOs
  const topAssets = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredWOs.forEach(wo => { counts[wo.assetId] = (counts[wo.assetId] ?? 0) + 1 })
    return Object.entries(counts)
      .map(([id, value]) => ({ name: assets.find(a => a.id === id)?.code ?? id, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 25)
  }, [filteredWOs, assets])

  return (
    <div className="p-6 space-y-5">
      {/* Header + filters */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Analyseværktøj</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Live overblik over arbejdsordrer og vedligeholdsstatus</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
            <span className="text-xs text-gray-500 whitespace-nowrap">Tildelt bruger</span>
            <select
              className="text-xs bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none"
              value={filterUserId}
              onChange={e => setFilterUserId(e.target.value)}
            >
              <option value="">Alle</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI label="Aktive" value={filteredWOs.length} />
        <KPI label="Forfald i dag" value={todayWOs.length} />
        <KPI label="Forfaldne" value={lateWOs.length} />
        <KPI label="Ingen forfaldsdato" value={noDueWOs.length} />
      </div>

      {/* Row 2: Late + High-priority late + By user */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Late WOs pie */}
        <Card title="Forfaldne arbejdsordrer">
          {lateGroups.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Ingen forfaldne</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={lateGroups} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={PieLabel}>
                  {lateGroups.map((_, i) => <Cell key={i} fill={LATE_COLORS[i % LATE_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex flex-wrap gap-2 justify-center mt-1">
            {lateGroups.map((g, i) => (
              <span key={g.name} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: LATE_COLORS[i % LATE_COLORS.length] }} />
                {g.name}: {g.value}
              </span>
            ))}
          </div>
        </Card>

        {/* Late high-priority by user */}
        <Card title="Forfaldne høj-prioritet — pr. bruger">
          {lateHighByUser.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Ingen forfaldne høj-prioritet AO'er</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={lateHighByUser} layout="vertical" margin={{ left: 80, right: 30 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={78} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="value" position="right" style={{ fontSize: 11 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* By user table */}
        <Card title="Aktive AO'er pr. bruger">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left py-1.5 text-gray-400 font-medium">Navn</th>
                  <th className="text-center py-1.5 text-gray-400 font-medium w-10">PM</th>
                  <th className="text-center py-1.5 text-gray-400 font-medium w-10">Korr.</th>
                  <th className="text-center py-1.5 text-gray-400 font-medium w-10">I alt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {byUser.map((u, i) => {
                  const total = u.planned + u.unplanned
                  const maxTotal = Math.max(...byUser.map(r => r.planned + r.unplanned), 1)
                  return (
                    <tr key={i}>
                      <td className="py-1.5">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-1.5 rounded-full bg-blue-400"
                            style={{ width: `${(total / maxTotal) * 60}px` }}
                          />
                          <span className="text-gray-700 dark:text-gray-300 truncate max-w-[90px]">{u.name}</span>
                        </div>
                      </td>
                      <td className="text-center py-1.5 text-purple-600 dark:text-purple-400 font-medium">{u.planned}</td>
                      <td className="text-center py-1.5 text-amber-600 dark:text-amber-400 font-medium">{u.unplanned}</td>
                      <td className="text-center py-1.5 font-bold text-gray-800 dark:text-gray-200">{total}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Row 3: By type + By priority */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By type */}
        <Card title="Aktive AO'er pr. vedligeholdelses type">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byType} layout="vertical" margin={{ left: 100, right: 40 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={98} />
              <Tooltip content={<CustomTooltip />} />
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <Bar dataKey="value" name="Antal" radius={[0, 4, 4, 0]}>
                {byType.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
                <LabelList dataKey="value" position="right" style={{ fontSize: 11 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* By priority */}
        <Card title="Aktive AO'er pr. prioritet">
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie data={byPriority} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={PieLabel}>
                  {byPriority.map((entry, i) => (
                    <Cell key={i} fill={PRIORITY_COLORS[entry.name] ?? '#9ca3af'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {byPriority.map(p => (
                <div key={p.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: PRIORITY_COLORS[p.name] ?? '#9ca3af' }} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{p.name}</span>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 ml-auto pl-4">{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Row 4: Top assets */}
      <Card title={`Top ${topAssets.length} aktiver med åbne arbejdsordrer`}>
        {topAssets.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Ingen aktive arbejdsordrer</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topAssets} margin={{ left: 0, right: 10, top: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <Bar dataKey="value" name="Åbne AO'er" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="value" position="top" style={{ fontSize: 10 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  )
}
