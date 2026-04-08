import { useState } from 'react'
import { Plus, Search, Wrench, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'

interface Asset {
  id: string
  name: string
  category: string
  location: string
  status: 'Operational' | 'Maintenance' | 'Critical' | 'Offline'
  lastService: string
  nextService: string
  openWorkOrders: number
}

const assets: Asset[] = [
  { id: 'HVAC-A1', name: 'HVAC Unit — Building A', category: 'HVAC', location: 'Building A, Roof', status: 'Maintenance', lastService: 'Mar 15, 2026', nextService: 'Jun 15, 2026', openWorkOrders: 1 },
  { id: 'BOILER-1', name: 'Main Boiler #1', category: 'Plumbing', location: 'Mechanical Room 1', status: 'Critical', lastService: 'Jan 10, 2026', nextService: 'Apr 10, 2026', openWorkOrders: 2 },
  { id: 'CONV-03', name: 'Conveyor Belt — Line 3', category: 'Production', location: 'Warehouse B, Line 3', status: 'Operational', lastService: 'Feb 28, 2026', nextService: 'May 28, 2026', openWorkOrders: 1 },
  { id: 'GEN-01', name: 'Emergency Generator', category: 'Electrical', location: 'Utility Room', status: 'Operational', lastService: 'Apr 6, 2026', nextService: 'Jul 6, 2026', openWorkOrders: 0 },
  { id: 'CHILL-2', name: 'Chiller Unit #2', category: 'HVAC', location: 'Mechanical Room 2', status: 'Critical', lastService: 'Dec 1, 2025', nextService: 'Mar 1, 2026', openWorkOrders: 1 },
  { id: 'FIRE-SYS', name: 'Fire Suppression System', category: 'Safety', location: 'All Buildings', status: 'Operational', lastService: 'Apr 7, 2026', nextService: 'Apr 7, 2027', openWorkOrders: 0 },
  { id: 'COMP-01', name: 'Air Compressor #1', category: 'Production', location: 'Shop Floor', status: 'Operational', lastService: 'Mar 1, 2026', nextService: 'Apr 9, 2026', openWorkOrders: 0 },
  { id: 'LIGHT-WB', name: 'Lighting System — Warehouse B', category: 'Electrical', location: 'Warehouse B', status: 'Maintenance', lastService: 'Jan 20, 2026', nextService: 'N/A', openWorkOrders: 1 },
  { id: 'ELEV-1', name: 'Passenger Elevator', category: 'Vertical Transport', location: 'Main Building', status: 'Operational', lastService: 'Feb 15, 2026', nextService: 'May 15, 2026', openWorkOrders: 0 },
  { id: 'PUMP-03', name: 'Cooling Tower Pump #3', category: 'Plumbing', location: 'Cooling Tower', status: 'Offline', lastService: 'Nov 5, 2025', nextService: 'TBD', openWorkOrders: 0 },
]

const statusConfig: Record<string, { badge: string; icon: React.ReactNode }> = {
  Operational: { badge: 'bg-green-100 text-green-700', icon: <CheckCircle2 size={14} /> },
  Maintenance: { badge: 'bg-amber-100 text-amber-700', icon: <Wrench size={14} /> },
  Critical: { badge: 'bg-red-100 text-red-700', icon: <AlertTriangle size={14} /> },
  Offline: { badge: 'bg-gray-100 text-gray-600', icon: <Clock size={14} /> },
}

const ALL_CATEGORIES = ['All', ...Array.from(new Set(assets.map((a) => a.category))).sort()]

export default function Assets() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  const filtered = assets.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.location.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'All' || a.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const statusCounts = {
    Operational: assets.filter((a) => a.status === 'Operational').length,
    Maintenance: assets.filter((a) => a.status === 'Maintenance').length,
    Critical: assets.filter((a) => a.status === 'Critical').length,
    Offline: assets.filter((a) => a.status === 'Offline').length,
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
          <p className="text-gray-500 text-sm mt-1">{assets.length} assets registered</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={16} />
          Add Asset
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {(Object.entries(statusCounts) as [string, number][]).map(([status, count]) => {
          const cfg = statusConfig[status]
          return (
            <div key={status} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className={`${cfg.badge} p-2 rounded-lg`}>{cfg.icon}</div>
              <div>
                <p className="text-xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">{status}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-56 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search assets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          {ALL_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Asset ID</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Last Service</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Next Service</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Open WOs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-gray-400 text-sm">
                    No assets match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((asset) => {
                  const cfg = statusConfig[asset.status]
                  return (
                    <tr key={asset.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{asset.id}</td>
                      <td className="px-5 py-3.5 font-medium text-gray-800">{asset.name}</td>
                      <td className="px-5 py-3.5 text-gray-500">{asset.category}</td>
                      <td className="px-5 py-3.5 text-gray-500">{asset.location}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>
                          {cfg.icon}
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{asset.lastService}</td>
                      <td className="px-5 py-3.5 text-gray-500">{asset.nextService}</td>
                      <td className="px-5 py-3.5">
                        {asset.openWorkOrders > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {asset.openWorkOrders}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
            Showing {filtered.length} of {assets.length} assets
          </div>
        )}
      </div>
    </div>
  )
}
