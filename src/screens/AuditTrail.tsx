import { useState, useMemo } from 'react'
import { Search, Activity } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'
import type { AuditAction } from '../types'

const ACTION_LABELS: Record<AuditAction, string> = {
  create_asset:      'Enhed oprettet',
  update_asset:      'Enhed opdateret',
  delete_asset:      'Enhed slettet',
  create_wo:         'Arbejdsordre oprettet',
  update_wo_status:  'Status ændret',
  update_wo:         'Arbejdsordre opdateret',
  create_category:   'Kategori oprettet',
  update_category:   'Kategori opdateret',
  delete_category:   'Kategori slettet',
  create_log_entry:  'Logpost oprettet',
  adjust_stock:      'Lager justeret',
  mark_pm_done:      'PM markeret udført',
  create_pm:         'PM-opgave oprettet',
  accept_request:    'Anmodning accepteret',
}

const ACTION_COLORS: Record<AuditAction, string> = {
  create_asset:      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  update_asset:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  delete_asset:      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  create_wo:         'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  update_wo_status:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  update_wo:         'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  create_category:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  update_category:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  delete_category:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  create_log_entry:  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  adjust_stock:      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  mark_pm_done:      'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  create_pm:         'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  accept_request:    'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
}

const ENTITY_LABELS: Record<string, string> = {
  asset: 'Enhed',
  work_order: 'Arbejdsordre',
  asset_category: 'Kategori',
  spare_part: 'Reservedel',
  log_entry: 'Logpost',
  pm_task: 'PM-opgave',
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('da-DK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AuditTrail() {
  const { auditLog, users } = useStore()
  const [search, setSearch]           = useState('')
  const [filterEntity, setFilterEntity] = useState('')
  const [filterUser, setFilterUser]   = useState('')

  const filtered = useMemo(() => {
    return auditLog.filter(e => {
      if (filterEntity && e.entityType !== filterEntity) return false
      if (filterUser && e.userId !== filterUser) return false
      if (search) {
        const q = search.toLowerCase()
        return e.entityName.toLowerCase().includes(q) || e.details.toLowerCase().includes(q)
      }
      return true
    })
  }, [auditLog, filterEntity, filterUser, search])

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Audit Trail</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Komplet log over alle systemændringer</p>
        </div>
        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2.5 py-1 rounded-full font-medium">
          {auditLog.length} poster
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Søg i log..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={filterEntity}
          onChange={e => setFilterEntity(e.target.value)}
        >
          <option value="">Alle entiteter</option>
          {Object.entries(ENTITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={filterUser}
          onChange={e => setFilterUser(e.target.value)}
        >
          <option value="">Alle brugere</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      {/* Log */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Activity size={32} className="mb-3 opacity-40" />
            <p className="text-sm">
              {auditLog.length === 0
                ? 'Ingen handlinger logget endnu — udfør en handling for at se den her'
                : 'Ingen poster matcher søgningen'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Tidspunkt</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Handling</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Entitet</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Detaljer</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Bruger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filtered.map(entry => {
                  const user = users.find(u => u.id === entry.userId)
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap font-mono">
                        {fmtTime(entry.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('text-[11px] px-2 py-0.5 rounded font-medium whitespace-nowrap', ACTION_COLORS[entry.action])}>
                          {ACTION_LABELS[entry.action]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{entry.entityName}</p>
                        <p className="text-[11px] text-gray-400">{ENTITY_LABELS[entry.entityType]} · {entry.entityId}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                        {entry.details}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center">
                            {user?.initials ?? '?'}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{user?.name ?? entry.userId}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
