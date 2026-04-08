import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useStore } from '../store'
import NotificationPanel from './NotificationPanel'

export default function Topbar() {
  const [showNotifs, setShowNotifs] = useState(false)
  const getNotifications = useStore(s => s.getNotifications)
  const activeUserId = useStore(s => s.activeUserId)
  const users = useStore(s => s.users)
  const activeUser = users.find(u => u.id === activeUserId)
  const notifCount = getNotifications().length
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showNotifs) return
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showNotifs])

  return (
    <header className="h-12 flex items-center justify-between px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-blue-600 dark:text-blue-400 font-bold text-lg tracking-tight">MaintainIQ</span>
        <span className="hidden sm:block text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-widest mt-0.5">CMMS</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setShowNotifs(v => !v)}
            className="relative p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Bell size={18} />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                {notifCount > 99 ? '99+' : notifCount}
              </span>
            )}
          </button>
          {showNotifs && <NotificationPanel onClose={() => setShowNotifs(false)} />}
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center select-none">
            {activeUser?.initials ?? '?'}
          </div>
          <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
            {activeUser?.name.split(' ')[0]}
          </span>
        </div>
      </div>
    </header>
  )
}
