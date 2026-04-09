import { useState } from 'react'
import {
  Moon, Sun, Bell, BellOff, FlaskConical, Layers, Plus, Pencil, Trash2, X, Check,
  MapPin, Factory, Cog, Settings2, Wrench, Box,
} from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'
import type { AssetCategory, AssetBaseType } from '../types'

// ─── Toggle ──────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label, description, icon }: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex items-center gap-3">
        {icon && <span className="text-gray-400 dark:text-gray-500">{icon}</span>}
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
          {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none',
          checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
        )}
      >
        <span className={clsx(
          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0'
        )} />
      </button>
    </div>
  )
}

// ─── Category management ──────────────────────────────────────────────────────

const BASE_TYPE_OPTS: { value: AssetBaseType; label: string }[] = [
  { value: 'site',     label: 'Site' },
  { value: 'lokation', label: 'Lokation' },
  { value: 'udstyr',   label: 'Udstyr / Maskine' },
  { value: 'vaerktoj', label: 'Værktøj' },
  { value: 'andet',    label: 'Andet' },
]

const COLOR_OPTS = [
  { value: 'blue',   label: 'Blå' },
  { value: 'purple', label: 'Lilla' },
  { value: 'amber',  label: 'Gul' },
  { value: 'orange', label: 'Orange' },
  { value: 'green',  label: 'Grøn' },
  { value: 'red',    label: 'Rød' },
  { value: 'gray',   label: 'Grå' },
  { value: 'slate',  label: 'Skifer' },
]

const ICON_OPTS = [
  { value: 'MapPin',    label: 'Nål',      icon: <MapPin size={14} /> },
  { value: 'Factory',   label: 'Fabrik',   icon: <Factory size={14} /> },
  { value: 'Cog',       label: 'Tandhjul', icon: <Cog size={14} /> },
  { value: 'Settings2', label: 'Maskine',  icon: <Settings2 size={14} /> },
  { value: 'Wrench',    label: 'Nøgle',    icon: <Wrench size={14} /> },
  { value: 'Box',       label: 'Boks',     icon: <Box size={14} /> },
]

const COLOR_BG: Record<string, string> = {
  blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  amber:  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  green:  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  red:    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  gray:   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  slate:  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

const ICON_MAP: Record<string, React.ReactNode> = {
  MapPin:    <MapPin size={13} />,
  Factory:   <Factory size={13} />,
  Cog:       <Cog size={13} />,
  Settings2: <Settings2 size={13} />,
  Wrench:    <Wrench size={13} />,
  Box:       <Box size={13} />,
}

function CategoryRow({
  cat,
  onEdit,
  onDelete,
}: {
  cat: AssetCategory
  onEdit: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const baseLabel = BASE_TYPE_OPTS.find(o => o.value === cat.baseType)?.label ?? cat.baseType

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex items-center gap-3">
        <span className={clsx('inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium', COLOR_BG[cat.color])}>
          {ICON_MAP[cat.icon]}
          {cat.name}
        </span>
        <span className="text-xs text-gray-400">{baseLabel}</span>
        {cat.isSystem && (
          <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">System</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {confirmDelete ? (
          <>
            <span className="text-xs text-red-500 mr-1">Slet?</span>
            <button onClick={onDelete} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
              <Check size={14} />
            </button>
            <button onClick={() => setConfirmDelete(false)} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
              <Pencil size={13} />
            </button>
            {!cat.isSystem && (
              <button onClick={() => setConfirmDelete(true)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                <Trash2 size={13} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

type CategoryFormData = Omit<AssetCategory, 'id' | 'isSystem'>

function CategoryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<AssetCategory>
  onSave: (data: CategoryFormData) => void
  onCancel: () => void
}) {
  const [name, setName]         = useState(initial?.name ?? '')
  const [baseType, setBaseType] = useState<AssetBaseType>(initial?.baseType ?? 'udstyr')
  const [color, setColor]       = useState(initial?.color ?? 'blue')
  const [icon, setIcon]         = useState(initial?.icon ?? 'Cog')

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
          <select
            className="w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={color} onChange={e => setColor(e.target.value)}
          >
            {COLOR_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Ikon</label>
          <select
            className="w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={icon} onChange={e => setIcon(e.target.value)}
          >
            {ICON_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      {/* Preview */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Forhåndsvisning:</span>
        <span className={clsx('inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium', COLOR_BG[color])}>
          {ICON_MAP[icon]}
          {name || 'Ny kategori'}
        </span>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          Annuller
        </button>
        <button type="submit" className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
          Gem kategori
        </button>
      </div>
    </form>
  )
}

function AssetCategories() {
  const { assetCategories, createAssetCategory, updateAssetCategory, deleteAssetCategory } = useStore()
  const [showForm, setShowForm]           = useState(false)
  const [editingId, setEditingId]         = useState<string | null>(null)

  function handleCreate(data: Omit<AssetCategory, 'id' | 'isSystem'>) {
    createAssetCategory(data)
    setShowForm(false)
  }

  function handleUpdate(id: string, data: Omit<AssetCategory, 'id' | 'isSystem'>) {
    updateAssetCategory(id, data)
    setEditingId(null)
  }

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-5 mb-4">
      <div className="flex items-center justify-between pt-4 pb-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Enhedskategorier</h2>
        <button
          onClick={() => { setShowForm(true); setEditingId(null) }}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          <Plus size={13} /> Ny kategori
        </button>
      </div>

      {assetCategories.map(cat => (
        <div key={cat.id}>
          <CategoryRow
            cat={cat}
            onEdit={() => { setEditingId(cat.id); setShowForm(false) }}
            onDelete={() => deleteAssetCategory(cat.id)}
          />
          {editingId === cat.id && (
            <CategoryForm
              initial={cat}
              onSave={data => handleUpdate(cat.id, data)}
              onCancel={() => setEditingId(null)}
            />
          )}
        </div>
      ))}

      {showForm && (
        <CategoryForm
          onSave={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}
    </section>
  )
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function Settings() {
  const { settings, updateSettings } = useStore()

  function setDark(v: boolean) {
    updateSettings({ darkMode: v })
    document.documentElement.classList.toggle('dark', v)
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Indstillinger</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Konfigurér systemets udseende og adfærd</p>
      </div>

      {/* Appearance */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-5 mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 pb-2">Udseende</h2>
        <Toggle
          checked={settings.darkMode}
          onChange={setDark}
          label="Mørkt tema"
          description="Skift mellem lyst og mørkt udseende"
          icon={settings.darkMode ? <Moon size={16} /> : <Sun size={16} />}
        />
      </section>

      {/* GMP Mode */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-5 mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 pb-2">GMP / Pharma</h2>
        <Toggle
          checked={settings.pharmaMode}
          onChange={v => updateSettings({ pharmaMode: v })}
          label="Pharma-tilstand"
          description="Aktivér GMP-flagning af arbejdsordrer og PM-opgaver (🧪)"
          icon={<FlaskConical size={16} />}
        />
      </section>

      {/* Asset Categories */}
      <AssetCategories />

      {/* Notifications */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 pb-2">Notifikationer</h2>
        <Toggle
          checked={settings.notifications.overdueWO}
          onChange={v => updateSettings({ notifications: { ...settings.notifications, overdueWO: v } })}
          label="Forfaldne arbejdsordrer"
          description="Varsling når en arbejdsordres forfaldsdato er overskredet"
          icon={<Bell size={16} />}
        />
        <Toggle
          checked={settings.notifications.newRequests}
          onChange={v => updateSettings({ notifications: { ...settings.notifications, newRequests: v } })}
          label="Nye anmodninger"
          description="Varsling ved nye indkommende arbejdsanmodninger fra gæsteportalen"
          icon={<Bell size={16} />}
        />
        <Toggle
          checked={settings.notifications.emptyStock}
          onChange={v => updateSettings({ notifications: { ...settings.notifications, emptyStock: v } })}
          label="Tomt lager"
          description="Varsling når en reservedel er helt opbrugt"
          icon={<BellOff size={16} />}
        />
        <Toggle
          checked={settings.notifications.lowStock}
          onChange={v => updateSettings({ notifications: { ...settings.notifications, lowStock: v } })}
          label="Lavt lager"
          description="Varsling når en reservedel er under minimumsniveauet"
          icon={<Bell size={16} />}
        />
        <Toggle
          checked={settings.notifications.overduePM}
          onChange={v => updateSettings({ notifications: { ...settings.notifications, overduePM: v } })}
          label="Forfaldne PM-opgaver"
          description="Varsling når en planlagt vedligeholdelsesopgave ikke er udført til tiden"
          icon={<Bell size={16} />}
        />
      </section>
    </div>
  )
}
