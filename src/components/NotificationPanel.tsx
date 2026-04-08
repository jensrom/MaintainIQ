import { useNavigate } from 'react-router-dom'
import { Bell, AlertTriangle, ShoppingCart, MessageSquare, CalendarX, Package } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'
import type { AppNotification } from '../types'

function NotifIcon({ type }: { type: AppNotification['type'] }) {
  const cls = 'shrink-0'
  switch (type) {
    case 'overdue_wo': return <AlertTriangle size={15} className={clsx(cls, 'text-red-500')} />
    case 'new_request': return <MessageSquare size={15} className={clsx(cls, 'text-purple-500')} />
    case 'empty_stock': return <ShoppingCart size={15} className={clsx(cls, 'text-red-500')} />
    case 'low_stock': return <Package size={15} className={clsx(cls, 'text-amber-500')} />
    case 'overdue_pm': return <CalendarX size={15} className={clsx(cls, 'text-orange-500')} />
    default: return <Bell size={15} className={cls} />
  }
}

interface Props {
  onClose: () => void
}

export default function NotificationPanel({ onClose }: Props) {
  const getNotifications = useStore(s => s.getNotifications)
  const navigate = useNavigate()
  const notifications = getNotifications()

  function handleClick(n: AppNotification) {
    navigate(n.target)
    onClose()
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Notifikationer</h3>
        <span className="text-xs text-gray-400">{notifications.length} aktive</span>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            <Bell size={28} className="mx-auto mb-2 opacity-30" />
            Ingen aktive notifikationer
          </div>
        ) : (
          notifications.map(n => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0"
            >
              <div className="mt-0.5">
                <NotifIcon type={n.type} />
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{n.message}</p>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
