import { useState, useMemo } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { da } from 'date-fns/locale'
import { Plus, X, Flag } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'
import type { LogEntryType, LogSeverity } from '../types'

function fmt(dateStr: string) {
  try { const d = parseISO(dateStr); return isValid(d) ? format(d, 'd. MMM yyyy', { locale: da }) : dateStr }
  catch { return dateStr }
}

const TYPE_STYLES: Record<LogEntryType, string> = {
  Observation: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Fejl: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  Reparation: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  Inspektion: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Note: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}
const SEV_STYLES: Record<LogSeverity, string> = {
  Lav: 'text-gray-400',
  Medium: 'text-amber-500',
  Høj: 'text-orange-500',
  Kritisk: 'text-red-500',
}

const LOG_TYPES: LogEntryType[] = ['Observation', 'Fejl', 'Reparation', 'Inspektion', 'Note']
const SEVERITIES: LogSeverity[] = ['Lav', 'Medium', 'Høj', 'Kritisk']

export default function LogBook() {
  const { logEntries, assets, users, createLogEntry, activeUserId } = useStore()
  const [typeFilter, setTypeFilter] = useState<LogEntryType | null>(null)
  const [sevFilter, setSevFilter] = useState<LogSeverity | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    assetIds: [] as string[],
    type: 'Observation' as LogEntryType,
    severity: 'Medium' as LogSeverity,
    text: '',
    followUp: false,
    tagInput: '',
    tags: [] as string[],
  })

  const filtered = useMemo(() => {
    return logEntries.filter(e => {
      if (typeFilter && e.type !== typeFilter) return false
      if (sevFilter && e.severity !== sevFilter) return false
      return true
    })
  }, [logEntries, typeFilter, sevFilter])

  function addTag() {
    const t = form.tagInput.trim()
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t], tagInput: '' }))
    else setForm(f => ({ ...f, tagInput: '' }))
  }

  function submit() {
    if (!form.text.trim() || form.assetIds.length === 0) return
    createLogEntry({
      assetIds: form.assetIds,
      type: form.type,
      severity: form.severity,
      text: form.text,
      followUp: form.followUp,
      tags: form.tags,
      userId: activeUserId,
    })
    setForm({ assetIds: [], type: 'Observation', severity: 'Medium', text: '', followUp: false, tagInput: '', tags: [] })
    setShowForm(false)
  }

  const inp = 'w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2'

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Logbog</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{logEntries.length} observationer</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} /> Ny post
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Ny logpost</h3>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Aktiver * (hold Ctrl/Cmd for flere)</label>
            <select multiple className={clsx(inp, 'h-24')} value={form.assetIds} onChange={e => setForm(f => ({ ...f, assetIds: Array.from(e.target.selectedOptions, o => o.value) }))}>
              {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type</label>
              <select className={inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as LogEntryType }))}>
                {LOG_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Alvorlighed</label>
              <select className={inp} value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value as LogSeverity }))}>
                {SEVERITIES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Beskrivelse *</label>
            <textarea className={inp} rows={3} value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} placeholder="Beskriv observationen..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tags</label>
            <div className="flex gap-2 mb-1.5">
              <input className={clsx(inp, 'flex-1')} value={form.tagInput} onChange={e => setForm(f => ({ ...f, tagInput: e.target.value }))} placeholder="Tilføj tag..."
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} />
              <button onClick={addTag} className="px-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">+</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map(t => (
                <span key={t} className="flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                  {t}
                  <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))}><X size={10} /></button>
                </span>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" checked={form.followUp} onChange={e => setForm(f => ({ ...f, followUp: e.target.checked }))} className="rounded" />
            <Flag size={13} className="text-orange-500" /> Kræver opfølgning
          </label>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 text-sm rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">Annuller</button>
            <button onClick={submit} className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Gem post</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex flex-wrap gap-1.5">
          {LOG_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? null : t)}
              className={clsx('px-2.5 py-1 rounded-lg text-xs font-medium transition-colors', typeFilter === t ? TYPE_STYLES[t] + ' ring-2 ring-offset-1 ring-current' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700')}
            >{t}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 ml-2">
          {SEVERITIES.map(s => (
            <button
              key={s}
              onClick={() => setSevFilter(sevFilter === s ? null : s)}
              className={clsx('px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border', sevFilter === s ? 'border-current ' + SEV_STYLES[s] : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800')}
            >{s}</button>
          ))}
        </div>
        {(typeFilter || sevFilter) && (
          <button onClick={() => { setTypeFilter(null); setSevFilter(null) }} className="px-2.5 py-1 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <X size={11} /> Nulstil
          </button>
        )}
      </div>

      {/* Log entries */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-10 text-center text-sm text-gray-400">
            Ingen logposter matcher filteret
          </div>
        )}
        {filtered.map(entry => {
          const entryAssets = entry.assetIds.map(id => assets.find(a => a.id === id)).filter(Boolean)
          const user = users.find(u => u.id === entry.userId)
          return (
            <div key={entry.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={clsx('text-[11px] px-2 py-0.5 rounded font-medium', TYPE_STYLES[entry.type])}>{entry.type}</span>
                  <span className={clsx('text-xs font-medium', SEV_STYLES[entry.severity])}>{entry.severity}</span>
                  {entry.followUp && (
                    <span className="flex items-center gap-1 text-xs text-orange-500">
                      <Flag size={11} /> Opfølgning
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 shrink-0">{fmt(entry.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">{entry.text}</p>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex flex-wrap gap-1">
                  {entryAssets.map(a => a && (
                    <span key={a.id} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded">{a.name}</span>
                  ))}
                  {entry.tags.map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">#{t}</span>
                  ))}
                </div>
                <span className="text-xs text-gray-400">{user?.name ?? entry.userId}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
