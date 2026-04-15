import { useState, useMemo } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { da } from 'date-fns/locale'
import { Plus, X, ShieldCheck, AlertTriangle, Check } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'
import PharmaSignoffModal from '../components/PharmaSignoffModal'

type CAPAType   = 'Korrigerende' | 'Forebyggende'
type CAPAStatus = 'Åben' | 'I gang' | 'Afventer verifikation' | 'Verificeret' | 'Lukket'

interface CAPARecord {
  id: string
  title: string
  type: CAPAType
  deviationId: string
  assignee: string
  dueDate: string
  status: CAPAStatus
  description: string
  actions: string[]
  actionsDone: boolean[]
  completedAt?: string
}

const today = new Date().toISOString().split('T')[0]

const INITIAL: CAPARecord[] = [
  {
    id: 'CAPA-001', title: 'Udskiftning af temperatursensor zone 3',
    type: 'Korrigerende', deviationId: 'DEV-001', assignee: 'Anders Nielsen',
    dueDate: '2025-04-05', status: 'Afventer verifikation',
    description: 'Defekt temperatursensor i HVAC zone 3 skal udskiftes og kalibreres iht. SOP-CAL-012.',
    actions: [
      'Identificer og bestil ny sensor (type PT100)',
      'Afmonter og udskift defekt sensor',
      'Kalibrer ny sensor iht. SOP-CAL-012',
      'Kør 24-timers verifikationstest',
      'Opdater kalibreringsdatabasen',
    ],
    actionsDone: [true, true, true, false, false],
  },
  {
    id: 'CAPA-002', title: 'Revision af alarm-eskaleringsprocedure',
    type: 'Forebyggende', deviationId: 'DEV-001', assignee: 'Kirsten Sørensen',
    dueDate: '2025-04-15', status: 'I gang',
    description: 'SOP-ALM-003 revideres for at sikre hurtigere eskalering ved temperaturalarmer i produktionshal A.',
    actions: [
      'Gennemgang af eksisterende SOP-ALM-003',
      'Kortlæg svaghedspunkter i eskaleringsflow',
      'Udkast til ny procedure med ansvarlig matrix',
      'Review og godkendelse af kvalitetsafdeling',
      'Træning af berørt personale',
      'Implementér og verificér ny procedure',
    ],
    actionsDone: [true, true, false, false, false, false],
  },
  {
    id: 'CAPA-003', title: 'Genoptræning af operatører i rengøringsprocedure',
    type: 'Korrigerende', deviationId: 'DEV-002', assignee: 'Mette Hansen',
    dueDate: '2025-04-10', status: 'Lukket',
    description: 'Alle operatører med adgang til autoklav AUT-001 gennemfører obligatorisk genoptræning i SOP-CLN-004.',
    actions: [
      'Identificer berørte operatører (7 pers.)',
      'Planlæg træningssessioner',
      'Gennemfør træning med praktisk test',
      'Dokumenter og arkivér træningsbeviser',
    ],
    actionsDone: [true, true, true, true],
    completedAt: '2025-03-28',
  },
  {
    id: 'CAPA-004', title: 'Planlagt udskiftning af pakninger KOM-001',
    type: 'Korrigerende', deviationId: 'DEV-004', assignee: 'Anders Nielsen',
    dueDate: '2025-03-30', status: 'Verificeret',
    description: 'Slidte pakninger i trykregulatoren på kompressor KOM-001 udskiftes og funktionstest udføres.',
    actions: [
      'Bestil reservedele (pakkingssæt nr. KOM-PK-042)',
      'Planlæg servicenedlukning',
      'Udskift pakninger',
      'Gennemfør tryctest (6,5–7,0 bar)',
      'Dokumentér i servicelogbog',
    ],
    actionsDone: [true, true, true, true, true],
    completedAt: '2025-03-29',
  },
  {
    id: 'CAPA-005', title: 'Udskiftning af HEPA-filter i renrum B',
    type: 'Korrigerende', deviationId: 'DEV-005', assignee: 'Lars Petersen',
    dueDate: '2025-02-20', status: 'Lukket',
    description: 'Defekt HEPA-filter udskiftes og renrummet valideres på ny iht. SOP-VAL-007.',
    actions: [
      'Evakuér og luk renrum',
      'Udskift HEPA-filter (H14 klasse)',
      'Udfør partikeltælling og sedimentation',
      'Genvalider renrum iht. SOP-VAL-007',
      'Genoptag produktion',
    ],
    actionsDone: [true, true, true, true, true],
    completedAt: '2025-02-18',
  },
  {
    id: 'CAPA-006', title: 'Forebyggende HEPA-filterprogram implementeret',
    type: 'Forebyggende', deviationId: 'DEV-005', assignee: 'Kirsten Sørensen',
    dueDate: '2025-03-15', status: 'Lukket',
    description: 'Indfør kvartalsvise HEPA-filtereftersyn som fast PM-opgave i CMMS.',
    actions: [
      'Udarbejd PM-procedure for HEPA-inspektion',
      'Opret PM-opgave i CMMS med 90-dages interval',
      'Tildel ansvarlig tekniker',
    ],
    actionsDone: [true, true, true],
    completedAt: '2025-03-10',
  },
  {
    id: 'CAPA-007', title: 'Implementér kalibrerings-påmindelsessystem',
    type: 'Forebyggende', deviationId: 'DEV-006', assignee: 'Lars Petersen',
    dueDate: '2025-04-30', status: 'I gang',
    description: 'Opsæt automatisk notifikation 30 dage før udløb af kalibreringscertifikater for alt QC-udstyr.',
    actions: [
      'Kortlæg alt QC-udstyr med kalibreringskrav',
      'Konfigurér notifikationsregler i CMMS',
      'Test notifikationsflow med testdata',
      'Dokumentér i SOP-CAL-001',
      'Træning af QC-personale',
    ],
    actionsDone: [true, false, false, false, false],
  },
  {
    id: 'CAPA-008', title: 'Revision af dispenseringsprocedure Lab D',
    type: 'Korrigerende', deviationId: 'DEV-008', assignee: 'Peter Madsen',
    dueDate: '2025-04-20', status: 'Åben',
    description: 'SOP-LAB-008 (dispensering af råmaterialer) revideres med tydeliggørelse af vejeprocedure og dobbeltcheck-krav.',
    actions: [
      'Gennemgang af eksisterende SOP-LAB-008',
      'Identificer uklarhedspunkter',
      'Udkast til revideret procedure',
      'Kvalitetsgodkendelse',
      'Implementering og træning',
    ],
    actionsDone: [false, false, false, false, false],
  },
]

const STATUS_COLORS: Record<CAPAStatus, string> = {
  'Åben':                   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'I gang':                 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Afventer verifikation':  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Verificeret':            'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'Lukket':                 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

const ALL_STATUSES: CAPAStatus[] = ['Åben', 'I gang', 'Afventer verifikation', 'Verificeret', 'Lukket']

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

// ── Detail panel ─────────────────────────────────────────────────────────────

function DetailPanel({ record, onClose, onUpdate, pharmaMode }: {
  record: CAPARecord
  onClose: () => void
  onUpdate: (id: string, patch: Partial<CAPARecord>) => void
  pharmaMode: boolean
}) {
  const [showSignoff, setShowSignoff] = useState<'verify' | 'close' | null>(null)
  const isOverdue = record.dueDate < today && !['Verificeret', 'Lukket'].includes(record.status)

  function handleVerify() {
    if (pharmaMode) { setShowSignoff('verify'); return }
    onUpdate(record.id, { status: 'Verificeret' })
  }
  function handleClose() {
    if (pharmaMode) { setShowSignoff('close'); return }
    onUpdate(record.id, { status: 'Lukket', completedAt: today })
  }
  function toggleAction(idx: number) {
    const next = [...record.actionsDone]
    next[idx] = !next[idx]
    onUpdate(record.id, { actionsDone: next })
  }

  const doneCount = record.actionsDone.filter(Boolean).length

  return (
    <>
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-40">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-slate-400">{record.id}</span>
              <span className={clsx('text-[10px] px-2 py-0.5 rounded font-medium', record.type === 'Korrigerende' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400')}>
                {record.type}
              </span>
              <span className={clsx('text-[10px] px-2 py-0.5 rounded font-medium', STATUS_COLORS[record.status])}>{record.status}</span>
            </div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug max-w-xs">{record.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Afvigelse', record.deviationId],
              ['Ansvarlig', record.assignee],
              ['Forfald', fmt(record.dueDate)],
              ...(record.completedAt ? [['Lukket', fmt(record.completedAt)]] : []),
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-[11px] text-slate-400 mb-0.5">{label}</p>
                <p className={clsx('text-sm font-medium', label === 'Forfald' && isOverdue ? 'text-red-500' : 'text-slate-800 dark:text-slate-200')}>
                  {label === 'Forfald' && isOverdue && <AlertTriangle size={11} className="inline mr-1" />}
                  {val}
                </p>
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Beskrivelse</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{record.description}</p>
          </div>

          {/* Action steps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Handlinger</p>
              <span className="text-xs text-slate-400">{doneCount}/{record.actions.length} udført</span>
            </div>
            {record.actions.length > 0 && (
              <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full mb-3">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(doneCount / record.actions.length) * 100}%` }}
                />
              </div>
            )}
            <div className="space-y-2">
              {record.actions.map((action, i) => (
                <label
                  key={i}
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  onClick={() => { if (record.status !== 'Lukket') toggleAction(i) }}
                >
                  <div className={clsx(
                    'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                    record.actionsDone[i] ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600'
                  )}>
                    {record.actionsDone[i] && <Check size={11} className="text-white" />}
                  </div>
                  <span className={clsx('text-sm leading-snug', record.actionsDone[i] && 'line-through text-slate-400')}>
                    <span className="text-slate-400 mr-1">{i + 1}.</span>
                    {action}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        {!['Lukket'].includes(record.status) && (
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-2">
            {record.status === 'Afventer verifikation' && (
              <button
                onClick={handleVerify}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-teal-500 text-teal-600 dark:text-teal-400 text-sm font-medium rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
              >
                {pharmaMode && <ShieldCheck size={14} />}
                Verificér CAPA{pharmaMode ? ' (GMP-signatur)' : ''}
              </button>
            )}
            {record.status === 'Verificeret' && (
              <button
                onClick={handleClose}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {pharmaMode && <ShieldCheck size={14} />}
                Luk CAPA{pharmaMode ? ' (GMP-signatur)' : ''}
              </button>
            )}
            {!['Afventer verifikation', 'Verificeret'].includes(record.status) && (
              <select
                value={record.status}
                onChange={e => onUpdate(record.id, { status: e.target.value as CAPAStatus })}
                className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {(['Åben', 'I gang', 'Afventer verifikation'] as CAPAStatus[]).map(s => <option key={s}>{s}</option>)}
              </select>
            )}
          </div>
        )}
      </div>

      {showSignoff && (
        <PharmaSignoffModal
          actionLabel={showSignoff === 'verify' ? 'Verificér CAPA' : 'Luk CAPA'}
          entityName={`${record.id}: ${record.title}`}
          onConfirm={() => {
            if (showSignoff === 'verify') onUpdate(record.id, { status: 'Verificeret' })
            else onUpdate(record.id, { status: 'Lukket', completedAt: today })
            setShowSignoff(null)
          }}
          onCancel={() => setShowSignoff(null)}
        />
      )}
    </>
  )
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function CAPA() {
  const pharmaMode = useStore(s => s.settings.pharmaMode)
  const [records, setRecords] = useState<CAPARecord[]>(INITIAL)
  const [filterStatus, setFilterStatus] = useState<CAPAStatus | null>(null)
  const [selected, setSelected] = useState<CAPARecord | null>(null)

  function update(id: string, patch: Partial<CAPARecord>) {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, ...patch } : null)
  }

  const filtered = useMemo(() =>
    records.filter(r => !filterStatus || r.status === filterStatus),
    [records, filterStatus]
  )

  const counts = useMemo(() => ({
    total:    records.length,
    open:     records.filter(r => r.status === 'Åben').length,
    active:   records.filter(r => r.status === 'I gang').length,
    pending:  records.filter(r => r.status === 'Afventer verifikation').length,
    overdue:  records.filter(r => r.dueDate < today && !['Verificeret', 'Lukket'].includes(r.status)).length,
  }), [records])

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">CAPA</h1>
            {pharmaMode && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded font-medium">
                <ShieldCheck size={10} /> 21 CFR Part 11
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-0.5">Corrective and Preventive Actions — {records.length} registreret</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus size={14} /> Ny CAPA
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        <StatCard label="Total" value={counts.total} color="text-slate-800 dark:text-slate-100" />
        <StatCard label="Åben" value={counts.open} color="text-blue-600" />
        <StatCard label="I gang" value={counts.active} color="text-amber-600" />
        <StatCard label="Afventer verifikation" value={counts.pending} color="text-orange-600" />
        <StatCard label="Forfaldne" value={counts.overdue} color={counts.overdue > 0 ? 'text-red-600' : 'text-slate-400'} />
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
              {['ID', 'Titel', 'Type', 'Afvigelse', 'Ansvarlig', 'Forfald', 'Fremdrift', 'Status'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const isOverdue = r.dueDate < today && !['Verificeret', 'Lukket'].includes(r.status)
              const doneCount = r.actionsDone.filter(Boolean).length
              const progress = r.actions.length ? Math.round((doneCount / r.actions.length) * 100) : 0
              return (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={clsx(
                    'border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 cursor-pointer transition-colors',
                    selected?.id === r.id && 'bg-blue-50/60 dark:bg-blue-900/10'
                  )}
                >
                  <td className="px-3 py-1.5 font-mono text-xs text-slate-500">{r.id}</td>
                  <td className="px-3 py-1.5 text-sm font-medium text-slate-800 dark:text-slate-200 max-w-[200px] truncate">{r.title}</td>
                  <td className="px-3 py-1.5">
                    <span className={clsx('text-[10px] px-2 py-0.5 rounded font-medium',
                      r.type === 'Korrigerende' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    )}>
                      {r.type}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 font-mono text-xs text-blue-600 dark:text-blue-400">{r.deviationId}</td>
                  <td className="px-3 py-1.5 text-xs text-slate-500 whitespace-nowrap">{r.assignee.split(' ')[0]}</td>
                  <td className="px-3 py-1.5 text-xs whitespace-nowrap">
                    <span className={clsx(isOverdue ? 'text-red-500 font-medium' : 'text-slate-400')}>
                      {isOverdue && <AlertTriangle size={10} className="inline mr-1" />}
                      {fmt(r.dueDate)}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{progress}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <span className={clsx('text-[10px] px-2 py-0.5 rounded font-medium whitespace-nowrap', STATUS_COLORS[r.status])}>{r.status}</span>
                  </td>
                </tr>
              )
            })}
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
    </div>
  )
}
