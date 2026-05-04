import { useState, useMemo } from 'react'
import { format, parseISO, isValid, addMonths } from 'date-fns'
import { da } from 'date-fns/locale'
import { Plus, FlaskConical, ChevronRight, X, ShieldCheck, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'
import PharmaSignoffModal from '../components/PharmaSignoffModal'

// ---- Types ----

interface CalibrationRecord {
  id: string
  assetId: string
  assetName: string
  assetCode: string
  instrumentType: string
  serialNumber: string
  lastCalibrated: string   // ISO date
  nextDue: string          // ISO date
  status: 'Kalibreret' | 'Forfaldent' | 'Kommende' | 'Ude af drift'
  certificate: string
  range: string
  calibratedBy: string
  location: string
}

type CalStatus = CalibrationRecord['status']

// ---- Mock data ----

const MOCK_CALIBRATIONS: CalibrationRecord[] = [
  {
    id: 'cal-1', assetId: 'a6', assetName: 'Trykmåler TRY-001', assetCode: 'TRY-001',
    instrumentType: 'Trykmåler', serialNumber: 'SN-TM-2019-001',
    lastCalibrated: '2025-10-15', nextDue: '2026-04-15',
    status: 'Forfaldent', certificate: 'CAL-2025-047',
    range: '0–16 bar ±0.5%', calibratedBy: 'Søren Nielsen', location: 'Produktionshallen A',
  },
  {
    id: 'cal-2', assetId: 'a8', assetName: 'Autoklav AUT-001', assetCode: 'AUT-001',
    instrumentType: 'Trykkar', serialNumber: 'SN-AUT-2018-001',
    lastCalibrated: '2026-01-20', nextDue: '2026-07-20',
    status: 'Kalibreret', certificate: 'CAL-2026-003',
    range: '0–6 bar ±0.2%', calibratedBy: 'Søren Nielsen', location: 'Produktionshallen A',
  },
  {
    id: 'cal-3', assetId: 'a9', assetName: 'Autoklav AUT-002', assetCode: 'AUT-002',
    instrumentType: 'Trykkar', serialNumber: 'SN-AUT-2019-002',
    lastCalibrated: '2026-02-10', nextDue: '2026-08-10',
    status: 'Kalibreret', certificate: 'CAL-2026-011',
    range: '0–6 bar ±0.2%', calibratedBy: 'Søren Nielsen', location: 'Produktionshallen A',
  },
  {
    id: 'cal-4', assetId: 'a12', assetName: 'Termometer TMP-001', assetCode: 'TMP-001',
    instrumentType: 'Termometer', serialNumber: 'SN-TMP-2020-001',
    lastCalibrated: '2025-07-01', nextDue: '2026-01-01',
    status: 'Forfaldent', certificate: 'CAL-2025-023',
    range: '-20–150°C ±0.5°C', calibratedBy: 'Helle Jensen', location: 'Laboratorium D',
  },
  {
    id: 'cal-5', assetId: 'a15', assetName: 'Analysebalance BAL-001', assetCode: 'BAL-001',
    instrumentType: 'Vægt', serialNumber: 'SN-BAL-2021-001',
    lastCalibrated: '2026-03-01', nextDue: '2026-09-01',
    status: 'Kalibreret', certificate: 'CAL-2026-019',
    range: '0–200g ±0.0001g', calibratedBy: 'Helle Jensen', location: 'Laboratorium D',
  },
  {
    id: 'cal-6', assetId: 'a10', assetName: 'Flowmåler FLW-001', assetCode: 'FLW-001',
    instrumentType: 'Flowmåler', serialNumber: 'SN-FLW-2019-003',
    lastCalibrated: '2026-01-05', nextDue: '2026-07-05',
    status: 'Kommende', certificate: 'CAL-2026-001',
    range: '0–100 L/min ±1%', calibratedBy: 'Søren Nielsen', location: 'Forsyning C',
  },
  {
    id: 'cal-7', assetId: 'a14', assetName: 'pH-måler PHM-001', assetCode: 'PHM-001',
    instrumentType: 'pH-måler', serialNumber: 'SN-PHM-2022-001',
    lastCalibrated: '2026-02-28', nextDue: '2026-05-28',
    status: 'Kommende', certificate: 'CAL-2026-017',
    range: '0–14 pH ±0.01', calibratedBy: 'Helle Jensen', location: 'Laboratorium D',
  },
  {
    id: 'cal-8', assetId: 'a16', assetName: 'Tachometer TAC-001', assetCode: 'TAC-001',
    instrumentType: 'Tachometer', serialNumber: 'SN-TAC-2020-002',
    lastCalibrated: '2025-06-10', nextDue: '2025-12-10',
    status: 'Ude af drift', certificate: 'CAL-2025-018',
    range: '0–10000 rpm ±0.1%', calibratedBy: '—', location: 'Produktionshallen A',
  },
]

// ---- Status helpers ----

const STATUS_COLORS: Record<CalStatus, string> = {
  'Kalibreret':   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Forfaldent':   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Kommende':     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Ude af drift': 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
}

const ALL_STATUSES: CalStatus[] = ['Forfaldent', 'Kommende', 'Kalibreret', 'Ude af drift']

function fmt(dateStr: string) {
  try {
    const d = parseISO(dateStr)
    return isValid(d) ? format(d, 'd. MMM yyyy', { locale: da }) : dateStr
  } catch {
    return dateStr
  }
}

function StatusBadge({ status }: { status: CalStatus }) {
  return (
    <span className={clsx('inline-block px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap', STATUS_COLORS[status])}>
      {status}
    </span>
  )
}

// ---- Detail Panel ----

interface DetailPanelProps {
  record: CalibrationRecord
  onClose: () => void
  onRegister: () => void
  pharmaMode: boolean
}

function DetailPanel({ record, onClose, onRegister, pharmaMode }: DetailPanelProps) {
  const today = new Date().toISOString().split('T')[0]
  const isOverdue = record.nextDue < today && record.status !== 'Ude af drift'

  return (
    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm max-h-[90vh] bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex flex-col z-40 overflow-hidden">
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={record.status} />
          </div>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight">
            {record.assetName}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{record.location}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Key info grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-slate-400 mb-0.5">Instrumenttype</p>
            <p className="font-medium text-slate-800 dark:text-slate-200">{record.instrumentType}</p>
          </div>
          <div>
            <p className="text-slate-400 mb-0.5">Aktiv-kode</p>
            <p className="font-medium text-slate-800 dark:text-slate-200">{record.assetCode}</p>
          </div>
          <div>
            <p className="text-slate-400 mb-0.5">Serienummer</p>
            <p className="font-medium text-slate-800 dark:text-slate-200">{record.serialNumber}</p>
          </div>
          <div>
            <p className="text-slate-400 mb-0.5">Certifikat</p>
            <p className="font-medium text-slate-800 dark:text-slate-200">{record.certificate}</p>
          </div>
          <div>
            <p className="text-slate-400 mb-0.5">Sidst kalibreret</p>
            <p className="font-medium text-slate-800 dark:text-slate-200">{fmt(record.lastCalibrated)}</p>
          </div>
          <div>
            <p className="text-slate-400 mb-0.5">Næste forfald</p>
            <p className={clsx('font-medium', isOverdue ? 'text-red-500' : 'text-slate-800 dark:text-slate-200')}>
              {isOverdue && <AlertTriangle size={11} className="inline mr-1" />}
              {fmt(record.nextDue)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 mb-0.5">Kalibreret af</p>
            <p className="font-medium text-slate-800 dark:text-slate-200">{record.calibratedBy}</p>
          </div>
          <div>
            <p className="text-slate-400 mb-0.5">Placering</p>
            <p className="font-medium text-slate-800 dark:text-slate-200">{record.location}</p>
          </div>
        </div>

        {/* Measurement range */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
          <p className="text-[11px] text-slate-400 mb-1 font-medium uppercase tracking-wide">Måleområde</p>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{record.range}</p>
        </div>

        {/* 21 CFR Part 11 note */}
        {pharmaMode && (
          <div className="flex items-start gap-2 text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2.5 border border-blue-100 dark:border-blue-800">
            <ShieldCheck size={13} className="shrink-0 mt-0.5" />
            <span>Registrering kræver elektronisk underskrift (21 CFR Part 11)</span>
          </div>
        )}
      </div>

      {/* Footer action */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={onRegister}
          disabled={record.status === 'Ude af drift'}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {pharmaMode && <ShieldCheck size={14} />}
          Registrér ny kalibrering
        </button>
      </div>
    </div>
  )
}

// ---- Stat card ----

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 min-w-[100px]">
      <p className={clsx('text-xl font-bold', color)}>{value}</p>
      <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">{label}</p>
    </div>
  )
}

// ---- Main screen ----

export default function Kalibrering() {
  const pharmaMode = useStore(s => s.settings.pharmaMode)

  const [records, setRecords] = useState<CalibrationRecord[]>(MOCK_CALIBRATIONS)
  const [filterStatus, setFilterStatus] = useState<CalStatus | 'Alle'>('Alle')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [signoffId, setSignoffId] = useState<string | null>(null)

  const selectedRecord = selectedId ? records.find(r => r.id === selectedId) ?? null : null
  const signoffRecord  = signoffId  ? records.find(r => r.id === signoffId)  ?? null : null

  const counts = useMemo(() => {
    const c: Record<string, number> = { Alle: records.length }
    ALL_STATUSES.forEach(s => { c[s] = records.filter(r => r.status === s).length })
    return c
  }, [records])

  const filtered = useMemo(() =>
    filterStatus === 'Alle' ? records : records.filter(r => r.status === filterStatus),
    [records, filterStatus]
  )

  function handleRegisterClick(record: CalibrationRecord) {
    if (pharmaMode) {
      setSignoffId(record.id)
    } else {
      applyCalibration(record.id)
    }
  }

  function applyCalibration(id: string) {
    const today = new Date().toISOString().split('T')[0]
    const nextDue = addMonths(new Date(), 6).toISOString().split('T')[0]
    setRecords(prev => prev.map(r =>
      r.id === id
        ? { ...r, status: 'Kalibreret', lastCalibrated: today, nextDue }
        : r
    ))
    setSignoffId(null)
    // Keep detail panel open on the updated record
  }

  function handleSignoffConfirm(_comment: string) {
    if (signoffId) applyCalibration(signoffId)
  }

  return (
    <div className="p-5 min-h-full bg-slate-50 dark:bg-slate-950">
      {/* ---- Page header ---- */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical size={18} className="text-blue-600" />
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Kalibrering</h1>
            {pharmaMode && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                <ShieldCheck size={10} />
                21 CFR Part 11
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">GMP kalibreringsregister · Instrumentstyring</p>
        </div>

        {/* Stat cards */}
        <div className="flex flex-wrap gap-2">
          <StatCard label="Total" value={counts['Alle']} color="text-slate-700 dark:text-slate-200" />
          <StatCard label="Forfaldent" value={counts['Forfaldent']} color="text-red-600 dark:text-red-400" />
          <StatCard label="Kommende" value={counts['Kommende']} color="text-amber-600 dark:text-amber-400" />
          <StatCard label="Kalibreret" value={counts['Kalibreret']} color="text-green-600 dark:text-green-400" />
          <StatCard label="Ude af drift" value={counts['Ude af drift']} color="text-slate-400" />
        </div>

        <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
          <Plus size={15} />
          Ny kalibrering
        </button>
      </div>

      {/* ---- Filter bar ---- */}
      <div className="flex flex-wrap items-center gap-1 mb-4">
        {(['Alle', ...ALL_STATUSES] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              filterStatus === s
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            )}
          >
            {s}
            {s !== 'Alle' && counts[s] > 0 && (
              <span className={clsx(
                'ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]',
                filterStatus === s ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              )}>
                {counts[s]}
              </span>
            )}
            {s === 'Alle' && (
              <span className={clsx(
                'ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]',
                filterStatus === s ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              )}>
                {counts['Alle']}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ---- Table ---- */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Instrument</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Type</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Serienummer</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Kalibreret</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Forfald</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Certifikat</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Måleområde</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Status</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-sm text-slate-400">
                    Ingen kalibreringsoptegnelser matcher det valgte filter.
                  </td>
                </tr>
              )}
              {filtered.map((record, idx) => {
                const today = new Date().toISOString().split('T')[0]
                const isOverdue = record.nextDue < today && record.status !== 'Ude af drift'
                const isSelected = selectedId === record.id

                return (
                  <tr
                    key={record.id}
                    onClick={() => setSelectedId(isSelected ? null : record.id)}
                    className={clsx(
                      'border-b border-slate-100 dark:border-slate-800 cursor-pointer transition-colors',
                      idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/20',
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/10'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    )}
                  >
                    {/* Instrument */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <ChevronRight
                          size={13}
                          className={clsx(
                            'text-slate-300 dark:text-slate-600 transition-transform shrink-0',
                            isSelected && 'rotate-90 text-blue-500'
                          )}
                        />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200 text-xs whitespace-nowrap">
                            {record.assetName}
                          </p>
                          <p className="text-[11px] text-slate-400">{record.location}</p>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {record.instrumentType}
                    </td>

                    {/* Serial */}
                    <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                      {record.serialNumber}
                    </td>

                    {/* Last calibrated */}
                    <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {fmt(record.lastCalibrated)}
                    </td>

                    {/* Next due */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={clsx('text-xs', isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-600 dark:text-slate-300')}>
                        {isOverdue && <AlertTriangle size={11} className="inline mr-1 mb-0.5" />}
                        {fmt(record.nextDue)}
                      </span>
                    </td>

                    {/* Certificate */}
                    <td className="px-3 py-2 text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {record.certificate}
                    </td>

                    {/* Range */}
                    <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {record.range}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <StatusBadge status={record.status} />
                    </td>

                    {/* Register button */}
                    <td className="px-3 py-2 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleRegisterClick(record)}
                        disabled={record.status === 'Ude af drift'}
                        className={clsx(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors',
                          record.status === 'Ude af drift'
                            ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800'
                            : pharmaMode
                              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                        )}
                      >
                        {pharmaMode && <ShieldCheck size={11} />}
                        Registrér
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
          <p className="text-[11px] text-slate-400">
            Viser {filtered.length} af {records.length} instrumenter
          </p>
        </div>
      </div>

      {/* ---- Detail side panel ---- */}
      {selectedRecord && (
        <DetailPanel
          record={selectedRecord}
          onClose={() => setSelectedId(null)}
          onRegister={() => handleRegisterClick(selectedRecord)}
          pharmaMode={pharmaMode}
        />
      )}

      {/* ---- Pharma signoff modal ---- */}
      {signoffRecord && (
        <PharmaSignoffModal
          actionLabel="Registrér ny kalibrering"
          entityName={`${signoffRecord.assetName} · ${signoffRecord.serialNumber}`}
          onConfirm={handleSignoffConfirm}
          onCancel={() => setSignoffId(null)}
        />
      )}
    </div>
  )
}
