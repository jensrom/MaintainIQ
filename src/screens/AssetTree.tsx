import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'
import type { AssetType, Asset } from '../types'

const TYPE_COLORS: Record<AssetType, string> = {
  Site: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Lokation: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Enhed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Værktøj: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}
const CRITICALITY_COLORS: Record<string, string> = {
  Kritisk: 'text-red-500',
  Høj: 'text-orange-500',
  Normal: 'text-blue-500',
  Lav: 'text-gray-400',
}

const TYPE_ORDER: AssetType[] = ['Site', 'Lokation', 'Enhed', 'Værktøj']

function AssetRow({
  asset,
  depth,
  expandedIds,
  onToggle,
  hasChildren,
  activeWOCount,
}: {
  asset: Asset
  depth: number
  expandedIds: Set<string>
  onToggle: (id: string) => void
  hasChildren: boolean
  activeWOCount: number
}) {
  const isExpanded = expandedIds.has(asset.id)
  return (
    <tr className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <td className="px-4 py-2.5">
        <div className="flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
          <button
            onClick={() => hasChildren && onToggle(asset.id)}
            className={clsx('w-5 h-5 flex items-center justify-center mr-1.5 text-gray-400', !hasChildren && 'invisible')}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{asset.name}</span>
        </div>
      </td>
      <td className="px-4 py-2.5">
        <span className={clsx('text-[10px] px-2 py-0.5 rounded font-medium', TYPE_COLORS[asset.type])}>{asset.type}</span>
      </td>
      <td className="px-4 py-2.5">
        <span className={clsx('text-xs font-medium', CRITICALITY_COLORS[asset.criticality])}>{asset.criticality}</span>
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
      <td className="px-4 py-2.5 text-xs text-gray-400 dark:text-gray-500">{asset.location}</td>
    </tr>
  )
}

export default function AssetTree() {
  const { assets, workOrders } = useStore()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(['a0', 'a1', 'a2', 'a3', 'a4']))
  const [filterType, setFilterType] = useState<AssetType | null>(null)

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<AssetType, number>> = {}
    assets.forEach(a => { counts[a.type] = (counts[a.type] ?? 0) + 1 })
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

  // Build flat list respecting hierarchy and expansion
  function buildRows(parentId: string | null, depth: number): { asset: Asset; depth: number }[] {
    const children = assets
      .filter(a => a.parentId === parentId)
      .sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type))
    const rows: { asset: Asset; depth: number }[] = []
    for (const asset of children) {
      if (filterType && asset.type !== filterType) {
        // Still recurse to show children if needed
        const childRows = buildRows(asset.id, depth + 1)
        rows.push(...childRows)
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

  // When filter is active, show all of that type flat
  const rows = filterType
    ? assets.filter(a => a.type === filterType).map(a => ({ asset: a, depth: 0 }))
    : buildRows(null, 0)

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Oversigt</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Aktivtræ — {assets.length} aktiver i alt</p>
      </div>

      {/* Status filter bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilterType(null)}
          className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', filterType === null ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700')}
        >
          Vis alle ({assets.length})
        </button>
        {TYPE_ORDER.map(type => (
          <button
            key={type}
            onClick={() => setFilterType(filterType === type ? null : type)}
            className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', TYPE_COLORS[type], filterType === type && 'ring-2 ring-offset-1 ring-current')}
          >
            {typeCounts[type] ?? 0} {type.toLowerCase()}{(typeCounts[type] ?? 0) !== 1 ? 'r' : ''}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500">Navn</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500">Type</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500">Kritikalitet</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500">Aktive AO</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500">Lokation</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">Ingen aktiver</td></tr>
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
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
