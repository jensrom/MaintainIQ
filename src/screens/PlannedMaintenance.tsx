import { useState, useMemo } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { da } from 'date-fns/locale'
import { Check, Plus, X, AlertTriangle, Pencil, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'
import type { PMTask, PMIntervalType } from '../types'

function fmt(dateStr: string | null) {
  if (!dateStr) return '—'
  try { const d = parseISO(dateStr); return isValid(d) ? format(d, 'd. MMM yyyy', { locale: da }) : dateStr }
  catch { return dateStr }
}

const STATUS_STYLES: Record<PMTask['status'], string> = {
  'Forfaldne': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  'Kommende': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Udført': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
}

const inp = 'w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2'

interface PMForm {
  title: string
  assetIds: string[]
  intervalType: PMIntervalType
  frequencyDays: number
  frequencyLabel: string
  nextDue: string
  estimatedHours: number
  assigneeId: string
  isPharma: boolean
  tasks: { id: string; text: string; done: boolean }[]
}

const EMPTY_FORM: PMForm = {
  title: '', assetIds: [], intervalType: 'Fast interval',
  frequencyDays: 30, frequencyLabel: 'Månedlig', nextDue: '',
  estimatedHours: 2, assigneeId: '', isPharma: false, tasks: [],
}

function PMFormModal({
  initial,
  title,
  onSave,
  onClose,
}: {
  initial: PMForm
  title: string
  onSave: (f: PMForm) => void
  onClose: () => void
}) {
  const { assets, users } = useStore()
  const [form, setForm] = useState<PMForm>(initial)
  const [taskText, setTaskText] = useState('')

  function addTask() {
    if (!taskText.trim()) return
    setForm(f => ({ ...f, tasks: [...f.tasks, { id: `t${Date.now()}`, text: taskText.trim(), done: false }] }))
    setTaskText('')
  }

  function removeTask(id: string) {
    setForm(f => ({ ...f, tasks: f.tasks.filter(t => t.id !== id) }))
  }

  function submit() {
    if (!form.title || !form.nextDue || form.assetIds.length === 0) return
    onSave({ ...form, assigneeId: form.assigneeId || '' })
    onClose()
  }

  return (
    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md max-h-[90vh] bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex flex-col z-40 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        <button onClick={onClose} className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Titel *</label>
          <input className={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Opgavetitel..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Aktiver *</label>
          <select multiple className={clsx(inp, 'h-24')} value={form.assetIds} onChange={e => setForm(f => ({ ...f, assetIds: Array.from(e.target.selectedOptions, o => o.value) }))}>
            {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <p className="text-xs text-gray-400 mt-0.5">Hold Ctrl/Cmd for at vælge flere</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Intervaltype</label>
            <select className={inp} value={form.intervalType} onChange={e => setForm(f => ({ ...f, intervalType: e.target.value as PMIntervalType }))}>
              {(['Fast interval', 'Flydende interval', 'Målerbaseret', 'Sæsonbaseret', 'Hændelsesbaseret'] as PMIntervalType[]).map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Interval (dage)</label>
            <input type="number" className={inp} value={form.frequencyDays} onChange={e => setForm(f => ({ ...f, frequencyDays: parseInt(e.target.value) || 30 }))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Intervalbeskrivelse</label>
            <input className={inp} value={form.frequencyLabel} onChange={e => setForm(f => ({ ...f, frequencyLabel: e.target.value }))} placeholder="f.eks. Kvartalsvis" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Næste forfald *</label>
            <input type="date" className={inp} value={form.nextDue} onChange={e => setForm(f => ({ ...f, nextDue: e.target.value }))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Est. timer</label>
            <input type="number" min="0.5" step="0.5" className={inp} value={form.estimatedHours} onChange={e => setForm(f => ({ ...f, estimatedHours: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ansvarlig</label>
            <select className={inp} value={form.assigneeId} onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}>
              <option value="">Ikke tildelt</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tjekliste</label>
          <div className="space-y-1 mb-2">
            {form.tasks.map(t => (
              <div key={t.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                <span className="flex-1">{t.text}</span>
                <button onClick={() => removeTask(t.id)} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input className={clsx(inp, 'flex-1')} value={taskText} onChange={e => setTaskText(e.target.value)} placeholder="Tilføj opgavepunkt..."
              onKeyDown={e => { if (e.key === 'Enter') addTask() }} />
            <button onClick={addTask} className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">+</button>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input type="checkbox" checked={form.isPharma} onChange={e => setForm(f => ({ ...f, isPharma: e.target.checked }))} className="rounded" />
          🧪 GMP/Pharma-relateret
        </label>
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 text-sm rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Annuller</button>
        <button onClick={submit} className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">Gem</button>
      </div>
    </div>
  )
}

function PMDetail({
  pm,
  onClose,
  onEdit,
  onDelete,
}: {
  pm: PMTask
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { assets, users, markPMDone, togglePMTask } = useStore()
  const assignee = users.find(u => u.id === pm.assigneeId)
  const pmAssets = pm.assetIds.map(id => assets.find(a => a.id === id)).filter(Boolean)
  const done = pm.tasks.filter(t => t.done).length
  const progress = pm.tasks.length ? Math.round((done / pm.tasks.length) * 100) : 0
  const today = new Date().toISOString().split('T')[0]
  const isOverdue = pm.nextDue < today && pm.status !== 'Udført'
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md max-h-[90vh] bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex flex-col z-40 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {pm.isPharma && <span>🧪</span>}
            <span className={clsx('text-[10px] px-2 py-0.5 rounded font-medium', STATUS_STYLES[pm.status])}>{pm.status}</span>
          </div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">{pm.title}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1.5 rounded text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800" title="Redigér"><Pencil size={15} /></button>
          <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800" title="Slet"><Trash2 size={15} /></button>
          <button onClick={onClose} className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={16} /></button>
        </div>
      </div>

      {confirmDelete && (
        <div className="mx-4 mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300 mb-2">Slet <strong>{pm.title}</strong>? Dette kan ikke fortrydes.</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDelete(false)} className="flex-1 py-1.5 border border-gray-200 dark:border-gray-700 text-xs rounded-lg text-gray-600 dark:text-gray-400">Annuller</button>
            <button onClick={onDelete} className="flex-1 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">Slet</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Interval</p>
            <p className="font-medium text-gray-800 dark:text-gray-200">{pm.frequencyLabel}</p>
            <p className="text-xs text-gray-400">{pm.intervalType}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Ansvarlig</p>
            <p className="font-medium text-gray-800 dark:text-gray-200">{assignee?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Sidst udført</p>
            <p className="font-medium text-gray-800 dark:text-gray-200">{fmt(pm.lastDone)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Næste forfald</p>
            <p className={clsx('font-medium', isOverdue ? 'text-red-500' : 'text-gray-800 dark:text-gray-200')}>
              {isOverdue && <AlertTriangle size={12} className="inline mr-1" />}
              {fmt(pm.nextDue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Estimerede timer</p>
            <p className="font-medium text-gray-800 dark:text-gray-200">{pm.estimatedHours} t</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tilknyttede aktiver</p>
          <div className="flex flex-wrap gap-1.5">
            {pmAssets.map(a => a && (
              <span key={a.id} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded">{a.name}</span>
            ))}
          </div>
        </div>

        {pm.tasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tjekliste</p>
              <span className="text-xs text-gray-400">{done}/{pm.tasks.length} · {progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="space-y-1.5">
              {pm.tasks.map(t => (
                <label key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <div
                    onClick={() => togglePMTask(pm.id, t.id)}
                    className={clsx('w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors', t.done ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600')}
                  >
                    {t.done && <Check size={11} className="text-white" />}
                  </div>
                  <span className={clsx('text-sm', t.done && 'line-through text-gray-400')}>{t.text}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {pm.status !== 'Udført' && (
          <button
            onClick={() => { markPMDone(pm.id); onClose() }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors"
          >
            <Check size={16} /> Markér som udført
          </button>
        )}
      </div>
    </div>
  )
}

export default function PlannedMaintenance() {
  const { pmTasks, assets, users, createPMTask, updatePMTask, deletePMTask } = useStore()
  const [selected, setSelected] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const today = new Date().toISOString().split('T')[0]

  const overdueCount = pmTasks.filter(pm => pm.nextDue < today && pm.status !== 'Udført').length
  const doneCount = pmTasks.filter(pm => pm.status === 'Udført').length
  const compliance = pmTasks.length ? Math.round((doneCount / pmTasks.length) * 100) : 0

  const selectedPm = pmTasks.find(p => p.id === selected) ?? null
  const editingPm = pmTasks.find(p => p.id === editingId) ?? null

  function handleDelete() {
    if (!selected) return
    deletePMTask(selected)
    setSelected(null)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Planlagt vedligehold</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{pmTasks.length} PM-opgaver</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setSelected(null); setEditingId(null) }}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} /> Ny PM-opgave
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-400 mb-1">PM-compliance</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{compliance}%</p>
          <div className="mt-1.5 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${compliance}%` }} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-400 mb-1">Forfaldne</p>
          <p className="text-2xl font-bold text-red-500">{overdueCount}</p>
          <p className="text-xs text-gray-400 mt-1">PM-opgaver</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-400 mb-1">Udført i alt</p>
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{doneCount}</p>
          <p className="text-xs text-gray-400 mt-1">af {pmTasks.length} opgaver</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {['Opgave', 'Aktiver', 'Frekvens', 'Sidst udført', 'Næste forfald', 'Status', 'Timer', 'Ansvarlig', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pmTasks.map(pm => {
                const assignee = users.find(u => u.id === pm.assigneeId)
                const pmAssets = pm.assetIds.map(id => assets.find(a => a.id === id)).filter(Boolean)
                const isOverdue = pm.nextDue < today && pm.status !== 'Udført'
                return (
                  <tr
                    key={pm.id}
                    onClick={() => { setSelected(pm.id); setShowCreate(false); setEditingId(null) }}
                    className={clsx('border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer', selected === pm.id && 'bg-blue-50 dark:bg-blue-900/20')}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {pm.isPharma && <span>🧪</span>}
                        <span className="font-medium text-gray-800 dark:text-gray-200">{pm.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {pmAssets.slice(0, 2).map(a => a && (
                          <span key={a.id} className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded">{a.name}</span>
                        ))}
                        {pmAssets.length > 2 && <span className="text-xs text-gray-400">+{pmAssets.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-700 dark:text-gray-300">{pm.frequencyLabel}</p>
                      <p className="text-xs text-gray-400">{pm.intervalType}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{fmt(pm.lastDone)}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('text-xs font-medium', isOverdue ? 'text-red-500' : 'text-gray-600 dark:text-gray-400')}>
                        {isOverdue && <AlertTriangle size={11} className="inline mr-1" />}
                        {fmt(pm.nextDue)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('text-[11px] px-2 py-0.5 rounded font-medium', STATUS_STYLES[pm.status])}>{pm.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{pm.estimatedHours} t</td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{assignee?.name ?? '—'}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {pm.status !== 'Udført' && (
                        <button
                          onClick={() => useStore.getState().markPMDone(pm.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors whitespace-nowrap"
                        >
                          <Check size={11} /> Markér udført
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPm && !editingId && (
        <>
          <PMDetail
            pm={pmTasks.find(p => p.id === selected)!}
            onClose={() => setSelected(null)}
            onEdit={() => { setEditingId(selected); setSelected(null) }}
            onDelete={handleDelete}
          />
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30" onClick={() => setSelected(null)} />
        </>
      )}

      {showCreate && (
        <>
          <PMFormModal
            initial={EMPTY_FORM}
            title="Opret PM-opgave"
            onSave={form => createPMTask({ ...form, assigneeId: form.assigneeId || null })}
            onClose={() => setShowCreate(false)}
          />
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30" onClick={() => setShowCreate(false)} />
        </>
      )}

      {editingPm && (
        <>
          <PMFormModal
            initial={{
              title: editingPm.title,
              assetIds: editingPm.assetIds,
              intervalType: editingPm.intervalType,
              frequencyDays: editingPm.frequencyDays,
              frequencyLabel: editingPm.frequencyLabel,
              nextDue: editingPm.nextDue,
              estimatedHours: editingPm.estimatedHours,
              assigneeId: editingPm.assigneeId ?? '',
              isPharma: editingPm.isPharma,
              tasks: editingPm.tasks,
            }}
            title="Redigér PM-opgave"
            onSave={form => updatePMTask(editingId!, { ...form, assigneeId: form.assigneeId || null })}
            onClose={() => setEditingId(null)}
          />
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30" onClick={() => setEditingId(null)} />
        </>
      )}
    </div>
  )
}
