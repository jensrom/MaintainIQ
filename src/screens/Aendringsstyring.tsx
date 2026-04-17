import { useState, useMemo } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { da } from 'date-fns/locale'
import { Plus, X, ShieldCheck, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'
import PharmaSignoffModal from '../components/PharmaSignoffModal'

type ChangeType     = 'Udstyr' | 'Procedure' | 'Software' | 'Facility' | 'Personale' | 'Andet'
type ChangePriority = 'Kritisk' | 'Høj' | 'Normal' | 'Lav'
type ChangeStatus   = 'Udkast' | 'Under vurdering' | 'Godkendt' | 'Implementeret' | 'Verificeret' | 'Lukket' | 'Afvist'

interface ChangeRecord {
  id: string
  title: string
  type: ChangeType
  priority: ChangePriority
  status: ChangeStatus
  requestedBy: string
  requestedAt: string
  targetDate: string
  description: string
  reason: string
  impactAssessment: string
  affectedAssets: string[]
  affectedSOPs: string[]
  approvedBy?: string
  approvedAt?: string
  implementedAt?: string
  verifiedAt?: string
}

const today = new Date().toISOString().split('T')[0]

const INITIAL: ChangeRecord[] = [
  {
    id: 'CR-001',
    title: 'Opgradering af SCADA-software til v4.2',
    type: 'Software', priority: 'Høj', status: 'Under vurdering',
    requestedBy: 'Lars Petersen', requestedAt: '2025-03-10', targetDate: '2025-05-01',
    description: 'SCADA-systemet på produktionslinje 1 opgraderes fra v3.8 til v4.2 for at rette kendte sikkerhedssårbarheder og understøtte nye kalibreringsprotokoller.',
    reason: 'Leverandøren ophører support for v3.8 pr. 1. juli 2025. Ny version inkluderer kritiske sikkerhedsrettelser.',
    impactAssessment: 'Lav risiko for produktionsafbrydelse. Kræver 4-timers nedetid. Alle eksisterende konfigurationer overføres automatisk.',
    affectedAssets: ['KOM-001', 'KOM-002', 'FYL-001'],
    affectedSOPs: ['SOP-PRD-001', 'SOP-PRD-003'],
  },
  {
    id: 'CR-002',
    title: 'Revision af rengøringsprocedure SOP-CLN-004',
    type: 'Procedure', priority: 'Høj', status: 'Godkendt',
    requestedBy: 'Peter Madsen', requestedAt: '2025-03-18', targetDate: '2025-04-15',
    description: 'SOP-CLN-004 revideres som direkte følge af DEV-002. Trin 3 præciseres med obligatorisk dobbeltcheck og tidsangivelse for skylning.',
    reason: 'Afvigelse DEV-002 identificerede uklarhed i eksisterende procedure. Revision nødvendig for at forhindre gentagelse.',
    impactAssessment: 'Ingen produktionspåvirkning. Kræver genoptræning af 7 operatører inden implementering.',
    affectedAssets: ['AUT-001', 'AUT-002'],
    affectedSOPs: ['SOP-CLN-004'],
    approvedBy: 'Kirsten Sørensen',
    approvedAt: '2025-03-25',
  },
  {
    id: 'CR-003',
    title: 'Udskiftning af trykmålere med digitale enheder',
    type: 'Udstyr', priority: 'Normal', status: 'Implementeret',
    requestedBy: 'Anders Nielsen', requestedAt: '2025-02-05', targetDate: '2025-03-31',
    description: 'De analoge trykmålere i produktionshallen A udskiftes med kalibrerede digitale enheder med datalogging og alarm-integration.',
    reason: 'Analogt udstyr kan ikke integreres med det nye CMMS-kalibreringssystem. Digitale enheder giver bedre sporbarhed.',
    impactAssessment: 'Kræver 6 timers planlagt nedetid. Alle eksisterende kalibreringscertifikater overføres til nye enheder.',
    affectedAssets: ['TRY-001', 'TRY-002', 'TRY-003'],
    affectedSOPs: ['SOP-CAL-012', 'SOP-OPR-007'],
    approvedBy: 'Kirsten Sørensen',
    approvedAt: '2025-02-15',
    implementedAt: '2025-03-28',
  },
  {
    id: 'CR-004',
    title: 'Implementering af elektronisk batchrekord-system',
    type: 'Software', priority: 'Kritisk', status: 'Under vurdering',
    requestedBy: 'Kirsten Sørensen', requestedAt: '2025-03-20', targetDate: '2025-07-01',
    description: 'Papirbaserede batchrekorder erstattes af et elektronisk system med 21 CFR Part 11-kompatible elektroniske signaturer.',
    reason: 'Kommende FDA-inspektion Q4 2025. Elektroniske batchrekorder er et krav iht. FDA 21 CFR Part 11.',
    impactAssessment: 'Høj kompleksitet. Kræver validering (IQ/OQ/PQ), medarbejdertræning og parallelkørsel i 3 måneder.',
    affectedAssets: ['FYL-001', 'AUT-001', 'AUT-002'],
    affectedSOPs: ['SOP-QC-001', 'SOP-QC-002', 'SOP-PRD-001'],
  },
  {
    id: 'CR-005',
    title: 'HEPA-filterprogram — kvartalsvise eftersyn',
    type: 'Procedure', priority: 'Normal', status: 'Verificeret',
    requestedBy: 'Lars Petersen', requestedAt: '2025-02-12', targetDate: '2025-03-15',
    description: 'Indfør fast PM-procedure for kvartalsvise HEPA-filtereftersyn i alle renrum som CAPA-006 kræver.',
    reason: 'CAPA-006 fra DEV-005 (partikelkontaminering). Forebygger fremtidige kontamineringshændelser.',
    impactAssessment: 'Lav risiko. Kræver 2 timers planlagt nedetid per renrum per kvartal.',
    affectedAssets: ['HVC-001', 'HVC-002'],
    affectedSOPs: ['SOP-FAC-003'],
    approvedBy: 'Peter Madsen',
    approvedAt: '2025-02-20',
    implementedAt: '2025-03-10',
    verifiedAt: '2025-03-18',
  },
  {
    id: 'CR-006',
    title: 'Renovering af laminar flow-kabinet LAB-LFC-01',
    type: 'Facility', priority: 'Høj', status: 'Godkendt',
    requestedBy: 'Peter Madsen', requestedAt: '2025-03-25', targetDate: '2025-04-30',
    description: 'LAB-LFC-01 renoveres med ny motor og HEPA-filter. Kabinettets integritet testes og re-valideres iht. SOP-VAL-009.',
    reason: 'Kabinettet viser tegn på mekanisk slid. Støjniveauet er steget og lufthastighedsmåling er under specifikation.',
    impactAssessment: 'Lab D lukkes i 3 arbejdsdage. QC-analyser flyttes til eksternt laboratorium midlertidigt.',
    affectedAssets: ['LAB-LFC-01'],
    affectedSOPs: ['SOP-VAL-009', 'SOP-LAB-001'],
    approvedBy: 'Kirsten Sørensen',
    approvedAt: '2025-03-30',
  },
  {
    id: 'CR-007',
    title: 'Ændring af blandingstider for batch type B',
    type: 'Procedure', priority: 'Kritisk', status: 'Lukket',
    requestedBy: 'Mette Hansen', requestedAt: '2025-01-08', targetDate: '2025-02-01',
    description: 'Blandingstiden for batch type B øges fra 45 til 60 minutter baseret på procesoptimering.',
    reason: 'Intern validering viser forbedret homogenitet ved 60 minutters blanding. Data understøtter procesforbedringen.',
    impactAssessment: 'Kapacitetsreduktion på ca. 10% per batch. Kræver opdatering af batchrekorder og operatørguider.',
    affectedAssets: ['MIX-001'],
    affectedSOPs: ['SOP-PRD-005'],
    approvedBy: 'Peter Madsen',
    approvedAt: '2025-01-18',
    implementedAt: '2025-01-25',
    verifiedAt: '2025-02-03',
  },
  {
    id: 'CR-008',
    title: 'Ansættelse af ekstra kvalitetsteknikers adgang',
    type: 'Personale', priority: 'Lav', status: 'Udkast',
    requestedBy: 'Kirsten Sørensen', requestedAt: '2025-04-01', targetDate: '2025-05-01',
    description: 'Onboarding-procedure for ny kvalitetstekniker opdateres med CMMS-adgangsrettigheder og obligatoriske GMP-kurser.',
    reason: 'Ny medarbejder starter 1. maj. Adgangsniveauer skal defineres og godkendes iht. SOP-ADM-002.',
    impactAssessment: 'Ingen produktionspåvirkning.',
    affectedAssets: [],
    affectedSOPs: ['SOP-ADM-002'],
  },
]

const STATUS_COLORS: Record<ChangeStatus, string> = {
  'Udkast':           'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  'Under vurdering':  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Godkendt':         'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'Implementeret':    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Verificeret':      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Lukket':           'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Afvist':           'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}
const PRIORITY_COLORS: Record<ChangePriority, string> = {
  'Kritisk': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Høj':     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Normal':  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Lav':     'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
}
const STATUS_FLOW: ChangeStatus[] = ['Udkast', 'Under vurdering', 'Godkendt', 'Implementeret', 'Verificeret', 'Lukket']
const ALL_STATUSES: ChangeStatus[] = [...STATUS_FLOW, 'Afvist']

const STATUS_ICON: Record<ChangeStatus, React.ReactNode> = {
  'Udkast':          <Clock size={13} className="text-slate-400" />,
  'Under vurdering': <Clock size={13} className="text-amber-500" />,
  'Godkendt':        <CheckCircle2 size={13} className="text-teal-500" />,
  'Implementeret':   <CheckCircle2 size={13} className="text-blue-500" />,
  'Verificeret':     <CheckCircle2 size={13} className="text-indigo-500" />,
  'Lukket':          <CheckCircle2 size={13} className="text-green-500" />,
  'Afvist':          <XCircle size={13} className="text-red-500" />,
}

function fmt(s: string) {
  try { const d = parseISO(s); return isValid(d) ? format(d, 'd. MMM yyyy', { locale: da }) : s } catch { return s }
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className={clsx('text-2xl font-semibold', color)}>{value}</p>
    </div>
  )
}

// ── Progress stepper ────────────────────────────────────────────────────────
function StatusStepper({ status }: { status: ChangeStatus }) {
  const steps: ChangeStatus[] = ['Udkast', 'Under vurdering', 'Godkendt', 'Implementeret', 'Verificeret', 'Lukket']
  const currentIdx = status === 'Afvist' ? -1 : steps.indexOf(status)
  if (status === 'Afvist') return (
    <div className="flex items-center gap-2 text-xs text-red-500">
      <XCircle size={14} /> Afvist
    </div>
  )
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div className={clsx(
            'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors',
            i < currentIdx  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
            i === currentIdx ? 'bg-blue-600 text-white' :
            'bg-slate-100 text-slate-400 dark:bg-slate-800'
          )}>
            {i < currentIdx && <CheckCircle2 size={9} />}
            {s}
          </div>
          {i < steps.length - 1 && <div className={clsx('w-3 h-px', i < currentIdx ? 'bg-green-400' : 'bg-slate-200 dark:bg-slate-700')} />}
        </div>
      ))}
    </div>
  )
}

// ── Detail panel ────────────────────────────────────────────────────────────
function DetailPanel({ record, onClose, onUpdate, pharmaMode }: {
  record: ChangeRecord
  onClose: () => void
  onUpdate: (id: string, patch: Partial<ChangeRecord>) => void
  pharmaMode: boolean
}) {
  const { auth, users } = useStore()
  const activeUser = auth ? users.find(u => u.id === auth.userId) : null
  const [signoffAction, setSignoffAction] = useState<'approve' | 'implement' | 'verify' | 'reject' | null>(null)

  function advance(action: 'approve' | 'implement' | 'verify' | 'reject') {
    if (pharmaMode) { setSignoffAction(action); return }
    applyAction(action)
  }

  function applyAction(action: string) {
    const now = new Date().toISOString().split('T')[0]
    if (action === 'approve')    onUpdate(record.id, { status: 'Godkendt', approvedBy: activeUser?.name, approvedAt: now })
    if (action === 'implement')  onUpdate(record.id, { status: 'Implementeret', implementedAt: now })
    if (action === 'verify')     onUpdate(record.id, { status: 'Verificeret', verifiedAt: now })
    if (action === 'reject')     onUpdate(record.id, { status: 'Afvist' })
    if (action === 'close')      onUpdate(record.id, { status: 'Lukket' })
  }

  const isOverdue = record.targetDate < today && !['Verificeret', 'Lukket', 'Afvist'].includes(record.status)

  return (
    <>
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-40">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-slate-400">{record.id}</span>
              <span className={clsx('text-[10px] px-2 py-0.5 rounded font-medium', PRIORITY_COLORS[record.priority])}>{record.priority}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">{record.type}</span>
            </div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug max-w-xs">{record.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Stepper */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-2 font-semibold">Forløb</p>
            <StatusStepper status={record.status} />
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Anmodet af', record.requestedBy],
              ['Anmodningsdato', fmt(record.requestedAt)],
              ['Måldato', fmt(record.targetDate)],
              ...(record.approvedBy ? [['Godkendt af', record.approvedBy], ['Godkendelsesdato', fmt(record.approvedAt!)]] : []),
              ...(record.implementedAt ? [['Implementeret', fmt(record.implementedAt)]] : []),
              ...(record.verifiedAt ? [['Verificeret', fmt(record.verifiedAt)]] : []),
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-[11px] text-slate-400 mb-0.5">{label}</p>
                <p className={clsx('text-sm font-medium', label === 'Måldato' && isOverdue ? 'text-red-500' : 'text-slate-800 dark:text-slate-200')}>
                  {label === 'Måldato' && isOverdue && <AlertTriangle size={11} className="inline mr-1" />}
                  {val}
                </p>
              </div>
            ))}
          </div>

          {/* Sections */}
          {[
            ['Beskrivelse', record.description],
            ['Årsag / Begrundelse', record.reason],
            ['Konsekvensanalyse', record.impactAssessment],
          ].map(([label, val]) => (
            <div key={label}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">{label}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{val}</p>
            </div>
          ))}

          {/* Affected assets + SOPs */}
          {(record.affectedAssets.length > 0 || record.affectedSOPs.length > 0) && (
            <div className="grid grid-cols-2 gap-3">
              {record.affectedAssets.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Berørte aktiver</p>
                  <div className="flex flex-wrap gap-1">
                    {record.affectedAssets.map(a => (
                      <span key={a} className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {record.affectedSOPs.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Berørte SOPs</p>
                  <div className="flex flex-wrap gap-1">
                    {record.affectedSOPs.map(s => (
                      <span key={s} className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action footer */}
        {!['Lukket', 'Afvist'].includes(record.status) && (
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-2">
            {record.status === 'Under vurdering' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => advance('reject')}
                  className="py-2 border border-red-300 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Afvis
                </button>
                <button
                  onClick={() => advance('approve')}
                  className="flex items-center justify-center gap-1.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {pharmaMode && <ShieldCheck size={13} />} Godkend
                </button>
              </div>
            )}
            {record.status === 'Udkast' && (
              <button
                onClick={() => onUpdate(record.id, { status: 'Under vurdering' })}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Send til vurdering
              </button>
            )}
            {record.status === 'Godkendt' && (
              <button
                onClick={() => advance('implement')}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {pharmaMode && <ShieldCheck size={13} />} Markér implementeret{pharmaMode ? ' (GMP-signatur)' : ''}
              </button>
            )}
            {record.status === 'Implementeret' && (
              <button
                onClick={() => advance('verify')}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {pharmaMode && <ShieldCheck size={13} />} Verificér implementering{pharmaMode ? ' (GMP-signatur)' : ''}
              </button>
            )}
            {record.status === 'Verificeret' && (
              <button
                onClick={() => applyAction('close')}
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Luk ændring
              </button>
            )}
          </div>
        )}
      </div>

      {signoffAction && (
        <PharmaSignoffModal
          actionLabel={
            signoffAction === 'approve' ? 'Godkend ændringsanmodning' :
            signoffAction === 'implement' ? 'Markér som implementeret' :
            signoffAction === 'verify' ? 'Verificér implementering' :
            'Afvis ændringsanmodning'
          }
          entityName={`${record.id}: ${record.title}`}
          onConfirm={() => { applyAction(signoffAction!); setSignoffAction(null) }}
          onCancel={() => setSignoffAction(null)}
        />
      )}
    </>
  )
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function Aendringsstyring() {
  const pharmaMode = useStore(s => s.settings.pharmaMode)
  const [records, setRecords] = useState<ChangeRecord[]>(INITIAL)
  const [filterStatus, setFilterStatus] = useState<ChangeStatus | null>(null)
  const [selected, setSelected] = useState<ChangeRecord | null>(null)

  function update(id: string, patch: Partial<ChangeRecord>) {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, ...patch } : null)
  }

  const filtered = useMemo(() =>
    records.filter(r => !filterStatus || r.status === filterStatus),
    [records, filterStatus]
  )

  const counts = useMemo(() => ({
    total:    records.length,
    open:     records.filter(r => !['Lukket', 'Afvist'].includes(r.status)).length,
    pending:  records.filter(r => r.status === 'Under vurdering').length,
    approved: records.filter(r => r.status === 'Godkendt').length,
    overdue:  records.filter(r => r.targetDate < today && !['Verificeret', 'Lukket', 'Afvist'].includes(r.status)).length,
  }), [records])

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Ændringsstyring</h1>
            {pharmaMode && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded font-medium">
                <ShieldCheck size={10} /> 21 CFR Part 11
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-0.5">Change Control — {records.length} ændringsanmodninger</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus size={14} /> Ny ændringsanmodning
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        <StatCard label="Total" value={counts.total} color="text-slate-800 dark:text-slate-100" />
        <StatCard label="Åbne" value={counts.open} color="text-blue-600" />
        <StatCard label="Under vurdering" value={counts.pending} color="text-amber-600" />
        <StatCard label="Godkendt" value={counts.approved} color="text-teal-600" />
        <StatCard label="Forsinkede" value={counts.overdue} color={counts.overdue > 0 ? 'text-red-600' : 'text-slate-400'} />
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
              {['ID', 'Titel', 'Type', 'Prioritet', 'Ansvarlig', 'Måldato', 'Status'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const isOverdue = r.targetDate < today && !['Verificeret', 'Lukket', 'Afvist'].includes(r.status)
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
                  <td className="px-3 py-1.5">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px] block">{r.title}</span>
                  </td>
                  <td className="px-3 py-1.5 text-xs text-slate-500 whitespace-nowrap">{r.type}</td>
                  <td className="px-3 py-1.5">
                    <span className={clsx('text-[10px] px-2 py-0.5 rounded font-medium', PRIORITY_COLORS[r.priority])}>{r.priority}</span>
                  </td>
                  <td className="px-3 py-1.5 text-xs text-slate-500 whitespace-nowrap">{r.requestedBy.split(' ')[0]}</td>
                  <td className="px-3 py-1.5 text-xs whitespace-nowrap">
                    <span className={clsx(isOverdue ? 'text-red-500 font-medium' : 'text-slate-400')}>
                      {isOverdue && <AlertTriangle size={10} className="inline mr-1" />}
                      {fmt(r.targetDate)}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-1.5">
                      {STATUS_ICON[r.status]}
                      <span className={clsx('text-[10px] px-2 py-0.5 rounded font-medium whitespace-nowrap', STATUS_COLORS[r.status])}>{r.status}</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

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
