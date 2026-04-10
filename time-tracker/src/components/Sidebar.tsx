import { NavLink } from 'react-router-dom';
import {
  Clock,
  LayoutDashboard,
  FolderOpen,
  Users,
  TrendingUp,
  Settings,
  Timer,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Registrering', icon: Clock },
  { to: '/dashboard', label: 'Timer Dashboard', icon: LayoutDashboard },
  { to: '/normtid', label: 'Normtid & Afspadsering', icon: TrendingUp },
  { to: '/sager', label: 'Sager', icon: FolderOpen },
  { to: '/kunder', label: 'Kunder', icon: Users },
  { to: '/indstillinger', label: 'Indstillinger', icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={clsx(
        'flex flex-col bg-gray-900 dark:bg-gray-950 text-white transition-all duration-200 shrink-0',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo / brand */}
      <div className="flex items-center h-14 px-4 border-b border-gray-800">
        <div className="flex items-center gap-2 overflow-hidden">
          <Timer size={20} className="text-blue-400 shrink-0" />
          {!collapsed && (
            <span className="text-sm font-semibold text-white whitespace-nowrap">
              TimeTracker
            </span>
          )}
        </div>
        {!collapsed && <div className="flex-1" />}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
        <ul className="space-y-0.5 px-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  )
                }
                title={collapsed ? label : undefined}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && (
                  <span className="whitespace-nowrap truncate">{label}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-gray-800 p-2">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          title={collapsed ? 'Udvid menu' : 'Skjul menu'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
