import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardList, MessageSquareMore, CalendarCheck,
  Calendar, BookOpen, MapPin, Package, Truck, ExternalLink,
  Settings, Users, Code2, ChevronLeft, ChevronRight, Building2,
} from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    title: 'Overblik',
    items: [
      { to: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    ],
  },
  {
    title: 'Vedligehold',
    items: [
      { to: '/arbejdsordrer', icon: <ClipboardList size={18} />, label: 'Arbejdsordrer' },
      { to: '/anmodninger', icon: <MessageSquareMore size={18} />, label: 'Anmodninger' },
      { to: '/planlagt', icon: <CalendarCheck size={18} />, label: 'Planlagt vedligehold' },
      { to: '/kalender', icon: <Calendar size={18} />, label: 'Kalender' },
      { to: '/logbog', icon: <BookOpen size={18} />, label: 'Logbog' },
    ],
  },
  {
    title: 'Site',
    items: [
      { to: '/site', icon: <Building2 size={18} />, label: 'Oversigt' },
    ],
  },
  {
    title: 'Lager & Leverandører',
    items: [
      { to: '/reservedele', icon: <Package size={18} />, label: 'Reservedele' },
      { to: '/leverandorer', icon: <Truck size={18} />, label: 'Leverandører' },
    ],
  },
  {
    title: 'Andet',
    items: [
      { to: '/gaesteportal', icon: <ExternalLink size={18} />, label: 'Gæsteportal' },
      { to: '/indstillinger', icon: <Settings size={18} />, label: 'Indstillinger' },
      { to: '/brugere', icon: <Users size={18} />, label: 'Brugerstyring' },
      { to: '/api', icon: <Code2 size={18} />, label: 'API Reference' },
    ],
  },
]

export default function Sidebar() {
  const collapsed = useStore(s => s.sidebarCollapsed)
  const setSidebarCollapsed = useStore(s => s.setSidebarCollapsed)

  return (
    <aside
      className={clsx(
        'flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-200',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Toggle button */}
      <div className="flex items-center justify-end px-2 py-2 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setSidebarCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={collapsed ? 'Udvid sidebar' : 'Fold sidebar ind'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-2 no-scrollbar">
        {NAV.map(group => (
          <div key={group.title} className="mb-1">
            {!collapsed && (
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {group.title}
              </p>
            )}
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2.5 px-3 py-2 mx-1 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
            {collapsed && <div className="my-1 mx-2 border-t border-gray-100 dark:border-gray-800" />}
          </div>
        ))}
      </nav>
    </aside>
  )
}
