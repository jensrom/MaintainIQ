import { useState } from 'react'
import QRCode from 'react-qr-code'
import {
  X, Save, Wifi, WifiOff, ChevronDown,
  ClipboardList, BarChart2, Users, Building2, Paperclip,
  Sliders, DollarSign, ScrollText, ShieldCheck, ShoppingCart,
  Trash2, Image,
} from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'
import type { Asset, AssetBaseType } from '../types'

// ─── helpers ──────────────────────────────────────────────────────────────────

const CRITICALITY_OPTS = ['Kritisk', 'Høj', 'Normal', 'Lav'] as const

const BASE_TYPE_LABELS: Record<AssetBaseType, string> = {
  site: 'Site',
  lokation: 'Lokation',
  udstyr: 'Udstyr',
  vaerktoj: 'Værktøj',
  andet: 'Andet',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  )
}

function Input({
  value, onChange, placeholder, disabled,
}: {
  value: string; onChange?: (v: string) => void; placeholder?: string; disabled?: boolean
}) {
  return (
    <input
      className="w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-400"
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
    />
  )
}

function Textarea({
  value, onChange, placeholder, rows = 3,
}: {
  value: string; onChange?: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <textarea
      className="w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      rows={rows}
    />
  )
}

function Select({
  value, onChange, options,
}: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <select
        className="w-full appearance-none border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 pr-7 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 border-b border-gray-100 dark:border-gray-800">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{title}</p>
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type TabId =
  | 'generelt' | 'arbejdsordrer' | 'maaling' | 'personale'
  | 'garantier' | 'virksomheder' | 'indkob' | 'filer'
  | 'tilpasset' | 'oekonomi' | 'log'

interface Tab { id: TabId; label: string; icon: React.ReactNode }

function getTabs(baseType: AssetBaseType): Tab[] {
  const base: Tab[] = [
    { id: 'generelt',       label: 'Generelt',            icon: <ClipboardList size={13} /> },
    { id: 'arbejdsordrer',  label: 'Arbejdsordrer',       icon: <BarChart2 size={13} /> },
    { id: 'maaling',        label: 'Målinger/Hændelser',  icon: <BarChart2 size={13} /> },
    { id: 'personale',      label: 'Personale',           icon: <Users size={13} /> },
    { id: 'virksomheder',   label: 'Virksomheder',        icon: <Building2 size={13} /> },
    { id: 'filer',          label: 'Filer',               icon: <Paperclip size={13} /> },
    { id: 'tilpasset',      label: 'Tilpasset',           icon: <Sliders size={13} /> },
    { id: 'oekonomi',       label: 'Økonomi',             icon: <DollarSign size={13} /> },
    { id: 'log',            label: 'Log',                 icon: <ScrollText size={13} /> },
  ]
  if (baseType === 'udstyr' || baseType === 'vaerktoj') {
    base.splice(4, 0,
      { id: 'garantier', label: 'Garantier', icon: <ShieldCheck size={13} /> },
      { id: 'indkob',    label: 'Indkøb',    icon: <ShoppingCart size={13} /> },
    )
  }
  return base
}

// ─── Tab content ──────────────────────────────────────────────────────────────

function TabGenerelt({
  draft, setDraft, baseType, assets, suppliers,
}: {
  draft: Asset
  setDraft: React.Dispatch<React.SetStateAction<Asset>>
  baseType: AssetBaseType
  assets: Asset[]
  suppliers: { id: string; name: string }[]
}) {
  const isLocation = baseType === 'site' || baseType === 'lokation'
  const isEquipment = baseType === 'udstyr' || baseType === 'vaerktoj'
  const parent = assets.find(a => a.id === draft.parentId)

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {/* Location section */}
      <div className="p-4 space-y-3">
        <SectionHeader title="Lokation" />
        {isLocation ? (
          <div className="space-y-3">
            {parent && (
              <Field label="Denne enhed er en del af">
                <div className="flex gap-2">
                  <Input value={parent.name} disabled />
                </div>
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Adresse">
                <Textarea value={draft.address ?? ''} onChange={v => setDraft(d => ({ ...d, address: v }))} rows={2} />
              </Field>
              <div className="space-y-3">
                <Field label="By">
                  <Input value={draft.city ?? ''} onChange={v => setDraft(d => ({ ...d, city: v }))} />
                </Field>
                <Field label="Postnummer">
                  <Input value={draft.zip ?? ''} onChange={v => setDraft(d => ({ ...d, zip: v }))} />
                </Field>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Provins">
                <Input value={draft.province ?? ''} onChange={v => setDraft(d => ({ ...d, province: v }))} />
              </Field>
              <Field label="Land">
                <Input value={draft.country ?? ''} onChange={v => setDraft(d => ({ ...d, country: v }))} />
              </Field>
            </div>
          </div>
        ) : isEquipment ? (
          <div className="space-y-3">
            {parent && (
              <Field label="Enheden er lokaliseret på">
                <Input value={parent.name} disabled />
              </Field>
            )}
            <div className="grid grid-cols-3 gap-3">
              <Field label="Gang">
                <Input value={draft.gang ?? ''} onChange={v => setDraft(d => ({ ...d, gang: v }))} placeholder="A" />
              </Field>
              <Field label="Række">
                <Input value={draft.row ?? ''} onChange={v => setDraft(d => ({ ...d, row: v }))} placeholder="1" />
              </Field>
              <Field label="Hylde">
                <Input value={draft.shelf ?? ''} onChange={v => setDraft(d => ({ ...d, shelf: v }))} placeholder="Øverst" />
              </Field>
            </div>
            {parent && (
              <p className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                {[parent.address, parent.city, parent.zip, parent.country].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        ) : null}
      </div>

      {/* Generel information */}
      <div className="p-4 space-y-3">
        <SectionHeader title="Generel information" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Konto">
            <Input value={draft.account ?? ''} onChange={v => setDraft(d => ({ ...d, account: v }))} />
          </Field>
          <Field label="Stregkode">
            <Input value={draft.barcode ?? ''} onChange={v => setDraft(d => ({ ...d, barcode: v }))} />
          </Field>
          <Field label="Afdeling">
            <Input value={draft.department ?? ''} onChange={v => setDraft(d => ({ ...d, department: v }))} />
          </Field>
          {isEquipment && (
            <Field label="Leverandør">
              <Select
                value={draft.supplierId ?? ''}
                onChange={v => setDraft(d => ({ ...d, supplierId: v }))}
                options={[{ value: '', label: '— ingen —' }, ...suppliers.map(s => ({ value: s.id, label: s.name }))]}
              />
            </Field>
          )}
        </div>
        <Field label="Noter">
          <Textarea value={draft.notes ?? ''} onChange={v => setDraft(d => ({ ...d, notes: v }))} rows={3} />
        </Field>
      </div>

      {/* Equipment specs */}
      {isEquipment && (
        <div className="p-4 space-y-3">
          <SectionHeader title="Tekniske specifikationer" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mærke">
              <Input value={draft.brand ?? ''} onChange={v => setDraft(d => ({ ...d, brand: v }))} />
            </Field>
            <Field label="Model">
              <Input value={draft.model ?? ''} onChange={v => setDraft(d => ({ ...d, model: v }))} />
            </Field>
            <Field label="Årgang / Serienummer">
              <Input value={draft.yearOfManufacture ?? ''} onChange={v => setDraft(d => ({ ...d, yearOfManufacture: v }))} />
            </Field>
            <Field label="UNSPSC Kode">
              <Input value={draft.unspscCode ?? ''} onChange={v => setDraft(d => ({ ...d, unspscCode: v }))} placeholder="00000000" />
            </Field>
          </div>
        </div>
      )}
    </div>
  )
}

function TabWorkOrders({ assetId }: { assetId: string }) {
  const { workOrders, assets } = useStore()
  const wos = workOrders.filter(wo => wo.assetId === assetId)
  const STATUS_COLORS: Record<string, string> = {
    'Åben': 'bg-blue-100 text-blue-700',
    'I gang': 'bg-yellow-100 text-yellow-700',
    'Planlagt': 'bg-purple-100 text-purple-700',
    'Afsluttet': 'bg-green-100 text-green-700',
    'Annulleret': 'bg-gray-100 text-gray-500',
    'Afventer': 'bg-orange-100 text-orange-700',
    'Arbejdsanmodning': 'bg-slate-100 text-slate-600',
  }
  if (wos.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-12">Ingen arbejdsordrer på denne enhed</p>
  }
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {wos.map(wo => (
        <div key={wo.id} className="px-4 py-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{wo.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{wo.id} · Forfald {wo.dueDate}</p>
          </div>
          <span className={clsx('text-[11px] px-2 py-0.5 rounded font-medium whitespace-nowrap', STATUS_COLORS[wo.status] ?? 'bg-gray-100 text-gray-600')}>
            {wo.status}
          </span>
        </div>
      ))}
    </div>
  )
}

function TabLog({ assetId }: { assetId: string }) {
  const { logEntries, users } = useStore()
  const entries = logEntries.filter(e => e.assetIds.includes(assetId))
  const SEV_COLORS: Record<string, string> = {
    Lav: 'bg-gray-100 text-gray-500',
    Medium: 'bg-blue-100 text-blue-600',
    Høj: 'bg-orange-100 text-orange-600',
    Kritisk: 'bg-red-100 text-red-600',
  }
  if (entries.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-12">Ingen logposter på denne enhed</p>
  }
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {entries.map(e => {
        const user = users.find(u => u.id === e.userId)
        return (
          <div key={e.id} className="px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={clsx('text-[11px] px-2 py-0.5 rounded font-medium', SEV_COLORS[e.severity])}>
                  {e.type}
                </span>
                <span className="text-xs text-gray-400">{e.createdAt}</span>
              </div>
              <span className="text-xs text-gray-400">{user?.name ?? '—'}</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">{e.text}</p>
          </div>
        )
      })}
    </div>
  )
}

function TabOekonomi({ assetId }: { assetId: string }) {
  const { workOrders, spareParts, users } = useStore()
  const wos = workOrders.filter(wo => wo.assetId === assetId && wo.status !== 'Annulleret')

  const rows = wos.map(wo => {
    const laborCost = wo.timeLog.reduce((sum, t) => {
      const user = users.find(u => u.id === t.userId)
      return sum + t.hours * (user?.hourlyRate ?? 0)
    }, 0)
    const partsCost = wo.spareParts.reduce((sum, sp) => {
      const part = spareParts.find(p => p.id === sp.sparePartId)
      return sum + sp.quantity * (part?.price ?? 0)
    }, 0)
    return { wo, laborCost, partsCost, total: laborCost + partsCost }
  })

  const totalLabor = rows.reduce((s, r) => s + r.laborCost, 0)
  const totalParts = rows.reduce((s, r) => s + r.partsCost, 0)
  const grandTotal = totalLabor + totalParts

  const fmt = (n: number) => n.toLocaleString('da-DK', { style: 'currency', currency: 'DKK', maximumFractionDigits: 0 })

  if (rows.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-12">Ingen omkostninger registreret på denne enhed</p>
  }

  return (
    <div className="p-4 space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Arbejdsomkostninger', value: fmt(totalLabor), color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Reservedelsomkostninger', value: fmt(totalParts), color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Total', value: fmt(grandTotal), color: 'text-gray-900 dark:text-gray-100' },
        ].map(card => (
          <div key={card.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-[11px] text-gray-400 mb-1">{card.label}</p>
            <p className={clsx('text-base font-bold', card.color)}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Per-WO breakdown */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-400">Arbejdsordre</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-gray-400">Arbejde</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-gray-400">Reservedele</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-gray-400">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map(r => (
              <tr key={r.wo.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                <td className="px-3 py-2">
                  <p className="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[160px]">{r.wo.title}</p>
                  <p className="text-[11px] text-gray-400">{r.wo.status}</p>
                </td>
                <td className="px-3 py-2 text-right text-xs text-blue-600 dark:text-blue-400">{fmt(r.laborCost)}</td>
                <td className="px-3 py-2 text-right text-xs text-amber-600 dark:text-amber-400">{fmt(r.partsCost)}</td>
                <td className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">{fmt(r.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700">
              <td className="px-3 py-2 text-xs font-semibold text-gray-500">I alt</td>
              <td className="px-3 py-2 text-right text-xs font-semibold text-blue-600 dark:text-blue-400">{fmt(totalLabor)}</td>
              <td className="px-3 py-2 text-right text-xs font-semibold text-amber-600 dark:text-amber-400">{fmt(totalParts)}</td>
              <td className="px-3 py-2 text-right text-xs font-bold text-gray-900 dark:text-gray-100">{fmt(grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function TabPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <p className="text-sm">{label} — kommer snart</p>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function AssetDetailPanel({
  asset,
  onClose,
}: {
  asset: Asset
  onClose: () => void
}) {
  const { assetCategories, assets, suppliers, updateAsset, deleteAsset } = useStore()
  const [draft, setDraft] = useState<Asset>({ ...asset })
  const [activeTab, setActiveTab] = useState<TabId>('generelt')
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const category = assetCategories.find(c => c.id === draft.categoryId)
  const baseType = category?.baseType ?? 'andet'
  const tabs = getTabs(baseType)

  // QR value is IMMUTABLE — based solely on asset.id, which never changes.
  // Renaming, recoding or moving the asset does NOT change the QR code.
  const qrValue = `MAINTAINIQ:${asset.id}`

  function handleSave() {
    updateAsset(asset.id, draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleDelete() {
    deleteAsset(asset.id)
    onClose()
  }

  function handleToggleStatus() {
    setDraft(d => ({ ...d, status: d.status === 'online' ? 'offline' : 'online' }))
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-3xl h-full bg-white dark:bg-gray-950 shadow-2xl flex flex-col overflow-hidden">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">
              {BASE_TYPE_LABELS[baseType]}
            </span>
            <span className="text-gray-300 dark:text-gray-700">/</span>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {asset.name} <span className="font-normal text-gray-400">({asset.code})</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {confirmDelete ? (
              <>
                <span className="text-xs text-red-500 mr-1">Slet permanent?</span>
                <button onClick={handleDelete} className="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700">Ja, slet</button>
                <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">Annuller</button>
              </>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                <Trash2 size={15} />
              </button>
            )}
            <button
              onClick={handleSave}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded font-medium transition-colors',
                saved
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              <Save size={13} />
              {saved ? 'Gemt!' : 'Gem'}
            </button>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Header card ── */}
        <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-5 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          {/* Left: image + status */}
          <div className="flex flex-col items-center gap-2 w-28">
            <div className="w-28 h-20 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center border border-gray-200 dark:border-gray-700">
              {draft.image
                ? <img src={draft.image} alt={draft.name} className="w-full h-full object-cover rounded" />
                : <Image size={24} className="text-gray-300 dark:text-gray-600" />
              }
            </div>
            <p className="text-[11px] text-center text-gray-500 dark:text-gray-400 font-mono leading-tight">
              {draft.code}<br />
              <span className="text-[10px]">{draft.name}</span>
            </p>
            <button
              onClick={handleToggleStatus}
              className={clsx(
                'text-[11px] px-2 py-0.5 rounded font-medium w-full text-center',
                draft.status === 'online'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              )}
            >
              {draft.status === 'online' ? 'Online' : 'Offline'}
            </button>
            <button
              onClick={handleToggleStatus}
              className="text-[11px] text-blue-500 hover:underline"
            >
              {draft.status === 'online' ? 'Sæt Offline' : 'Sæt Online'}
            </button>
          </div>

          {/* Middle: editable fields */}
          <div className="space-y-2">
            <Field label="Navn">
              <Input value={draft.name} onChange={v => setDraft(d => ({ ...d, name: v }))} />
            </Field>
            <Field label="Beskrivelse">
              <Textarea value={draft.description ?? ''} onChange={v => setDraft(d => ({ ...d, description: v }))} rows={2} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Kode">
                <Input value={draft.code} onChange={v => setDraft(d => ({ ...d, code: v }))} />
              </Field>
              <Field label="Kategori">
                <Select
                  value={draft.categoryId}
                  onChange={v => setDraft(d => ({ ...d, categoryId: v }))}
                  options={assetCategories.map(c => ({ value: c.id, label: c.name }))}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Kritikalitet">
                <Select
                  value={draft.criticality}
                  onChange={v => setDraft(d => ({ ...d, criticality: v as Asset['criticality'] }))}
                  options={CRITICALITY_OPTS.map(o => ({ value: o, label: o }))}
                />
              </Field>
            </div>
          </div>

          {/* Right: status + QR */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              {draft.status === 'online'
                ? <Wifi size={16} className="text-green-500" />
                : <WifiOff size={16} className="text-red-400" />
              }
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {draft.status === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="bg-white p-2 rounded border border-gray-200">
              <QRCode value={qrValue} size={90} />
            </div>
            <p className="text-[10px] text-gray-400 font-mono text-center">{asset.code}</p>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex gap-0 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shrink-0 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium whitespace-nowrap border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'generelt' && (
            <TabGenerelt
              draft={draft}
              setDraft={setDraft}
              baseType={baseType}
              assets={assets}
              suppliers={suppliers}
            />
          )}
          {activeTab === 'arbejdsordrer' && <TabWorkOrders assetId={asset.id} />}
          {activeTab === 'log' && <TabLog assetId={asset.id} />}
          {activeTab === 'maaling'     && <TabPlaceholder label="Målinger/Hændelser" />}
          {activeTab === 'personale'   && <TabPlaceholder label="Personale" />}
          {activeTab === 'garantier'   && <TabPlaceholder label="Garantier" />}
          {activeTab === 'virksomheder'&& <TabPlaceholder label="Virksomheder" />}
          {activeTab === 'indkob'      && <TabPlaceholder label="Indkøb" />}
          {activeTab === 'filer'       && <TabPlaceholder label="Filer" />}
          {activeTab === 'tilpasset'   && <TabPlaceholder label="Tilpasset" />}
          {activeTab === 'oekonomi'    && <TabOekonomi assetId={asset.id} />}
        </div>
      </div>
    </div>
  )
}
