import { useState } from 'react'
import { Plus, Search, Filter } from 'lucide-react'

interface WorkOrder {
  id: string
  title: string
  description: string
  priority: 'High' | 'Medium' | 'Low'
  status: 'Open' | 'In Progress' | 'Completed' | 'Overdue'
  assignee: string
  asset: string
  due: string
  created: string
}

const initialWorkOrders: WorkOrder[] = [
  { id: 'WO-1042', title: 'HVAC Filter Replacement', description: 'Replace all filters in Building A HVAC system.', priority: 'High', status: 'In Progress', assignee: 'Sam Rivera', asset: 'HVAC-A1', due: 'Apr 8, 2026', created: 'Apr 5, 2026' },
  { id: 'WO-1041', title: 'Conveyor Belt Inspection — Line 3', description: 'Full inspection per quarterly PM schedule.', priority: 'Medium', status: 'Open', assignee: 'Lee Kim', asset: 'CONV-03', due: 'Apr 10, 2026', created: 'Apr 4, 2026' },
  { id: 'WO-1040', title: 'Boiler Pressure Check', description: 'Inspect pressure relief valves and gauges.', priority: 'High', status: 'Overdue', assignee: 'Sam Rivera', asset: 'BOILER-1', due: 'Apr 5, 2026', created: 'Apr 1, 2026' },
  { id: 'WO-1039', title: 'Fire Suppression Test', description: 'Annual fire suppression system functional test.', priority: 'Low', status: 'Completed', assignee: 'Jordan Mills', asset: 'FIRE-SYS', due: 'Apr 7, 2026', created: 'Mar 28, 2026' },
  { id: 'WO-1038', title: 'Generator PM Service', description: 'Oil change, filter, and load bank test.', priority: 'Medium', status: 'Completed', assignee: 'Lee Kim', asset: 'GEN-01', due: 'Apr 6, 2026', created: 'Mar 27, 2026' },
  { id: 'WO-1037', title: 'Chiller Unit Leak Check', description: 'Inspect refrigerant lines for leaks.', priority: 'High', status: 'Open', assignee: 'Sam Rivera', asset: 'CHILL-2', due: 'Apr 12, 2026', created: 'Apr 6, 2026' },
  { id: 'WO-1036', title: 'Lighting Replacement — Warehouse B', description: 'Replace fluorescent fixtures with LED.', priority: 'Low', status: 'Open', assignee: 'Jordan Mills', asset: 'LIGHT-WB', due: 'Apr 20, 2026', created: 'Apr 3, 2026' },
]

const priorityBadge: Record<string, string> = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-gray-100 text-gray-600',
}

const statusBadge: Record<string, string> = {
  Open: 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-indigo-100 text-indigo-700',
  Overdue: 'bg-red-100 text-red-700',
  Completed: 'bg-green-100 text-green-700',
}

const ALL_STATUSES = ['All', 'Open', 'In Progress', 'Overdue', 'Completed']

export default function WorkOrders() {
  const [workOrders] = useState<WorkOrder[]>(initialWorkOrders)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = workOrders.filter((wo) => {
    const matchesSearch =
      wo.title.toLowerCase().includes(search.toLowerCase()) ||
      wo.id.toLowerCase().includes(search.toLowerCase()) ||
      wo.assignee.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || wo.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
          <p className="text-gray-500 text-sm mt-1">{workOrders.length} total work orders</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={16} />
          New Work Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-56 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search work orders…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <Filter size={14} className="text-gray-400 ml-2" />
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                statusFilter === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-sm">
                    No work orders match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((wo) => (
                  <tr key={wo.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{wo.id}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800">{wo.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{wo.description}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{wo.asset}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityBadge[wo.priority]}`}>
                        {wo.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[wo.status]}`}>
                        {wo.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{wo.assignee}</td>
                    <td className="px-5 py-3.5 text-gray-500">{wo.due}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
            Showing {filtered.length} of {workOrders.length} work orders
          </div>
        )}
      </div>
    </div>
  )
}
