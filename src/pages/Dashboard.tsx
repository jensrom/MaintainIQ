import { ClipboardList, Wrench, AlertTriangle, CheckCircle2, TrendingUp, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const stats = [
  { label: 'Open Work Orders', value: '24', delta: '+3 today', icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Assets Tracked', value: '186', delta: '12 critical', icon: Wrench, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { label: 'Overdue Tasks', value: '7', delta: 'Needs attention', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Completed (30d)', value: '63', delta: '+18% vs last month', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
]

const recentWorkOrders = [
  { id: 'WO-1042', title: 'HVAC Filter Replacement — Building A', priority: 'High', status: 'In Progress', assignee: 'Sam R.', due: 'Today' },
  { id: 'WO-1041', title: 'Conveyor Belt Inspection — Line 3', priority: 'Medium', status: 'Open', assignee: 'Lee K.', due: 'Apr 10' },
  { id: 'WO-1040', title: 'Boiler Pressure Check', priority: 'High', status: 'Overdue', assignee: 'Sam R.', due: 'Apr 5' },
  { id: 'WO-1039', title: 'Fire Suppression Test', priority: 'Low', status: 'Completed', assignee: 'Jordan M.', due: 'Apr 7' },
  { id: 'WO-1038', title: 'Generator PM Service', priority: 'Medium', status: 'Completed', assignee: 'Lee K.', due: 'Apr 6' },
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

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name.split(' ')[0]}</h1>
        <p className="text-gray-500 text-sm mt-1">Here's what's happening in your facility today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500 font-medium">{s.label}</p>
              <div className={`${s.bg} ${s.color} p-2 rounded-lg`}>
                <s.icon size={18} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.delta}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-8">
        {/* Placeholder chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Work Order Trend</h2>
            <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <TrendingUp size={14} />
              18% this month
            </div>
          </div>
          {/* Simple bar chart placeholder */}
          <div className="flex items-end gap-2 h-32">
            {[40, 65, 52, 78, 60, 85, 63].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-brand-500 rounded-t-md opacity-80"
                  style={{ height: `${h}%` }}
                />
                <span className="text-xs text-gray-400">
                  {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Upcoming PMs</h2>
          <ul className="space-y-3">
            {[
              { title: 'Air Compressor PM', date: 'Apr 9', urgent: true },
              { title: 'Chiller Inspection', date: 'Apr 12', urgent: false },
              { title: 'Forklift Service', date: 'Apr 15', urgent: false },
              { title: 'Sprinkler Test', date: 'Apr 18', urgent: false },
            ].map((pm) => (
              <li key={pm.title} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pm.urgent ? 'bg-amber-400' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{pm.title}</p>
                </div>
                <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                  <Clock size={11} />
                  {pm.date}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent Work Orders */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Work Orders</h2>
          <a href="/work-orders" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            View all
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentWorkOrders.map((wo) => (
                <tr key={wo.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{wo.id}</td>
                  <td className="px-5 py-3.5 text-gray-800 font-medium">{wo.title}</td>
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
                  <td className="px-5 py-3.5 text-gray-500">{wo.assignee}</td>
                  <td className="px-5 py-3.5 text-gray-500">{wo.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
