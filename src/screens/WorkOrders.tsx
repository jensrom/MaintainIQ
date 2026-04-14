import { useState, useMemo } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { da } from 'date-fns/locale'
import {
  Plus, Search, X, Settings2, AlertTriangle, ChevronUp, ChevronDown,
  Check, Clock, MessageSquare, CheckSquare, Wrench, ShieldCheck, Printer,
} from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'
import type { WorkOrderStatus, Priority, WorkOrderCategory, WorkOrder, User, SparePart, CompanySettings } from '../types'
import PharmaSignoffModal from '../components/PharmaSignoffModal'

const ALL_STATUSES: WorkOrderStatus[] = [
  'Arbejdsanmodning', 'Åben', 'I gang', 'Planlagt', 'Afventer', 'Afsluttet', 'Annulleret',
]
const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  'Arbejdsanmodning': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'Åben': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'I gang': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'Planlagt': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  'Afventer': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'Afsluttet': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  'Annulleret': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}
const PRIORITY_COLORS: Record<Priority, string> = {
  'Kritisk': 'text-red-600 dark:text-red-400',
  'Høj': 'text-orange-500 dark:text-orange-400',
  'Normal': 'text-blue-600 dark:text-blue-400',
  'Lav': 'text-gray-400 dark:text-gray-500',
}

const DEFAULT_COLUMNS = ['id', 'status', 'title', 'asset', 'priority', 'assignee', 'createdAt', 'dueDate']
const COLUMN_LABELS: Record<string, string> = {
  id: 'AO-nummer', status: 'Status', title: 'Titel', asset: 'Aktiv',
  priority: 'Prioritet', assignee: 'Tildelt', createdAt: 'Oprettet', dueDate: 'Forfald',
}

function fmt(dateStr: string) {
  try { const d = parseISO(dateStr); return isValid(d) ? format(d, 'd. MMM yy', { locale: da }) : dateStr }
  catch { return dateStr }
}

function StatusBadge({ status }: { status: WorkOrderStatus }) {
  return <span className={clsx('inline-block px-2 py-0.5 rounded text-[11px] font-medium', STATUS_COLORS[status])}>{status}</span>
}

// ---- WO Print ----
function buildWOPrintHtml(
  wo: WorkOrder,
  opts: { asset?: { name: string }; assignee?: { name: string }; users: User[]; spareParts: SparePart[]; cs: CompanySettings }
): string {
  const { asset, assignee, users, spareParts, cs } = opts
  const now = new Date().toLocaleDateString('da-DK', { day: '2-digit', month: 'long', year: 'numeric' })
  const logoHtml = cs.logoOnPrint && cs.logo
    ? `<img src="${cs.logo}" alt="${cs.name}" style="height:36px;object-fit:contain;" />`
    : `<span style="font-size:18px;font-weight:700;color:#1e3a5f;">${cs.name}</span>`
  const tasksHtml = wo.tasks.length
    ? wo.tasks.map(t => `<tr><td style="padding:4px 8px;border-bottom:1px solid #f0f0f0;">
        <span style="display:inline-block;width:13px;height:13px;border:1.5px solid ${t.done ? '#2563eb' : '#cbd5e1'};border-radius:3px;background:${t.done ? '#2563eb' : '#fff'};vertical-align:middle;margin-right:7px;"></span>
        <span style="${t.done ? 'text-decoration:line-through;color:#94a3b8;' : ''}">${t.text}</span>
      </td></tr>`).join('')
    : '<tr><td style="padding:8px;color:#94a3b8;font-style:italic;">Ingen opgaver</td></tr>'
  const timeTotal = wo.timeLog.reduce((s, t) => s + t.hours, 0)
  const timeHtml = wo.timeLog.length
    ? wo.timeLog.map(t => {
        const u = users.find(x => x.id === t.userId)
        return `<tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:4px 8px;">${u?.name ?? t.userId}</td>
          <td style="padding:4px 8px;">${t.hours} t</td>
          <td style="padding:4px 8px;color:#64748b;">${t.note}</td>
          <td style="padding:4px 8px;color:#94a3b8;">${t.date}</td>
        </tr>`
      }).join('')
    : '<tr><td colspan="4" style="padding:8px;color:#94a3b8;font-style:italic;">Ingen timer</td></tr>'
  const partsHtml = wo.spareParts.length
    ? wo.spareParts.map(sp => {
        const p = spareParts.find(r => r.id === sp.sparePartId)
        return `<tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:4px 8px;">${p?.name ?? sp.sparePartId}</td>
          <td style="padding:4px 8px;color:#64748b;font-family:monospace;">${p?.partNumber ?? '—'}</td>
          <td style="padding:4px 8px;">${sp.quantity} stk</td>
          <td style="padding:4px 8px;color:#64748b;">${(sp.quantity * (p?.price ?? 0)).toLocaleString('da-DK')} kr.</td>
        </tr>`
      }).join('')
    : '<tr><td colspan="4" style="padding:8px;color:#94a3b8;font-style:italic;">Ingen reservedele</td></tr>'
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>AO ${wo.id}</title>
<style>*{box-sizing:border-box;font-family:Arial,sans-serif;font-size:12px;}
@page{size:A4;margin:15mm;}body{color:#111;}
h2{font-size:16px;margin:0 0 2px;}
h3{font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;margin:16px 0 6px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;}
table{width:100%;border-collapse:collapse;}
th{padding:5px 8px;text-align:left;background:#f8fafc;font-size:10px;color:#64748b;border-bottom:1px solid #e2e8f0;}
.badge{display:inline-block;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:600;}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;}
.field label{display:block;font-size:10px;color:#94a3b8;margin-bottom:2px;}.field p{margin:0;font-weight:600;}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style></head>
<body>
<div style="display:flex;align-items:flex-start;justify-content:space-between;border-bottom:2px solid #1e3a5f;padding-bottom:10px;margin-bottom:14px;">
  <div>${logoHtml}</div>
  <div style="text-align:right;">
    <p style="margin:0;font-size:10px;color:#94a3b8;">Arbejdsordre</p>
    <p style="margin:2px 0;font-size:22px;font-weight:700;font-family:monospace;color:#1e3a5f;">${wo.id}</p>
    ${wo.isPharma ? '<span class="badge" style="background:#dbeafe;color:#1d4ed8;">🧪 GMP / Pharma</span>' : ''}
  </div>
</div>
<h2>${wo.title}</h2>
<div style="display:flex;gap:6px;align-items:center;margin:6px 0 14px;">
  <span class="badge" style="background:#f1f5f9;color:#334155;">${wo.status}</span>
  <span class="badge" style="background:#f1f5f9;color:#334155;">${wo.priority}</span>
  <span class="badge" style="background:#f1f5f9;color:#334155;">${wo.category}</span>
</div>
<div class="grid">
  <div class="field"><label>Aktiv</label><p>${asset?.name ?? '—'}</p></div>
  <div class="field"><label>Ansvarlig</label><p>${assignee?.name ?? 'Ikke tildelt'}</p></div>
  <div class="field"><label>Oprettet</label><p>${wo.createdAt}</p></div>
  <div class="field"><label>Forfaldsdato</label><p>${wo.dueDate}</p></div>
</div>
${wo.description ? `<h3>Beskrivelse</h3><p style="color:#475569;margin:0 0 4px;line-height:1.5;">${wo.description}</p>` : ''}
<h3>Opgaver</h3><table><tbody>${tasksHtml}</tbody></table>
<h3>Timer — total ${timeTotal.toFixed(1)} t</h3>
<table><thead><tr><th>Medarbejder</th><th>Timer</th><th>Note</th><th>Dato</th></tr></thead><tbody>${timeHtml}</tbody></table>
<h3>Reservedele</h3>
<table><thead><tr><th>Navn</th><th>Varenr.</th><th>Antal</th><th>Pris</th></tr></thead><tbody>${partsHtml}</tbody></table>
<div style="position:fixed;bottom:0;left:0;right:0;border-top:1px solid #e2e8f0;padding:5px 15mm;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;background:white;">
  <span>Udskrevet: ${now}</span><span>MaintainIQ — ${cs.name}</span>
</div>
</body></html>`
}

function openWOPrint(
  wo: WorkOrder,
  opts: { asset?: { name: string }; assignee?: { name: string }; users: User[]; spareParts: SparePart[]; cs: CompanySettings }
) {
  const html = buildWOPrintHtml(wo, opts)
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.onload = () => { win.focus(); win.print() }
}

// ---- Detail Panel Tabs ----
function WOPanel({ wo, onClose }: { wo: WorkOrder; onClose: () => void }) {
  const [tab, setTab] = useState<'detaljer' | 'opgaver' | 'timer' | 'dele'>('detaljer')
  const { users, assets, spareParts, updateWorkOrder, addComment, logTime, toggleTask, addSparePart } = useStore()
  const pharmaMode = useStore(s => s.settings.pharmaMode)
  const cs = useStore(s => s.companySettings)
  const [showPharmaSignoff, setShowPharmaSignoff] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  const [comment, setComment] = useState('')
  const [hours, setHours] = useState('')
  const [timeNote, setTimeNote] = useState('')
  const [timeDate, setTimeDate] = useState(today)
  const [partId, setPartId] = useState('')
  const [partQty, setPartQty] = useState('1')

  const user = (id: string | null) => users.find(u => u.id === id)
  const asset = assets.find(a => a.id === wo.assetId)

  const totalHours = wo.timeLog.reduce((s, t) => s + t.hours, 0)
  const totalCost = wo.timeLog.reduce((s, t) => {
    const u = user(t.userId)
    return s + t.hours * (u?.hourlyRate ?? 0)
  }, 0)
  const partsCost = wo.spareParts.reduce((s, sp) => {
    const p = spareParts.find(r => r.id === sp.sparePartId)
    return s + sp.quantity * (p?.price ?? 0)
  }, 0)

  const doneTasks = wo.tasks.filter(t => t.done).length
  const progress = wo.tasks.length ? Math.round((doneTasks / wo.tasks.length) * 100) : 0

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col z-40">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-gray-400">{wo.id}</span>
            {wo.isPharma && <span title="GMP/Pharma">🧪</span>}
            <StatusBadge status={wo.status} />
          </div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mt-1">{wo.title}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => openWOPrint(wo, { asset, assignee: user(wo.assigneeId) ?? undefined, users, spareParts, cs })}
            title="Print arbejdsordre"
            className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <Printer size={15} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {[
          { id: 'detaljer', label: 'Detaljer', icon: <MessageSquare size={13} /> },
          { id: 'opgaver', label: 'Opgaver', icon: <CheckSquare size={13} /> },
          { id: 'timer', label: 'Timer', icon: <Clock size={13} /> },
          { id: 'dele', label: 'Reservedele', icon: <Wrench size={13} /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors',
              tab === t.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* DETALJER TAB */}
        {tab === 'detaljer' && (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Aktiv">{asset?.name ?? '—'}</Field>
              <Field label="Prioritet">
                <span className={PRIORITY_COLORS[wo.priority]}>{wo.priority}</span>
              </Field>
              <Field label="Kategori">{wo.category}</Field>
              <Field label="Tildelt">{user(wo.assigneeId)?.name ?? 'Ikke tildelt'}</Field>
              <Field label="Oprettet">{fmt(wo.createdAt)}</Field>
              <Field label="Forfaldsdato">
                <span className={wo.dueDate < today && !['Afsluttet', 'Annulleret'].includes(wo.status) ? 'text-red-500 font-medium' : ''}>
                  {fmt(wo.dueDate)}
                </span>
              </Field>
            </div>

            {/* Edit status */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
              <select
                value={wo.status}
                onChange={e => updateWorkOrder(wo.id, { status: e.target.value as WorkOrderStatus })}
                className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
              >
                {ALL_STATUSES.filter(s => s !== 'Arbejdsanmodning').map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Pharma GMP signoff button */}
            {wo.isPharma && pharmaMode && wo.status !== 'Afsluttet' && wo.status !== 'Annulleret' && (
              <button
                onClick={() => setShowPharmaSignoff(true)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <ShieldCheck size={14} /> Afslut med GMP-signatur (21 CFR Part 11)
              </button>
            )}

            {showPharmaSignoff && (
              <PharmaSignoffModal
                actionLabel="Afslut arbejdsordre"
                entityName={`${wo.id}: ${wo.title}`}
                onConfirm={(comment) => {
                  updateWorkOrder(wo.id, { status: 'Afsluttet' })
                  addComment(wo.id, `[GMP-signatur] ${comment}`)
                  setShowPharmaSignoff(false)
                }}
                onCancel={() => setShowPharmaSignoff(false)}
              />
            )}

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Beskrivelse</label>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{wo.description || '—'}</p>
            </div>

            {/* Comments */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Kommentarer</h4>
              <div className="space-y-2 mb-3">
                {wo.comments.length === 0 && <p className="text-xs text-gray-400">Ingen kommentarer</p>}
                {wo.comments.map(c => {
                  const u = user(c.userId)
                  return (
                    <div key={c.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{u?.name ?? c.userId}</span>
                        <span className="text-xs text-gray-400">{fmt(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{c.text}</p>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <input
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Skriv en kommentar..."
                  className="flex-1 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5"
                  onKeyDown={e => { if (e.key === 'Enter' && comment.trim()) { addComment(wo.id, comment.trim()); setComment('') } }}
                />
                <button
                  onClick={() => { if (comment.trim()) { addComment(wo.id, comment.trim()); setComment('') } }}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>

            {/* History */}
            {wo.history.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Historik</h4>
                <div className="space-y-1">
                  {wo.history.map(h => (
                    <div key={h.id} className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <span>{fmt(h.date)}</span>
                      <span>·</span>
                      <span>{user(h.userId)?.name ?? h.userId}</span>
                      <span>ændrede</span>
                      <span className="font-medium">{h.field}</span>
                      <span>fra <em>{h.oldValue}</em> til <em>{h.newValue}</em></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* OPGAVER TAB */}
        {tab === 'opgaver' && (
          <>
            {wo.tasks.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{doneTasks} / {wo.tasks.length} udført</span>
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
            <div className="space-y-2">
              {wo.tasks.length === 0 && <p className="text-sm text-gray-400">Ingen opgaver tilknyttet</p>}
              {wo.tasks.map(t => (
                <label key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <div
                    onClick={() => toggleTask(wo.id, t.id)}
                    className={clsx(
                      'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                      t.done ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600'
                    )}
                  >
                    {t.done && <Check size={11} className="text-white" />}
                  </div>
                  <span className={clsx('text-sm', t.done && 'line-through text-gray-400')}>{t.text}</span>
                </label>
              ))}
            </div>
          </>
        )}

        {/* TIMER TAB */}
        {tab === 'timer' && (
          <>
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Total timer</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{totalHours.toFixed(1)} t</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Lønomkostning</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{totalCost.toLocaleString('da-DK')} kr.</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {wo.timeLog.length === 0 && <p className="text-sm text-gray-400">Ingen registrerede timer</p>}
              {wo.timeLog.map(t => {
                const u = user(t.userId)
                return (
                  <div key={t.id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{u?.name ?? t.userId}</p>
                      <p className="text-xs text-gray-400">{t.note} · {fmt(t.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-800 dark:text-gray-200">{t.hours} t</p>
                      <p className="text-xs text-gray-400">{((t.hours * (u?.hourlyRate ?? 0))).toLocaleString('da-DK')} kr.</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="space-y-2 p-3 border border-gray-200 dark:border-gray-700 rounded-xl">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400">Registrér timer</h4>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" min="0.5" step="0.5" placeholder="Timer" value={hours} onChange={e => setHours(e.target.value)}
                  className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5" />
                <input type="date" value={timeDate} onChange={e => setTimeDate(e.target.value)}
                  className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5" />
              </div>
              <input placeholder="Note" value={timeNote} onChange={e => setTimeNote(e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5" />
              <button
                onClick={() => {
                  if (hours && parseFloat(hours) > 0) {
                    logTime(wo.id, parseFloat(hours), timeNote, timeDate)
                    setHours(''); setTimeNote('')
                  }
                }}
                className="w-full py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Gem timer
              </button>
            </div>
          </>
        )}

        {/* RESERVEDELE TAB */}
        {tab === 'dele' && (
          <>
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm mb-2">
              <span className="text-xs text-gray-400">Delomkostning: </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{partsCost.toLocaleString('da-DK')} kr.</span>
            </div>
            <div className="space-y-2 mb-4">
              {wo.spareParts.length === 0 && <p className="text-sm text-gray-400">Ingen reservedele tilknyttet</p>}
              {wo.spareParts.map(sp => {
                const part = spareParts.find(r => r.id === sp.sparePartId)
                return (
                  <div key={sp.id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{part?.name ?? sp.sparePartId}</p>
                      <p className="text-xs text-gray-400">{part?.partNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{sp.quantity} stk</p>
                      <p className="text-xs text-gray-400">{((sp.quantity * (part?.price ?? 0))).toLocaleString('da-DK')} kr.</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="space-y-2 p-3 border border-gray-200 dark:border-gray-700 rounded-xl">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400">Tilknyt reservedel</h4>
              <select value={partId} onChange={e => setPartId(e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5">
                <option value="">Vælg reservedel...</option>
                {spareParts.map(sp => (
                  <option key={sp.id} value={sp.id}>{sp.name} (lager: {sp.quantity})</option>
                ))}
              </select>
              <input type="number" min="1" placeholder="Antal" value={partQty} onChange={e => setPartQty(e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5" />
              <button
                onClick={() => { if (partId && parseInt(partQty) > 0) { addSparePart(wo.id, partId, parseInt(partQty)); setPartId(''); setPartQty('1') } }}
                className="w-full py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tilknyt
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{children}</p>
    </div>
  )
}

// ---- Create WO Form ----
function CreateWOForm({ onClose }: { onClose: () => void }) {
  const { assets, users, createWorkOrder, lookupTables } = useStore()
  const woTypes  = lookupTables.find(t => t.key === 'work_order_types')?.items ?? []
  const priorities = lookupTables.find(t => t.key === 'priorities')?.items ?? []
  const [form, setForm] = useState({
    title: '', assetId: '', assigneeId: '', priority: 'Normal' as Priority,
    category: 'Afhjælpende' as WorkOrderCategory, dueDate: '', isPharma: false,
    status: 'Åben' as WorkOrderStatus, description: '',
  })
  function submit() {
    if (!form.title || !form.assetId || !form.dueDate) return
    createWorkOrder({
      ...form,
      assigneeId: form.assigneeId || null,
    })
    onClose()
  }
  const inp = 'w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2'
  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col z-40">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Opret arbejdsordre</h2>
        <button onClick={onClose} className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Titel *</label>
          <input className={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Beskriv arbejdsopgaven..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Aktiv *</label>
          <select className={inp} value={form.assetId} onChange={e => setForm(f => ({ ...f, assetId: e.target.value }))}>
            <option value="">Vælg aktiv...</option>
            {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Prioritet</label>
            <select className={inp} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}>
              {(priorities.length ? priorities.map(p => p.name) : ['Kritisk', 'Høj', 'Normal', 'Lav']).map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Kategori</label>
            <select className={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as WorkOrderCategory }))}>
              {(woTypes.length ? woTypes.map(t => t.name) : ['Forebyggende', 'Afhjælpende', 'Inspektion', 'Projekt', 'Rengøring']).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
            <select className={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as WorkOrderStatus }))}>
              {(['Åben', 'I gang', 'Planlagt', 'Afventer'] as WorkOrderStatus[]).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Forfaldsdato *</label>
            <input type="date" className={inp} value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ansvarlig</label>
          <select className={inp} value={form.assigneeId} onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}>
            <option value="">Ikke tildelt</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Beskrivelse</label>
          <textarea className={inp} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Yderligere detaljer..." />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input type="checkbox" checked={form.isPharma} onChange={e => setForm(f => ({ ...f, isPharma: e.target.checked }))} className="rounded" />
          <span>🧪 GMP/Pharma-relateret</span>
        </label>
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 text-sm rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Annuller</button>
        <button onClick={submit} className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">Opret</button>
      </div>
    </div>
  )
}

// ---- Column Designer ----
function ColumnDesigner({ columns, onClose, onChange }: {
  columns: string[]; onClose: () => void; onChange: (cols: string[]) => void
}) {
  const [cols, setCols] = useState(columns)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const allCols = Object.keys(COLUMN_LABELS)

  function toggle(col: string) {
    setCols(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])
  }

  return (
    <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-30 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Kolonner</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
      </div>
      <div className="p-2 space-y-0.5 max-h-72 overflow-y-auto">
        {allCols.map(col => (
          <label key={col} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={cols.includes(col)} onChange={() => toggle(col)} className="rounded" />
            {COLUMN_LABELS[col]}
          </label>
        ))}
      </div>
      <div className="p-2 border-t border-gray-100 dark:border-gray-800 flex gap-2">
        <button onClick={() => setCols(DEFAULT_COLUMNS)} className="flex-1 text-xs py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800">Reset</button>
        <button onClick={() => { onChange(cols); onClose() }} className="flex-1 text-xs py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Gem</button>
      </div>
    </div>
  )
}

// ---- Main Component ----
const PRIORITY_ORDER: Record<Priority, number> = { Kritisk: 0, Høj: 1, Normal: 2, Lav: 3 }

export default function WorkOrders() {
  const { workOrders, assets, users } = useStore()
  const [filterStatus, setFilterStatus] = useState<WorkOrderStatus | null>(null)
  const [search, setSearch] = useState('')
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showColumnDesigner, setShowColumnDesigner] = useState(false)
  const [columns, setColumns] = useState(DEFAULT_COLUMNS)
  const [sortCol, setSortCol] = useState<string>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const today = new Date().toISOString().split('T')[0]

  function toggleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<WorkOrderStatus, number>> = {}
    workOrders.forEach(wo => { counts[wo.status] = (counts[wo.status] ?? 0) + 1 })
    return counts
  }, [workOrders])

  const filtered = useMemo(() => {
    const list = workOrders.filter(wo => {
      if (filterStatus && wo.status !== filterStatus) return false
      if (search) {
        const asset = assets.find(a => a.id === wo.assetId)
        const q = search.toLowerCase()
        if (!wo.title.toLowerCase().includes(q) && !wo.id.toLowerCase().includes(q) && !asset?.name.toLowerCase().includes(q)) return false
      }
      return true
    })
    return [...list].sort((a, b) => {
      let av: string | number = '', bv: string | number = ''
      if (sortCol === 'priority') { av = PRIORITY_ORDER[a.priority]; bv = PRIORITY_ORDER[b.priority] }
      else if (sortCol === 'asset') { av = assets.find(x => x.id === a.assetId)?.name ?? ''; bv = assets.find(x => x.id === b.assetId)?.name ?? '' }
      else if (sortCol === 'assignee') { av = users.find(x => x.id === a.assigneeId)?.name ?? ''; bv = users.find(x => x.id === b.assigneeId)?.name ?? '' }
      else av = (a as unknown as Record<string, string>)[sortCol] ?? '', bv = (b as unknown as Record<string, string>)[sortCol] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [workOrders, filterStatus, search, assets, users, sortCol, sortDir])

  function renderCell(wo: WorkOrder, col: string) {
    const asset = assets.find(a => a.id === wo.assetId)
    const assignee = users.find(u => u.id === wo.assigneeId)
    const isOverdue = wo.dueDate < today && !['Afsluttet', 'Annulleret'].includes(wo.status)
    switch (col) {
      case 'id': return <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{wo.id}</span>
      case 'status': return <StatusBadge status={wo.status} />
      case 'title': return (
        <div className="flex items-center gap-1.5">
          {wo.isPharma && <span title="GMP/Pharma" className="text-sm">🧪</span>}
          <span className="font-medium text-gray-800 dark:text-gray-200">{wo.title}</span>
        </div>
      )
      case 'asset': return <span className="text-gray-600 dark:text-gray-400 text-xs">{asset?.name ?? '—'}</span>
      case 'priority': return <span className={clsx('text-xs font-medium', PRIORITY_COLORS[wo.priority])}>{wo.priority}</span>
      case 'assignee': return <span className="text-xs text-gray-600 dark:text-gray-400">{assignee?.name ?? '—'}</span>
      case 'createdAt': return <span className="text-xs text-gray-400">{fmt(wo.createdAt)}</span>
      case 'dueDate': return (
        <span className={clsx('text-xs', isOverdue ? 'text-red-500 font-medium' : 'text-gray-400 dark:text-gray-500')}>
          {isOverdue && <AlertTriangle size={10} className="inline mr-1" />}
          {fmt(wo.dueDate)}
        </span>
      )
      default: return null
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Arbejdsordrer</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{workOrders.length} ordrer i alt</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setSelectedWO(null) }}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} /> Ny arbejdsordre
        </button>
      </div>

      {/* Status filter bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilterStatus(null)}
          className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', filterStatus === null ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700')}
        >
          Vis alle ({workOrders.length})
        </button>
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s === filterStatus ? null : s)}
            className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', filterStatus === s ? 'ring-2 ring-offset-1 ring-blue-500' : '', STATUS_COLORS[s])}
          >
            {s} ({statusCounts[s] ?? 0})
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Søg på titel, id, aktiv..."
            className="w-full text-sm pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={13} /></button>}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowColumnDesigner(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Settings2 size={14} /> Kolonner
          </button>
          {showColumnDesigner && (
            <ColumnDesigner columns={columns} onClose={() => setShowColumnDesigner(false)} onChange={setColumns} />
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                {columns.map(col => (
                  <th
                    key={col}
                    onClick={() => toggleSort(col)}
                    className="text-left px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap cursor-pointer hover:text-slate-600 dark:hover:text-slate-200 select-none"
                  >
                    <span className="inline-flex items-center gap-1">
                      {COLUMN_LABELS[col]}
                      {sortCol === col
                        ? sortDir === 'asc'
                          ? <ChevronUp size={11} className="text-blue-500" />
                          : <ChevronDown size={11} className="text-blue-500" />
                        : <ChevronUp size={11} className="opacity-0 group-hover:opacity-30" />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-10 text-center text-sm text-slate-400">
                    Ingen arbejdsordrer matcher filteret
                  </td>
                </tr>
              ) : (
                filtered.map(wo => (
                  <tr
                    key={wo.id}
                    onClick={() => { setSelectedWO(wo); setShowCreate(false) }}
                    className={clsx(
                      'border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 cursor-pointer transition-colors',
                      selectedWO?.id === wo.id && 'bg-blue-50/60 dark:bg-blue-900/15'
                    )}
                  >
                    {columns.map(col => (
                      <td key={col} className="px-3 py-1.5">{renderCell(wo, col)}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side panels */}
      {selectedWO && <WOPanel wo={workOrders.find(w => w.id === selectedWO.id)!} onClose={() => setSelectedWO(null)} />}
      {showCreate && <CreateWOForm onClose={() => setShowCreate(false)} />}

      {/* Overlay */}
      {(selectedWO || showCreate) && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30" onClick={() => { setSelectedWO(null); setShowCreate(false) }} />
      )}
    </div>
  )
}
