import { useState, useMemo } from 'react'
import {
  ChevronRight, ChevronDown, Plus, X, MapPin, Cog,
  Wrench, Factory, Box, Settings2,
} from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'
import type { Asset, AssetType, AssetCategory } from '../types'
import AssetDetailPanel from '../components/AssetDetailPanel'

// ─── helpers ──────────────────────────────────────────────────────────────────

const TYPE_ORDER: AssetType[] = ['Site', 'Lokation', 'Enhed', 'Værktøj']

const CRITICALITY_COLORS: Record<string, string> = {
  Kritisk: 'text-red-500',
  Høj: 'text-orange-500',
  Normal: 'text-blue-500',
  Lav: 'text-gray-400',
}

const COLOR_CLASSES: Record<string, string> = {
  blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  amber:  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  gray:   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  slate:  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  green:  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  red:    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const ICON_MAP: Record<string, React.ReactNode> = {
  MapPin:   <MapPin size={11} />,
  Factory:  <Factory size={11} />,
  Cog:      <Cog size={11} />,
  Settings2:<Settings2 size={11} />,
  Wrench:   <Wrench size={11} />,
  Box:      <Box size={11} />,
}

// ─── New Asset Form ────────────────────────────────────────────────────────────

function NewAssetForm({
  assets,
  categories,
  onClose,
  onCreate,
}: {
  assets: Asset[]
  categories: AssetCategory[]
  onClose: () => void
  onCreate: (a: Omit<Asset, 'id' | 'createdAt'>) => void
}) {
  const [name, setName]           = useState('')
  const [code, setCode]           = useState('')
  const [type, setType]           = useState<AssetType>('Enhed')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [parentId, setParentId]   = useState<string>('')
  const [criticality, setCriticality] = useState<Asset['criticality']>('Normal')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !code.trim()) return
    onCreate({
      name: name.trim(),
      code: code.trim(),
      type,
      categoryId,
      parentId: parentId || null,
      criticality,
      location: assets.find(a => a.id === parentId)?.name ?? '',
      status: 'online',
      description: '',
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative z-10 bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Ny enhed</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Navn *</label>
            <input
              className="w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={name} onChange={e => setName(e.target.value)} required placeholder="Kompressor KOM-003"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Kode *</label>
            <input
              className="w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={code} onChange={e => setCode(e.target.value)} required placeholder="KOM-003"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select
              className="w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={type} onChange={e => setType(e.target.value as AssetType)}
            >
              {TYPE_ORDER.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Kategori</label>
            <select
              className="w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={categoryId} onChange={e => setCategoryId(e.target.value)}
            >
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Overordnet enhed</label>
            <select
              className="w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={parentId} onChange={e => setParentId(e.target.value)}
            >
              <option value="">— ingen (rod) —</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Kritikalitet</label>
            <select
              className="w-full border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={criticality} onChange={e => setCriticality(e.target.value as Asset['criticality'])}
            >
              {(['Kritisk', 'Høj', 'Normal', 'Lav'] as const).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            Annuller
          </button>
          <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Opret enhed
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Asset Row ─────────────────────────────────────────────────────────────────

function AssetRow({
  asset,
  depth,
  expandedIds,
  onToggle,
  hasChildren,
  activeWOCount,
  category,
  onClick,
}: {
  asset: Asset
  depth: number
  expandedIds: Set<string>
  onToggle: (id: string) => void
  hasChildren: boolean
  activeWOCount: number
  category: AssetCategory | undefined
  onClick: () => void
}) {
  const isExpanded = expandedIds.has(asset.id)
  const colorCls = COLOR_CLASSES[category?.color ?? 'gray']

  return (
    <tr
      className="border-b border-gray-50 dark:border-gray-800 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 cursor-pointer group"
      onClick={onClick}
    >
      <td className="px-4 py-2.5">
        <div className="flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
          <button
            onClick={e => { e.stopPropagation(); hasChildren && onToggle(asset.id) }}
            className={clsx('w-5 h-5 flex items-center justify-center mr-1.5 text-gray-400', !hasChildren && 'invisible')}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <span className="font-medium text-sm text-gray-800 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">
            {asset.name}
          </span>
        </div>
      </td>
      <td className="px-4 py-2.5">
        <span className={clsx('inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium', colorCls)}>
          {category && ICON_MAP[category.icon]}
          {category?.name ?? asset.type}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <span className={clsx('text-xs font-medium', CRITICALITY_COLORS[asset.criticality])}>
          {asset.criticality}
        </span>
      </td>
      <td className="px-4 py-2.5">
        {activeWOCount > 0 ? (
          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-medium">
            {activeWOCount} aktive
          </span>
        ) : (
          <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
        )}
      </td>
      <td className="px-4 py-2.5">
        <span className={clsx(
          'text-[10px] px-1.5 py-0.5 rounded font-medium',
          asset.status === 'online'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
        )}>
          {asset.status === 'online' ? 'Online' : 'Offline'}
        </span>
      </td>
      <td className="px-4 py-2.5 text-xs text-gray-400 dark:text-gray-500 font-mono">{asset.code}</td>
    </tr>
  )
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function AssetTree() {
  const { assets, assetCategories, workOrders, createAsset } = useStore()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(['a0', 'a1', 'a2', 'a3', 'a4'])
  )
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    assets.forEach(a => { counts[a.categoryId] = (counts[a.categoryId] ?? 0) + 1 })
    return counts
  }, [assets])

  const activeWOByAsset = useMemo(() => {
    const counts: Record<string, number> = {}
    workOrders
      .filter(wo => !['Afsluttet', 'Annulleret'].includes(wo.status))
      .forEach(wo => { counts[wo.assetId] = (counts[wo.assetId] ?? 0) + 1 })
    return counts
  }, [workOrders])

  function toggle(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function buildRows(parentId: string | null, depth: number): { asset: Asset; depth: number }[] {
    const children = assets
      .filter(a => a.parentId === parentId)
      .sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type))
    const rows: { asset: Asset; depth: number }[] = []
    for (const asset of children) {
      if (filterCategoryId && asset.categoryId !== filterCategoryId) {
        if (expandedIds.has(asset.id)) {
          rows.push(...buildRows(asset.id, depth + 1))
        }
        continue
      }
      rows.push({ asset, depth })
      const hasChildren = assets.some(a => a.parentId === asset.id)
      if (hasChildren && expandedIds.has(asset.id)) {
        rows.push(...buildRows(asset.id, depth + 1))
      }
    }
    return rows
  }

  const rows = filterCategoryId
    ? assets.filter(a => a.categoryId === filterCategoryId).map(a => ({ asset: a, depth: 0 }))
    : buildRows(null, 0)

  // Keep selected asset in sync after edits
  const liveSelectedAsset = selectedAsset
    ? assets.find(a => a.id === selectedAsset.id) ?? null
    : null

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Oversigt</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Aktivtræ — {assets.length} aktiver i alt</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          <Plus size={15} />
          Ny enhed
        </button>
      </div>

      {/* Category filter bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilterCategoryId(null)}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            filterCategoryId === null
              ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          Vis alle ({assets.length})
        </button>
        {assetCategories.map(cat => {
          const count = categoryCounts[cat.id] ?? 0
          if (count === 0) return null
          return (
            <button
              key={cat.id}
              onClick={() => setFilterCategoryId(filterCategoryId === cat.id ? null : cat.id)}
              className={clsx(
                'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                COLOR_CLASSES[cat.color],
                filterCategoryId === cat.id && 'ring-2 ring-offset-1 ring-current'
              )}
            >
              {ICON_MAP[cat.icon]}
              {count} {cat.name.toLowerCase()}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500">Navn</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500">Kategori</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500">Kritikalitet</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500">Aktive AO</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500">Kode</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">Ingen aktiver</td></tr>
              ) : (
                rows.map(({ asset, depth }) => (
                  <AssetRow
                    key={asset.id}
                    asset={asset}
                    depth={depth}
                    expandedIds={expandedIds}
                    onToggle={toggle}
                    hasChildren={assets.some(a => a.parentId === asset.id)}
                    activeWOCount={activeWOByAsset[asset.id] ?? 0}
                    category={assetCategories.find(c => c.id === asset.categoryId)}
                    onClick={() => setSelectedAsset(asset)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {liveSelectedAsset && (
        <AssetDetailPanel
          asset={liveSelectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}

      {/* New asset form */}
      {showNewForm && (
        <NewAssetForm
          assets={assets}
          categories={assetCategories}
          onClose={() => setShowNewForm(false)}
          onCreate={createAsset}
        />
      )}
    </div>
  )
}
