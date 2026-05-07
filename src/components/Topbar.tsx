import { useState, useRef, useEffect, useMemo } from 'react'
import { Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import NotificationPanel from './NotificationPanel'

export default function Topbar() {
  const [showNotifs, setShowNotifs]     = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Subscribe to all data slices that getNotifications depends on,
  // so the badge re-renders reactively when any of them changes.
  const getNotifications = useStore(s => s.getNotifications)
  const auth             = useStore(s => s.auth)
  const users            = useStore(s => s.users)
  const companySettings  = useStore(s => s.companySettings)
  const logout           = useStore(s => s.logout)
  const navigate         = useNavigate()

  const workOrders   = useStore(s => s.workOrders)
  const spareParts   = useStore(s => s.spareParts)
  const pmTasks      = useStore(s => s.pmTasks)
  const deviations   = useStore(s => s.deviations)
  const capaRecords  = useStore(s => s.capaRecords)
  const changeRecords = useStore(s => s.changeRecords)
  const settings     = useStore(s => s.settings)

  const activeUser = auth ? users.find(u => u.id === auth.userId) : null

  // Recompute badge count whenever any underlying data changes
  const notifCount = useMemo(
    () => getNotifications().length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workOrders, spareParts, pmTasks, deviations, capaRecords, changeRecords, settings, getNotifications]
  )

  const panelRef   = useRef<HTMLDivElement>(null)
  const userRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showNotifs && !showUserMenu) return
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setShowNotifs(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showNotifs, showUserMenu])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-11 flex items-center justify-between px-4 bg-white dark:bg-[#1a2035] border-b border-slate-200 dark:border-slate-700/60 shrink-0">
      {/* Left: breadcrumb / page context (empty — sidebar has logo) */}
      <div className="flex items-center gap-2">
        {companySettings.logo ? (
          <img src={companySettings.logo} alt={companySettings.name} className="h-6 object-contain block dark:hidden" />
        ) : (
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 hidden sm:block">
            {companySettings.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {/* Bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setShowNotifs(v => !v)}
            className="relative p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
          >
            <Bell size={17} />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                {notifCount > 99 ? '99+' : notifCount}
              </span>
            )}
          </button>
          {showNotifs && <NotificationPanel onClose={() => setShowNotifs(false)} />}
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(v => !v)}
            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center select-none">
              {activeUser?.initials ?? '?'}
            </div>
            <span className="hidden sm:block text-[13px] font-medium text-slate-700 dark:text-slate-200">
              {activeUser?.name?.split(' ')[0] ?? 'Bruger'}
            </span>
            <ChevronDown size={12} className="text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden">
              {/* User info */}
              <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{activeUser?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{activeUser?.email}</p>
              </div>
              <div className="py-1">
                <NavLink
                  to="/brugere"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <User size={13} /> Min profil
                </NavLink>
                <NavLink
                  to="/indstillinger"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Settings size={13} /> Indstillinger
                </NavLink>
              </div>
              <div className="py-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut size={13} /> Log ud
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
