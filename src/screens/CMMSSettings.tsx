import { useState, useRef } from 'react'
import {
  Plus, Pencil, Trash2, X, Check, Save,
  MapPin, Factory, Cog, Settings2, Wrench, Box, ChevronDown, ChevronRight,
  Upload, Image, Building2, Phone, Mail, Globe, Hash,
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
  const { companySettings, updateCompanySettings, users, assets } = useStore()
  const [form, setForm] = useState({ ...companySettings })
  const [saved, setSaved] = useState(false)
  const fi = (key: keyof typeof form, v: string | boolean) => setForm(f => ({ ...f, [key]: v }))
  const inp = 'w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500'

  function save() {
    updateCompanySettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-xl space-y-4">
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Virksomhedsoplysninger</h3>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-[11px] font-medium text-gray-400 mb-1">Virksomhedsnavn</label>
            <input className={inp} value={form.name} onChange={e => fi('name', e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1">Adresse</label>
            <input className={inp} value={form.address ?? ''} onChange={e => fi('address', e.target.value)} placeholder="Vejnavn og nr." />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1">By</label>
            <input className={inp} value={form.city ?? ''} onChange={e => fi('city', e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1">Postnummer</label>
            <input className={inp} value={form.zip ?? ''} onChange={e => fi('zip', e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1">Land</label>
            <input className={inp} value={form.country ?? ''} onChange={e => fi('country', e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1">Telefon</label>
            <input className={inp} value={form.phone ?? ''} onChange={e => fi('phone', e.target.value)} placeholder="+45 00 00 00 00" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1">E-mail</label>
            <input type="email" className={inp} value={form.email ?? ''} onChange={e => fi('email', e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1">CVR-nummer</label>
            <input className={inp} value={form.vatNumber ?? ''} onChange={e => fi('vatNumber', e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1">Website</label>
            <input className={inp} value={form.website ?? ''} onChange={e => fi('website', e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <div className="px-5 pb-2 space-y-1">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" checked={form.logoOnPrint} onChange={e => fi('logoOnPrint', e.target.checked)} className="rounded" />
            Vis logo ved udskrivning
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" checked={form.logoOnQR} onChange={e => fi('logoOnQR', e.target.checked)} className="rounded" />
            Vis logo på QR-koder
          </label>
        </div>
        <div className="px-5 pb-4 pt-3 flex items-center justify-end gap-3">
          {saved && <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Gemt</span>}
          <button onClick={save} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
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
          <div className="flex justify-between"><span>Aktiver i systemet</span><span className="text-gray-800 dark:text-gray-200">{assets.length}</span></div>
          <div className="flex justify-between"><span>Aktive brugere</span><span className="text-gray-800 dark:text-gray-200">{users.filter(u => u.isActive !== false).length}</span></div>
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
    onSave({
      name: name.trim(),
      baseType,
      color,
      icon,
      parentId: initial?.parentId ?? null,
      sortOrder: initial?.sortOrder ?? 0,
    })
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

function CategoryRow({
  cat, depth, assetCount, editingId, confirmId,
  onEdit, onDelete, onConfirmDelete, onCancelDelete,
  onSave, onCancelEdit,
}: {
  cat: AssetCategory; depth: number; assetCount: number
  editingId: string | null; confirmId: string | null
  onEdit: (id: string) => void; onDelete: (id: string) => void
  onConfirmDelete: () => void; onCancelDelete: () => void
  onSave: (d: Omit<AssetCategory, 'id' | 'isSystem'>) => void
  onCancelEdit: () => void
}) {
  const isParent = cat.parentId === null
  return (
    <>
      <div
        className={clsx(
          'grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0',
          isParent ? 'bg-gray-50 dark:bg-gray-800/40 px-4' : 'px-4'
        )}
        style={{ paddingLeft: `${16 + depth * 20}px` }}
      >
        <div className="flex items-center gap-2">
          {depth > 0 && <span className="text-gray-300 dark:text-gray-600 text-xs">└</span>}
          <SBadge color={cat.color} icon={cat.icon} name={cat.name} />
          {isParent && <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide ml-1">Overkat.</span>}
        </div>
        <span className="text-xs text-gray-400 w-14 text-right">{assetCount} enh.</span>
        <span className="w-16 text-center">
          {cat.isSystem && <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">System</span>}
        </span>
        <div className="flex items-center gap-1 w-14 justify-end">
          {confirmId === cat.id ? (
            <>
              <button onClick={onConfirmDelete} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Check size={12} /></button>
              <button onClick={onCancelDelete} className="p-1 text-gray-400 rounded"><X size={12} /></button>
            </>
          ) : (
            <>
              <button onClick={() => onEdit(cat.id)} className="p-1 text-gray-400 hover:text-blue-500 rounded"><Pencil size={12} /></button>
              {!cat.isSystem && (
                <button onClick={() => onDelete(cat.id)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 size={12} /></button>
              )}
            </>
          )}
        </div>
      </div>
      {editingId === cat.id && (
        <div className="px-4 pb-2 bg-white dark:bg-gray-900">
          <CategoryForm
            initial={cat}
            onSave={onSave}
            onCancel={onCancelEdit}
          />
        </div>
      )}
    </>
  )
}

function TabEnhedskategorier() {
  const { assetCategories, assets, createAssetCategory, updateAssetCategory, deleteAssetCategory } = useStore()
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [confirmId, setConfirmId]     = useState<string | null>(null)
  const [addParentForm, setAddParentForm] = useState(false)
  const [addChildFor, setAddChildFor] = useState<string | null>(null)
  const [expandedParents, setExpandedParents] = useState<Set<string>>(
    () => new Set(assetCategories.filter(c => c.parentId === null).map(c => c.id))
  )

  const countByCategory = assetCategories.reduce<Record<string, number>>((acc, c) => {
    acc[c.id] = assets.filter(a => a.categoryId === c.id).length
    return acc
  }, {})

  const parents = assetCategories
    .filter(c => c.parentId === null)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  function childrenOf(parentId: string) {
    return assetCategories
      .filter(c => c.parentId === parentId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  }

  function toggleParent(id: string) {
    setExpandedParents(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="max-w-2xl space-y-1">
      <p className="text-xs text-gray-500 mb-3">
        Kategorier er organiseret i overordnede kategorier med underkategorier. Enheder tildeles underkategorier.
      </p>

      {/* Add parent category form */}
      {addParentForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-3">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Ny overordnet kategori</p>
          <CategoryForm
            onSave={d => { createAssetCategory({ ...d, parentId: null }); setAddParentForm(false) }}
            onCancel={() => setAddParentForm(false)}
          />
        </div>
      )}

      {parents.map(parent => {
        const children = childrenOf(parent.id)
        const isExpanded = expandedParents.has(parent.id)
        const totalCount = countByCategory[parent.id] ?? 0 + children.reduce((s, c) => s + (countByCategory[c.id] ?? 0), 0)

        return (
          <div key={parent.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            {/* Parent header */}
            <div className="flex items-center px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 gap-2">
              <button
                onClick={() => toggleParent(parent.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              <SBadge color={parent.color} icon={parent.icon} name={parent.name} />
              <span className="text-[11px] text-gray-400 ml-1">{children.length} underkategorier</span>
              <div className="flex items-center gap-1 ml-auto">
                {confirmId === parent.id ? (
                  <>
                    <button onClick={() => { deleteAssetCategory(parent.id); setConfirmId(null) }} className="p-1 text-red-500 rounded"><Check size={12} /></button>
                    <button onClick={() => setConfirmId(null)} className="p-1 text-gray-400 rounded"><X size={12} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditingId(editingId === parent.id ? null : parent.id) }} className="p-1 text-gray-400 hover:text-blue-500 rounded"><Pencil size={12} /></button>
                    {!parent.isSystem && <button onClick={() => setConfirmId(parent.id)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 size={12} /></button>}
                  </>
                )}
              </div>
            </div>

            {editingId === parent.id && (
              <div className="px-4 pb-3 pt-2 border-b border-gray-100 dark:border-gray-800">
                <CategoryForm
                  initial={parent}
                  onSave={d => { updateAssetCategory(parent.id, d); setEditingId(null) }}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            )}

            {/* Children */}
            {isExpanded && (
              <div>
                {children.map(child => (
                  <CategoryRow
                    key={child.id}
                    cat={child}
                    depth={1}
                    assetCount={countByCategory[child.id] ?? 0}
                    editingId={editingId}
                    confirmId={confirmId}
                    onEdit={id => setEditingId(editingId === id ? null : id)}
                    onDelete={id => setConfirmId(id)}
                    onConfirmDelete={() => { deleteAssetCategory(child.id); setConfirmId(null) }}
                    onCancelDelete={() => setConfirmId(null)}
                    onSave={d => { updateAssetCategory(child.id, d); setEditingId(null) }}
                    onCancelEdit={() => setEditingId(null)}
                  />
                ))}

                {/* Add sub-category */}
                {addChildFor === parent.id ? (
                  <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Ny underkategori under <em>{parent.name}</em></p>
                    <CategoryForm
                      onSave={d => { createAssetCategory({ ...d, parentId: parent.id }); setAddChildFor(null) }}
                      onCancel={() => setAddChildFor(null)}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setAddChildFor(parent.id)}
                    className="w-full flex items-center gap-1.5 px-8 py-2 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors border-t border-gray-100 dark:border-gray-800"
                  >
                    <Plus size={12} /> Tilføj underkategori
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Add parent button */}
      {!addParentForm && (
        <button
          onClick={() => setAddParentForm(true)}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
        >
          <Plus size={14} /> Tilføj overordnet kategori
        </button>
      )}
    </div>
  )
}

// ─── Tab: Virksomhed & Logo ───────────────────────────────────────────────────

function TabVirksomhed() {
  const { companySettings, updateCompanySettings } = useStore()
  const [form, setForm] = useState({ ...companySettings })
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      setForm(f => ({ ...f, logo: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  function handleSave() {
    updateCompanySettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inp = 'w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500'

  return (
    <div className="max-w-2xl space-y-4">
      {/* Logo section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Firmalogo</h3>
        <div className="flex items-start gap-5">
          {/* Preview */}
          <div className="w-32 h-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800 shrink-0 overflow-hidden">
            {form.logo ? (
              <img src={form.logo} alt="Logo" className="max-w-full max-h-full object-contain p-1" />
            ) : (
              <Image size={24} className="text-gray-300 dark:text-gray-600" />
            )}
          </div>
          <div className="space-y-2 flex-1">
            <p className="text-xs text-gray-500">Upload et firmalogo (PNG, SVG eller JPG). Logoen vises i sidebar, topbar og på print.</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Upload size={13} /> Vælg fil
              </button>
              {form.logo && (
                <button
                  onClick={() => setForm(f => ({ ...f, logo: undefined }))}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Fjern logo
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            <div className="space-y-1.5 pt-1">
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={form.logoOnPrint}
                  onChange={e => setForm(f => ({ ...f, logoOnPrint: e.target.checked }))}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600"
                />
                Vis logo på printede arbejdsordrer
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={form.logoOnQR}
                  onChange={e => setForm(f => ({ ...f, logoOnQR: e.target.checked }))}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600"
                />
                Vis logo på QR-kode labels (valgfrit)
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Company info */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Virksomhedsoplysninger</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1"><Building2 size={11} /> Virksomhedsnavn</label>
            <input className={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Adresse</label>
            <input className={inp} value={form.address ?? ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">By / Postnummer</label>
            <div className="flex gap-2">
              <input className={inp} placeholder="By" value={form.city ?? ''} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              <input className={`${inp} w-24`} placeholder="8700" value={form.zip ?? ''} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1"><Phone size={11} /> Telefon</label>
            <input className={inp} value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1"><Mail size={11} /> E-mail</label>
            <input className={inp} value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1"><Hash size={11} /> CVR-nummer</label>
            <input className={inp} value={form.vatNumber ?? ''} onChange={e => setForm(f => ({ ...f, vatNumber: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1"><Globe size={11} /> Hjemmeside</label>
            <input className={inp} value={form.website ?? ''} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSave}
            className={clsx('flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors', saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700')}
          >
            <Save size={14} /> {saved ? 'Gemt!' : 'Gem ændringer'}
          </button>
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
  const { companySettings, updateCompanySettings } = useStore()
  const [form, setForm] = useState({
    defaultPriority:      companySettings.defaultPriority      ?? 'Normal',
    defaultDueDays:       companySettings.defaultDueDays        ?? 14,
    defaultWOType:        companySettings.defaultWOType         ?? 'Forebyggende',
    woNumberPrefix:       companySettings.woNumberPrefix        ?? 'AO-',
    defaultPMIntervalDays: companySettings.defaultPMIntervalDays ?? 30,
    pmWarningDays:        companySettings.pmWarningDays         ?? 7,
  })
  const [saved, setSaved] = useState(false)
  const inp = 'w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500'

  function save() {
    updateCompanySettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Arbejdsordre standardindstillinger</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Standard prioritet</label>
            <select
              className={inp}
              value={form.defaultPriority}
              onChange={e => setForm(f => ({ ...f, defaultPriority: e.target.value }))}
            >
              {['Normal', 'Lav', 'Høj', 'Kritisk'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Standard forfaldstid (dage)</label>
            <input
              type="number" min={1}
              className={inp}
              value={form.defaultDueDays}
              onChange={e => setForm(f => ({ ...f, defaultDueDays: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Standard vedligeholdelses type</label>
            <select
              className={inp}
              value={form.defaultWOType}
              onChange={e => setForm(f => ({ ...f, defaultWOType: e.target.value }))}
            >
              {['Forebyggende', 'Afhjælpende', 'Inspektion'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Auto-nummerering prefix</label>
            <input
              className={inp}
              value={form.woNumberPrefix}
              onChange={e => setForm(f => ({ ...f, woNumberPrefix: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          {saved && <span className="text-xs text-green-600 dark:text-green-400 font-medium mr-3 self-center">✓ Gemt</span>}
          <button onClick={save} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            <Save size={14} /> Gem ændringer
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Planlagt vedligehold standardindstillinger</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Standard interval (dage)</label>
            <input
              type="number" min={1}
              className={inp}
              value={form.defaultPMIntervalDays}
              onChange={e => setForm(f => ({ ...f, defaultPMIntervalDays: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Forfaldsvarsling (dage før)</label>
            <input
              type="number" min={0}
              className={inp}
              value={form.pmWarningDays}
              onChange={e => setForm(f => ({ ...f, pmWarningDays: Number(e.target.value) }))}
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          {saved && <span className="text-xs text-green-600 dark:text-green-400 font-medium mr-3 self-center">✓ Gemt</span>}
          <button onClick={save} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            <Save size={14} /> Gem ændringer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Gæsteportal ─────────────────────────────────────────────────────────

function TabGaesteportal() {
  const { companySettings, updateCompanySettings } = useStore()
  const [welcome, setWelcome] = useState(
    companySettings.guestPortalWelcome ?? 'Indsend en vedligeholdelsesanmodning her. Vores team behandler din anmodning hurtigst muligt.'
  )
  const [confirmation, setConfirmation] = useState(
    companySettings.guestPortalConfirmation ?? 'Tak for din anmodning! Vi har modtaget den og vender tilbage hurtigst muligt.'
  )
  const [saved, setSaved] = useState(false)
  const ta = 'w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none'

  function save() {
    updateCompanySettings({ guestPortalWelcome: welcome, guestPortalConfirmation: confirmation })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-xl">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Gæsteportal konfiguration</h3>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Velkomsttekst</label>
          <textarea
            rows={3}
            className={ta}
            value={welcome}
            onChange={e => setWelcome(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Bekræftelsestekst</label>
          <textarea
            rows={2}
            className={ta}
            value={confirmation}
            onChange={e => setConfirmation(e.target.value)}
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
        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Gemt</span>}
          <button onClick={save} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            <Save size={14} /> Gem ændringer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type TabId = 'system' | 'virksomhed' | 'enhedskategorier' | 'opslagstabeller' | 'vedligehold' | 'gaesteportal'

interface TabDef { id: TabId; label: string }

const TABS: TabDef[] = [
  { id: 'system',            label: 'System' },
  { id: 'virksomhed',        label: 'Virksomhed & Logo' },
  { id: 'enhedskategorier',  label: 'Enhedskategorier' },
  { id: 'opslagstabeller',   label: 'Opslagstabeller' },
  { id: 'vedligehold',       label: 'Vedligehold og AO' },
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
      {activeTab === 'virksomhed'       && <TabVirksomhed />}
      {activeTab === 'enhedskategorier' && <TabEnhedskategorier />}
      {activeTab === 'opslagstabeller'  && <TabOpslagstabeller />}
      {activeTab === 'vedligehold'      && <TabVedligehold />}
      {activeTab === 'gaesteportal'     && <TabGaesteportal />}
    </div>
  )
}
