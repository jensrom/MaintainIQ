import { useState } from 'react'
import {
  Plus, Pencil, Trash2, X, Check, Save,
  MapPin, Factory, Cog, Settings2, Wrench, Box, ChevronDown,
} from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'
import type { AssetCategory, AssetBaseType, LookupTable, LookupItem } from '../types'

// ─── Shared helpers ───────────────────────────────────────────────────────────

const COLOR_BG: Record<string, string> = {
  blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  amber:  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  green:  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  red:    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  gray:   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  slate:  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  teal:   'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
}

const ICON_MAP: Record<string, React.ReactNode> = {
  MapPin:    <MapPin size={12} />,
  Factory:   <Factory size={12} />,
  Cog:       <Cog size={12} />,
  Settings2: <Settings2 size={12} />,
  Wrench:    <Wrench size={12} />,
  Box:       <Box size={12} />,
}

function SBadge({ color, icon, name }: { color: string; icon?: string; name: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', COLOR_BG[color] ?? COLOR_BG.gray)}>
      {icon && ICON_MAP[icon]}
      {name}
    </span>
  )
}

// ─── Tab: System ─────────────────────────────────────────────────────────────

function TabSystem() {
  return (
    <div className="max-w-xl space-y-4">
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Site information</h3>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          {[
            { label: 'Site navn', value: 'Horsens Produktionssite' },
            { label: 'Site kode', value: 'HOR-SITE' },
            { label: 'Adresse', value: 'Skolebakken 20' },
            { label: 'By', value: 'Horsens' },
            { label: 'Postnummer', value: 'DK-8700' },
            { label: 'Land', value: 'Danmark' },
            { label: 'Tidszone', value: 'Europe/Copenhagen (CET)' },
            { label: 'Standard valuta', value: 'DKK — Dansk krone' },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">{f.label}</label>
              <input
                defaultValue={f.value}
                className="w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
        <div className="px-5 pb-4 flex justify-end">
          <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            <Save size={14} /> Gem ændringer
          </button>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">System information</h3>
        </div>
        <div className="p-5 space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex justify-between"><span>Version</span><span className="font-mono text-gray-800 dark:text-gray-200">MaintainIQ v1.0</span></div>
          <div className="flex justify-between"><span>Licens</span><span className="text-gray-800 dark:text-gray-200">Enterprise</span></div>
          <div className="flex justify-between"><span>Enheder i systemet</span><span className="text-gray-800 dark:text-gray-200">23</span></div>
          <div className="flex justify-between"><span>Aktive brugere</span><span className="text-gray-800 dark:text-gray-200">5</span></div>
        </div>
      </section>
    </div>
  )
}

// ─── Tab: Enhedskategorier ─────────────────────────────────────────────────

const BASE_TYPE_OPTS: { value: AssetBaseType; label: string }[] = [
  { value: 'site',     label: 'Site' },
  { value: 'lokation', label: 'Lokation' },
  { value: 'udstyr',   label: 'Udstyr / Maskine' },
  { value: 'vaerktoj', label: 'Værktøj' },
  { value: 'andet',    label: 'Andet' },
]

const COLOR_OPTS = [
  'blue','purple','amber','orange','green','red','gray','slate','teal','indigo',
]

const ICON_OPTS = [
  { value: 'MapPin', label: 'Nål' },
  { value: 'Factory', label: 'Fabrik' },
  { value: 'Cog', label: 'Tandhjul' },
  { value: 'Settings2', label: 'Maskine' },
  { value: 'Wrench', label: 'Nøgle' },
  { value: 'Box', label: 'Boks' },
]

type CatFormData = Omit<AssetCategory, 'id' | 'isSystem'>

function CategoryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<AssetCategory>
  onSave: (d: CatFormData) => void
  onCancel: () => void
}) {
  const [name,     setName]     = useState(initial?.name ?? '')
  const [baseType, setBaseType] = useState<AssetBaseType>(initial?.baseType ?? 'udstyr')
  const [color,    setColor]    = useState(initial?.color ?? 'blue')
  const [icon,     setIcon]     = useState(initial?.icon ?? 'Cog')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), baseType, color, icon })
  }

  return (
    <form onSubmit={submit} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 mt-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Navn *</label>
          <input
            className="w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={name} onChange={e => setName(e.target.value)} required placeholder="f.eks. Pumper"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Basetype</label>
          <select
            className="w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={baseType} onChange={e => setBaseType(e.target.value as AssetBaseType)}
          >
            {BASE_TYPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Farve</label>
          <div className="flex flex-wrap gap-1.5">
            {COLOR_OPTS.map(c => (
              <button
                key={c} type="button"
                onClick={() => setColor(c)}
                className={clsx('w-5 h-5 rounded-full border-2 transition-all', COLOR_BG[c].split(' ')[0], color === c ? 'border-gray-700 scale-110' : 'border-transparent')}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Ikon</label>
          <div className="flex gap-1.5 flex-wrap">
            {ICON_OPTS.map(o => (
              <button
                key={o.value} type="button"
                onClick={() => setIcon(o.value)}
                title={o.label}
                className={clsx('p-1.5 rounded border transition-colors', icon === o.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400')}
              >
                {ICON_MAP[o.value]}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <SBadge color={color} icon={icon} name={name || 'Forhåndsvisning'} />
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuller</button>
          <button type="submit" className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Gem</button>
        </div>
      </div>
    </form>
  )
}

function TabEnhedskategorier() {
  const { assetCategories, assets, createAssetCategory, updateAssetCategory, deleteAssetCategory } = useStore()
  const [showForm, setShowForm]   = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const countByCategory = assetCategories.reduce<Record<string, number>>((acc, c) => {
    acc[c.id] = assets.filter(a => a.categoryId === c.id).length
    return acc
  }, {})

  return (
    <div className="max-w-2xl">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <span className="text-xs font-medium text-gray-400">Vis navn</span>
          <span className="text-xs font-medium text-gray-400 w-16 text-center">Enheder</span>
          <span className="text-xs font-medium text-gray-400 w-28">Basetype</span>
          <span className="text-xs font-medium text-gray-400 w-16 text-center">System</span>
          <span className="text-xs font-medium text-gray-400 w-16 text-center">Handlinger</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800 px-4">
          {assetCategories.map(cat => (
            <div key={cat.id}>
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center py-2.5">
                <SBadge color={cat.color} icon={cat.icon} name={cat.name} />
                <span className="text-sm text-gray-500 w-16 text-center">
                  {countByCategory[cat.id] ?? 0}
                </span>
                <span className="text-xs text-gray-500 w-28">
                  {BASE_TYPE_OPTS.find(o => o.value === cat.baseType)?.label}
                </span>
                <span className="w-16 text-center">
                  {cat.isSystem && <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">System</span>}
                </span>
                <div className="flex items-center gap-1 w-16 justify-center">
                  {confirmId === cat.id ? (
                    <>
                      <button onClick={() => { deleteAssetCategory(cat.id); setConfirmId(null) }} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Check size={13} /></button>
                      <button onClick={() => setConfirmId(null)} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"><X size={13} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(cat.id); setShowForm(false) }} className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"><Pencil size={13} /></button>
                      {!cat.isSystem && (
                        <button onClick={() => setConfirmId(cat.id)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 size={13} /></button>
                      )}
                    </>
                  )}
                </div>
              </div>
              {editingId === cat.id && (
                <CategoryForm
                  initial={cat}
                  onSave={d => { updateAssetCategory(cat.id, d); setEditingId(null) }}
                  onCancel={() => setEditingId(null)}
                />
              )}
            </div>
          ))}
        </div>

        {/* Add new */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          {showForm ? (
            <CategoryForm
              onSave={d => { createAssetCategory(d); setShowForm(false) }}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <button
              onClick={() => { setShowForm(true); setEditingId(null) }}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus size={14} /> Tilføj kategori
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Opslagstabeller ──────────────────────────────────────────────────

function LookupTableSection({ table }: { table: LookupTable }) {
  const { addLookupItem, updateLookupItem, deleteLookupItem } = useStore()
  const [expanded, setExpanded]     = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [confirmId, setConfirmId]   = useState<string | null>(null)
  const [newName, setNewName]       = useState('')
  const [showAdd, setShowAdd]       = useState(false)

  function handleAdd() {
    if (!newName.trim()) return
    addLookupItem(table.id, { name: newName.trim(), sortOrder: table.items.length + 1, isSystem: false })
    setNewName('')
    setShowAdd(false)
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Table header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{table.name}</span>
          <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
            {table.items.length} poster
          </span>
        </div>
        <div className="flex items-center gap-2">
          {table.description && (
            <span className="text-xs text-gray-400 hidden sm:block">{table.description}</span>
          )}
          <ChevronDown size={14} className={clsx('text-gray-400 transition-transform', expanded && 'rotate-180')} />
        </div>
      </button>

      {/* Items */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {/* Column header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 text-[11px] font-medium text-gray-400 uppercase tracking-wide">
            <span>Navn</span>
            <span className="w-16 text-center">Rækkefølge</span>
            <span className="w-12 text-center">System</span>
            <span className="w-16 text-center">Handlinger</span>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
            {[...table.items].sort((a, b) => a.sortOrder - b.sortOrder).map(item => (
              <div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-4 py-2">
                {editingId === item.id ? (
                  <input
                    autoFocus
                    defaultValue={item.name}
                    onBlur={e => { updateLookupItem(table.id, item.id, { name: e.target.value }); setEditingId(null) }}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditingId(null) }}
                    className="border border-blue-400 rounded px-2 py-0.5 text-sm focus:outline-none"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    {item.color && <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium', COLOR_BG[item.color] ?? COLOR_BG.gray)}>{item.name}</span>}
                    {!item.color && <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>}
                  </div>
                )}
                <span className="text-xs text-gray-400 w-16 text-center">{item.sortOrder}</span>
                <span className="w-12 text-center">
                  {item.isSystem && <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-400 px-1 py-0.5 rounded">sys</span>}
                </span>
                <div className="flex items-center gap-1 w-16 justify-center">
                  {confirmId === item.id ? (
                    <>
                      <button onClick={() => { deleteLookupItem(table.id, item.id); setConfirmId(null) }} className="p-1 text-red-500 hover:bg-red-50 rounded"><Check size={12} /></button>
                      <button onClick={() => setConfirmId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={12} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setEditingId(item.id)} className="p-1 text-gray-400 hover:text-blue-500 rounded"><Pencil size={12} /></button>
                      {!item.isSystem && (
                        <button onClick={() => setConfirmId(item.id)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 size={12} /></button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add new */}
          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            {showAdd ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setShowAdd(false); setNewName('') } }}
                  placeholder="Nyt navn..."
                  className="flex-1 border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button onClick={handleAdd} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Gem</button>
                <button onClick={() => { setShowAdd(false); setNewName('') }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded"><X size={14} /></button>
              </div>
            ) : (
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus size={13} /> Tilføj post
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TabOpslagstabeller() {
  const { lookupTables } = useStore()
  return (
    <div className="max-w-2xl space-y-2">
      <p className="text-xs text-gray-500 mb-4">
        Opslagstabeller bruges på tværs af systemet i arbejdsordrer, logbog og enheder.
        Klik på en tabel for at se og redigere poster.
      </p>
      {lookupTables.map(t => <LookupTableSection key={t.id} table={t} />)}
    </div>
  )
}

// ─── Tab: Vedligehold og arbejdsordre ─────────────────────────────────────────

function TabVedligehold() {
  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Arbejdsordre standardindstillinger</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Standard prioritet</label>
            <select className="w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option>Normal</option>
              <option>Lav</option>
              <option>Høj</option>
              <option>Kritisk</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Standard forfaldstid (dage)</label>
            <input defaultValue="14" type="number" className="w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Standard vedligeholdelses type</label>
            <select className="w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option>Forebyggende</option>
              <option>Afhjælpende</option>
              <option>Inspektion</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Auto-nummerering prefix</label>
            <input defaultValue="AO-" className="w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            <Save size={14} /> Gem ændringer
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Planlagt vedligehold standardindstillinger</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Standard interval (dage)</label>
            <input defaultValue="30" type="number" className="w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Forfaldsvarsling (dage før)</label>
            <input defaultValue="7" type="number" className="w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            <Save size={14} /> Gem ændringer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Gæsteportal ─────────────────────────────────────────────────────────

function TabGaesteportal() {
  return (
    <div className="max-w-xl">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Gæsteportal konfiguration</h3>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Velkomsttekst</label>
          <textarea
            defaultValue="Indsend en vedligeholdelsesanmodning her. Vores team behandler din anmodning hurtigst muligt."
            rows={3}
            className="w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Bekræftelsestekst</label>
          <textarea
            defaultValue="Tak for din anmodning! Vi har modtaget den og vender tilbage hurtigst muligt."
            rows={2}
            className="w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {['Navn', 'Email', 'Telefon', 'Beskrivelse', 'Lokation', 'Prioritet'].map(f => (
            <div key={f} className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded px-3 py-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">{f}</span>
              <input type="checkbox" defaultChecked className="w-3.5 h-3.5" />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            <Save size={14} /> Gem ændringer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type TabId = 'system' | 'enhedskategorier' | 'opslagstabeller' | 'vedligehold' | 'gaesteportal'

interface TabDef { id: TabId; label: string }

const TABS: TabDef[] = [
  { id: 'system',            label: 'System' },
  { id: 'enhedskategorier',  label: 'Enhedskategorier' },
  { id: 'opslagstabeller',   label: 'Opslagstabeller' },
  { id: 'vedligehold',       label: 'Vedligehold og arbejdsordre' },
  { id: 'gaesteportal',      label: 'Gæsteportal' },
]

export default function CMMSSettings() {
  const [activeTab, setActiveTab] = useState<TabId>('system')

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">CMMS Indstillinger</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Systemkonfiguration, opslagstabeller og kategorier</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-gray-200 dark:border-gray-800 mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'system'           && <TabSystem />}
      {activeTab === 'enhedskategorier' && <TabEnhedskategorier />}
      {activeTab === 'opslagstabeller'  && <TabOpslagstabeller />}
      {activeTab === 'vedligehold'      && <TabVedligehold />}
      {activeTab === 'gaesteportal'     && <TabGaesteportal />}
    </div>
  )
}
