import { useState, useMemo } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { da } from 'date-fns/locale'
import { Plus, X, ShieldCheck, AlertTriangle, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'
import PharmaSignoffModal from '../components/PharmaSignoffModal'
import type { DevType, DevSeverity, DevStatus, DeviationRecord } from '../types'

const STATUS_COLORS: Record<DevStatus, string> = {
  'Åben':                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Under undersøgelse':  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Afventer CAPA':       'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Verificeret':         'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'Lukket':              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}
const SEVERITY_COLORS: Record<DevSeverity, string> = {
  'Kritisk': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Høj':     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Medium':  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Lav':     'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}
const ALL_STATUSES: DevStatus[] = ['Åben', 'Under undersøgelse', 'Afventer CAPA', 'Verificeret', 'Lukket']

function fmt(s: string) {
  try { const d = parseISO(s); return isValid(d) ? format(d, 'd. MMM yyyy', { locale: da }) : s } catch { return s }
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 flex flex-col gap-0.5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={clsx('text-2xl font-semibold', color)}>{value}</p>
    </div>
  )
}

// ── Detail panel ────────────────────────────────────────────────────────────

function DetailPanel({ record, onClose, onUpdate, pharmaMode }: {
  record: DeviationRecord
  onClose: () => void
  onUpdate: (id: string, patch: Partial<DeviationRecord>) => void
  pharmaMode: boolean
}) {
  const [showSignoff, setShowSignoff] = useState(false)
  const [rootCause, setRootCause] = useState(record.rootCause ?? '')

  function handleClose() {
    if (pharmaMode) { setShowSignoff(true); return }
    onUpdate(record.id, { status: 'Lukket' })
  }

  return (
    <>
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-40">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-slate-400">{record.id}</span>
              <span className={clsx('text-[10px] px-2 py-0.5 rounded font-medium', SEVERITY_COLORS[record.severity])}>{record.severity}</span>
              <span className={clsx('text-[10px] px-2 py-0.5 rounded font-medium', STATUS_COLORS[record.status])}>{record.status}</span>
            </div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug max-w-xs">{record.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Type', record.type],
              ['Aktiv', record.assetName],
              ['Indberettet af', record.reportedBy],
              ['Dato', fmt(record.reportedAt)],
              ['CAPA-referencer', record.capaIds.length ? record.capaIds.join(', ') : 'Ingen'],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-[11px] text-slate-400 mb-0.5">{label}</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{val}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Beskrivelse</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{record.description}</p>
          </div>

          {/* Root cause */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Rodårsag</p>
            {record.status === 'Lukket' ? (
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{record.rootCause || '—'}</p>
            ) : (
              <>
                <textarea
                  rows={3}
                  value={rootCause}
                  onChange={e => setRootCause(e.target.value)}
                  placeholder="Beskriv rodårsagen til afvigelsen..."
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => onUpdate(record.id, { rootCause })}
                  className="mt-1.5 text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Gem rodårsag
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer actions */}
        {record.status !== 'Lukket' && (
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-2">
            {record.status !== 'Verificeret' && (
              <select
                value={record.status}
                onChange={e => onUpdate(record.id, { status: e.target.value as DevStatus })}
                className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {ALL_STATUSES.filter(s => s !== 'Lukket').map(s => <option key={s}>{s}</option>)}
              </select>
            )}
            <button
              onClick={handleClose}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {pharmaMode && <ShieldCheck size={14} />}
              Luk afvigelse{pharmaMode ? ' (GMP-signatur)' : ''}
            </button>
          </div>
        )}
      </div>

      {showSignoff && (
        <PharmaSignoffModal
          actionLabel="Luk afvigelse"
          entityName={`${record.id}: ${record.title}`}
          onConfirm={(comment) => {
            onUpdate(record.id, { status: 'Lukket', rootCause: rootCause || record.rootCause })
            setShowSignoff(false)
          }}
          onCancel={() => setShowSignoff(false)}
        />
      )}
    </>
  )
}

// ── Main screen ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: '', type: 'Udstyr' as DevType, severity: 'Høj' as DevSeverity,
  reportedBy: '', assetName: '', description: '',
}

export default function Afvigelser() {
  const pharmaMode = useStore(s => s.settings.pharmaMode)
  const activeUser = useStore(s => s.users.find(u => u.id === s.activeUserId))
  const records = useStore(s => s.deviations)
  const updateDeviation = useStore(s => s.updateDeviation)
  const createDeviation = useStore(s => s.createDeviation)
  const [filterStatus, setFilterStatus] = useState<DevStatus | null>(null)
  const [selected, setSelected] = useState<DeviationRecord | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  function update(id: string, patch: Partial<DeviationRecord>) {
    updateDeviation(id, patch)
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, ...patch } : null)
  }

  function handleCreate() {
    if (!form.title.trim() || !form.description.trim()) return
    createDeviation({
      ...form,
      status: 'Åben',
      reportedBy: form.reportedBy || activeUser?.name || 'Ukendt',
      reportedAt: new Date().toISOString().split('T')[0],
      capaIds: [],
    })
    setForm(EMPTY_FORM)
    setShowCreate(false)
  }

  const filtered = useMemo(() =>
    records.filter(r => !filterStatus || r.status === filterStatus),
    [records, filterStatus]
  )

  const counts = useMemo(() => ({
    total:   records.length,
    open:    records.filter(r => r.status === 'Åben').length,
    inv:     records.filter(r => r.status === 'Under undersøgelse').length,
    capa:    records.filter(r => r.status === 'Afventer CAPA').length,
    kritisk: records.filter(r => r.severity === 'Kritisk').length,
  }), [records])

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Afvigelser</h1>
            {pharmaMode && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded font-medium">
                <ShieldCheck size={10} /> 21 CFR Part 11
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-0.5">{records.length} afvigelser registreret</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          <Plus size={14} /> Ny afvigelse
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        <StatCard label="Total" value={counts.total} color="text-slate-800 dark:text-slate-100" />
        <StatCard label="Åben" value={counts.open} color="text-blue-600" />
        <StatCard label="Under undersøgelse" value={counts.inv} color="text-amber-600" />
        <StatCard label="Afventer CAPA" value={counts.capa} color="text-orange-600" />
        <StatCard label="Kritiske" value={counts.kritisk} color="text-red-600" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilterStatus(null)}
          className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            !filterStatus ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          )}
        >
          Vis alle ({records.length})
        </button>
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s === filterStatus ? null : s)}
            className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', STATUS_COLORS[s],
              filterStatus === s && 'ring-2 ring-offset-1 ring-blue-500'
            )}
          >
            {s} ({records.filter(r => r.status === s).length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              {['ID', 'Titel', 'Type', 'Alvorlighed', 'Status', 'Indberettet af', 'Dato', 'CAPA'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr
                key={r.id}
                onClick={() => setSelected(r)}
                className={clsx(
                  'border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 cursor-pointer transition-colors',
                  selected?.id === r.id && 'bg-blue-50/60 dark:bg-blue-900/10'
                )}
              >
                <td className="px-3 py-1.5 font-mono text-xs text-slate-500">{r.id}</td>
                <td className="px-3 py-1.5">
                  <div className="flex items-center gap-1.5">
                    {r.severity === 'Kritisk' && <AlertTriangle size={11} className="text-red-500 shrink-0" />}
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[220px]">{r.title}</span>
                  </div>
                </td>
                <td className="px-3 py-1.5 text-xs text-slate-500 whitespace-nowrap">{r.type}</td>
                <td className="px-3 py-1.5">
                  <span className={clsx('text-[10px] px-2 py-0.5 rounded font-medium whitespace-nowrap', SEVERITY_COLORS[r.severity])}>{r.severity}</span>
                </td>
                <td className="px-3 py-1.5">
                  <span className={clsx('text-[10px] px-2 py-0.5 rounded font-medium whitespace-nowrap', STATUS_COLORS[r.status])}>{r.status}</span>
                </td>
                <td className="px-3 py-1.5 text-xs text-slate-500 whitespace-nowrap">{r.reportedBy}</td>
                <td className="px-3 py-1.5 text-xs text-slate-400 whitespace-nowrap">{fmt(r.reportedAt)}</td>
                <td className="px-3 py-1.5 text-xs text-slate-400">
                  {r.capaIds.length > 0
                    ? <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">{r.capaIds.length} <ChevronRight size={11} /></span>
                    : <span className="text-slate-300 dark:text-slate-600">—</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30" onClick={() => setSelected(null)} />
          <DetailPanel
            record={records.find(r => r.id === selected.id)!}
            onClose={() => setSelected(null)}
            onUpdate={update}
            pharmaMode={pharmaMode}
          />
        </>
      )}

      {/* Create panel */}
      {showCreate && (
        <>
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30" onClick={() => setShowCreate(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-40">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Ny afvigelse</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {[
                { label: 'Titel *', key: 'title', placeholder: 'Kort beskrivelse af afvigelsen' },
                { label: 'Aktiv / Udstyr', key: 'assetName', placeholder: 'F.eks. HVAC HVC-001' },
                { label: 'Indberettet af', key: 'reportedBy', placeholder: activeUser?.name ?? 'Navn' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{f.label}</label>
                  <input
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={f.placeholder}
                    value={(form as Record<string, string>)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                  <select
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    value={form.type}
                    onChange={e => setForm(prev => ({ ...prev, type: e.target.value as DevType }))}
                  >
                    {(['Procedure', 'Udstyr', 'Miljø', 'Kontaminering', 'Dokumentation'] as DevType[]).map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Alvorlighed</label>
                  <select
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    value={form.severity}
                    onChange={e => setForm(prev => ({ ...prev, severity: e.target.value as DevSeverity }))}
                  >
                    {(['Kritisk', 'Høj', 'Medium', 'Lav'] as DevSeverity[]).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Beskrivelse *</label>
                <textarea
                  rows={4}
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Beskriv hvad der skete..."
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                onClick={handleCreate}
                disabled={!form.title.trim() || !form.description.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-40 transition-colors"
              >
                Opret afvigelse
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
