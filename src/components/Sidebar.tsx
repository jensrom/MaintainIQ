import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardList, MessageSquareMore, CalendarCheck,
  Calendar, BookOpen, Package, Truck, ExternalLink,
  Settings, SlidersHorizontal, Users, Code2, Building2,
  BarChart2, Activity, ShieldCheck, ChevronRight, ChevronDown,
  LogOut, Shield, UserCog, Bell,
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
      { to: '/', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    ],
  },
  {
    title: 'Vedligehold',
    items: [
      { to: '/arbejdsordrer',  icon: <ClipboardList size={16} />,    label: 'Arbejdsordrer' },
      { to: '/anmodninger',    icon: <MessageSquareMore size={16} />, label: 'Anmodninger' },
      { to: '/planlagt',       icon: <CalendarCheck size={16} />,     label: 'Planlagt vedligehold' },
      { to: '/kalender',       icon: <Calendar size={16} />,          label: 'Kalender' },
      { to: '/logbog',         icon: <BookOpen size={16} />,          label: 'Logbog' },
    ],
  },
  {
    title: 'Site',
    items: [
      { to: '/site', icon: <Building2 size={16} />, label: 'Oversigt' },
    ],
  },
  {
    title: 'Lager & Leverandører',
    items: [
      { to: '/reservedele',    icon: <Package size={16} />, label: 'Reservedele' },
      { to: '/leverandorer',   icon: <Truck size={16} />,   label: 'Leverandører' },
    ],
  },
  {
    title: 'Rapporter',
    items: [
      { to: '/analysevaerktoj', icon: <BarChart2 size={16} />,  label: 'Analyseværktøj' },
      { to: '/audit',           icon: <Activity size={16} />,   label: 'Audit Trail' },
    ],
  },
]

const SETTINGS_ITEMS: NavItem[] = [
  { to: '/gaesteportal',       icon: <ExternalLink size={16} />,      label: 'Gæsteportal' },
  { to: '/indstillinger',      icon: <Settings size={16} />,          label: 'Indstillinger' },
  { to: '/cmms-indstillinger', icon: <SlidersHorizontal size={16} />, label: 'CMMS Indstillinger' },
  { to: '/brugere',            icon: <Users size={16} />,             label: 'Brugere' },
  { to: '/brugergrupper',      icon: <Shield size={16} />,            label: 'Brugergrupper' },
  { to: '/api',                icon: <Code2 size={16} />,             label: 'API Reference' },
]

function NavItemLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-2.5 px-3 py-1.5 mx-2 rounded text-[13px] transition-colors duration-100',
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-slate-400 hover:bg-slate-700/60 hover:text-slate-100'
        )
      }
      title={collapsed ? item.label : undefined}
    >
      <span className="shrink-0">{item.icon}</span>
      {!collapsed && <span className="truncate leading-tight">{item.label}</span>}
    </NavLink>
  )
}

export default function Sidebar() {
  const collapsed = useStore(s => s.sidebarCollapsed)
  const setSidebarCollapsed = useStore(s => s.setSidebarCollapsed)
  const logout = useStore(s => s.logout)
  const auth = useStore(s => s.auth)
  const users = useStore(s => s.users)
  const companySettings = useStore(s => s.companySettings)
  const navigate = useNavigate()

  const activeUser = auth ? users.find(u => u.id === auth.userId) : null
  const [settingsOpen, setSettingsOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={clsx(
        'flex flex-col h-full bg-[#1a2035] border-r border-slate-800 transition-all duration-200 select-none',
        collapsed ? 'w-[52px]' : 'w-[210px]'
      )}
    >
      {/* ── Logo area ── */}
      <div
        className={clsx(
          'flex items-center border-b border-slate-700/50 shrink-0',
          collapsed ? 'justify-center h-12' : 'gap-2.5 px-3 h-12'
        )}
      >
        {companySettings.logo ? (
          <img
            src={companySettings.logo}
            alt={companySettings.name}
            className={clsx('object-contain', collapsed ? 'h-7 w-7' : 'h-7 max-w-[120px]')}
          />
        ) : (
          <>
            <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm leading-none">M</span>
            </div>
            {!collapsed && (
              <span className="text-white font-semibold text-sm tracking-tight truncate">MaintainIQ</span>
            )}
          </>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-2 no-scrollbar">
        {NAV.map(group => (
          <div key={group.title} className="mb-1">
            {!collapsed && (
              <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {group.title}
              </p>
            )}
            {collapsed && <div className="my-1.5 mx-3 border-t border-slate-700/40" />}
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavItemLink key={item.to} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}

        {/* ── Indstillinger group (collapsible) ── */}
        <div className="mb-1">
          {!collapsed && (
            <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Indstillinger
            </p>
          )}
          {collapsed && <div className="my-1.5 mx-3 border-t border-slate-700/40" />}

          {collapsed ? (
            <div className="space-y-0.5">
              {SETTINGS_ITEMS.map(item => (
                <NavItemLink key={item.to} item={item} collapsed={true} />
              ))}
            </div>
          ) : (
            <>
              <button
                onClick={() => setSettingsOpen(v => !v)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 mx-0 rounded text-[13px] text-slate-400 hover:bg-slate-700/60 hover:text-slate-100 transition-colors"
              >
                <Settings size={16} className="shrink-0 ml-2" />
                <span className="flex-1 text-left truncate leading-tight">Indstillinger</span>
                {settingsOpen
                  ? <ChevronDown size={12} className="text-slate-500 shrink-0" />
                  : <ChevronRight size={12} className="text-slate-500 shrink-0" />
                }
              </button>

              {settingsOpen && (
                <div className="ml-2 border-l border-slate-700/50 pl-2 space-y-0.5 mb-1">
                  {SETTINGS_ITEMS.map(item => (
                    <NavItemLink key={item.to} item={item} collapsed={false} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </nav>

      {/* ── Bottom: User + Logout + Collapse toggle ── */}
      <div className="border-t border-slate-700/50 shrink-0">
        {auth && !collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
              {activeUser?.initials ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-slate-200 truncate leading-tight">{activeUser?.name ?? '—'}</p>
              <p className="text-[10px] text-slate-500 truncate leading-tight">{activeUser?.title ?? ''}</p>
            </div>
          </div>
        )}

        <div className={clsx('flex items-center', collapsed ? 'flex-col gap-1 py-2' : 'px-3 pb-2 gap-1')}>
          {collapsed && auth && (
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center mb-1">
              {activeUser?.initials ?? '?'}
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Log ud"
            className={clsx(
              'p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700/50 transition-colors',
              !collapsed && 'ml-auto'
            )}
          >
            <LogOut size={15} />
          </button>
          <button
            onClick={() => setSidebarCollapsed(!collapsed)}
            className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors"
            title={collapsed ? 'Udvid sidebar' : 'Fold ind'}
          >
            <ChevronRight
              size={15}
              className={clsx('transition-transform duration-200', !collapsed && 'rotate-180')}
            />
          </button>
        </div>
      </div>
    </aside>
  )
}
