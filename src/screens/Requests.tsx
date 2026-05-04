import { useState, useMemo } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { da } from 'date-fns/locale'
import { Check, Calendar, X, User } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'
import type { WorkOrder } from '../types'

function fmt(dateStr: string) {
  try { const d = parseISO(dateStr); return isValid(d) ? format(d, 'd. MMM yyyy', { locale: da }) : dateStr }
  catch { return dateStr }
}

const FILTER_STATUSES = ['Arbejdsanmodning', 'Åben', 'Afsluttet'] as const
type FilterStatus = typeof FILTER_STATUSES[number]

function RequestDetail({ wo, onClose }: { wo: WorkOrder; onClose: () => void }) {
  const { assets, users, acceptRequest, planRequest } = useStore()
  const asset = assets.find(a => a.id === wo.assetId)
  const [dueDate, setDueDate] = useState('')
  const [assigneeId, setAssigneeId] = useState(wo.assigneeId ?? '')

  return (
    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md max-h-[90vh] bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex flex-col z-40 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between">
        <div>
          <span className="text-xs font-mono text-gray-400">{wo.id}</span>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{wo.title}</h2>
        </div>
        <button onClick={onClose} className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Contact info */}
        {(wo.requesterName || wo.requesterEmail || wo.requesterPhone) && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-1.5">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Rekvirent</h4>
            {wo.requesterName && <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{wo.requesterName}</p>}
            {wo.requesterEmail && <p className="text-sm text-gray-600 dark:text-gray-400">{wo.requesterEmail}</p>}
            {wo.requesterPhone && <p className="text-sm text-gray-600 dark:text-gray-400">{wo.requesterPhone}</p>}
          </div>
        )}

        {/* Asset */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Aktiv / Lokation</h4>
          <p className="text-sm text-gray-800 dark:text-gray-200">{asset?.name ?? '—'}</p>
          {asset && <p className="text-xs text-gray-400">{asset.location}</p>}
        </div>

        {/* Description */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Beskrivelse</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{wo.description || '—'}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Prioritet</p>
            <p className="font-medium text-gray-800 dark:text-gray-200">{wo.priority}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Modtaget</p>
            <p className="font-medium text-gray-800 dark:text-gray-200">{fmt(wo.createdAt)}</p>
          </div>
        </div>

        {/* Actions */}
        {wo.status === 'Arbejdsanmodning' && (
          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Behandling</h4>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tildel tekniker</label>
              <select
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
              >
                <option value="">Ikke tildelt</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.role}</option>)}
              </select>
            </div>
            <button
              onClick={() => acceptRequest(wo.id, assigneeId || null)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              <Check size={15} /> Acceptér anmodning
            </button>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Planlæg til dato</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 mb-2"
              />
              <button
                onClick={() => dueDate && planRequest(wo.id, dueDate, assigneeId || null)}
                disabled={!dueDate}
                className="w-full flex items-center justify-center gap-2 py-2 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calendar size={15} /> Planlæg
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Requests() {
  const { workOrders, assets, users } = useStore()
  const [filter, setFilter] = useState<FilterStatus | null>(null)
  const [selected, setSelected] = useState<WorkOrder | null>(null)

  const requests = useMemo(() => {
    return workOrders
      .filter(wo => {
        if (!filter) return ['Arbejdsanmodning', 'Åben', 'Planlagt', 'Afsluttet'].includes(wo.status)
        if (filter === 'Åben') return ['Åben', 'Planlagt', 'I gang', 'Afventer'].includes(wo.status)
        return wo.status === filter
      })
      .filter(wo => wo.requesterName || wo.status === 'Arbejdsanmodning')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [workOrders, filter])

  const counts = useMemo(() => ({
    Arbejdsanmodning: workOrders.filter(wo => wo.status === 'Arbejdsanmodning' && (wo.requesterName || true)).length,
    Åben: workOrders.filter(wo => ['Åben', 'Planlagt', 'I gang'].includes(wo.status) && wo.requesterName).length,
    Afsluttet: workOrders.filter(wo => wo.status === 'Afsluttet' && wo.requesterName).length,
  }), [workOrders])

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Anmodninger</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Behandling af indkomne arbejdsanmodninger fra gæsteportalen</p>
      </div>

      {/* Status bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilter(null)}
          className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', filter === null ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700')}
        >
          Vis alle
        </button>
        <button
          onClick={() => setFilter(filter === 'Arbejdsanmodning' ? null : 'Arbejdsanmodning')}
          className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', filter === 'Arbejdsanmodning' && 'ring-2 ring-purple-500 ring-offset-1')}
        >
          Afventer ({counts.Arbejdsanmodning})
        </button>
        <button
          onClick={() => setFilter(filter === 'Åben' ? null : 'Åben')}
          className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', filter === 'Åben' && 'ring-2 ring-blue-500 ring-offset-1')}
        >
          Accepterede ({counts.Åben})
        </button>
        <button
          onClick={() => setFilter(filter === 'Afsluttet' ? null : 'Afsluttet')}
          className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', filter === 'Afsluttet' && 'ring-2 ring-green-500 ring-offset-1')}
        >
          Afsluttede ({counts.Afsluttet})
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {requests.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-10 text-center text-sm text-gray-400">
            Ingen anmodninger i denne kategori
          </div>
        )}
        {requests.map(wo => {
          const asset = assets.find(a => a.id === wo.assetId)
          const assignee = users.find(u => u.id === wo.assigneeId)
          const isPending = wo.status === 'Arbejdsanmodning'
          return (
            <div
              key={wo.id}
              onClick={() => setSelected(wo)}
              className={clsx(
                'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 cursor-pointer hover:shadow-md transition-shadow',
                selected?.id === wo.id && 'ring-2 ring-blue-500'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-gray-400">{wo.id}</span>
                    <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium',
                      isPending ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                      wo.status === 'Afsluttet' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    )}>{wo.status}</span>
                    <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium',
                      wo.priority === 'Høj' || wo.priority === 'Kritisk' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      wo.priority === 'Lav' ? 'bg-gray-100 text-gray-500 dark:bg-gray-800' :
                      'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                    )}>{wo.priority}</span>
                  </div>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 truncate">{wo.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    {wo.requesterName && (
                      <span className="flex items-center gap-1"><User size={10} /> {wo.requesterName}</span>
                    )}
                    <span>{asset?.name ?? '—'}</span>
                    <span>{fmt(wo.createdAt)}</span>
                    {assignee && <span className="flex items-center gap-1">→ {assignee.name}</span>}
                  </div>
                </div>
                {isPending && (
                  <div className="shrink-0 flex items-center gap-1 text-amber-500">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs font-medium">Afventer</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selected && (
        <>
          <RequestDetail wo={workOrders.find(w => w.id === selected.id)!} onClose={() => setSelected(null)} />
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30" onClick={() => setSelected(null)} />
        </>
      )}
    </div>
  )
}
