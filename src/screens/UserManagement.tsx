import { Mail, Phone, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'

const ROLE_COLORS: Record<string, string> = {
  'Vedligeholdstekniker': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Senior Tekniker': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  'Planlægger': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  'Driftsleder': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'Kvalitetschef': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-indigo-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500',
]

export default function UserManagement() {
  const { users, activeUserId, setActiveUser } = useStore()

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Brugerstyring</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {users.length} brugere · Klik på en bruger for at skifte aktiv bruger
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user, idx) => {
          const isActive = user.id === activeUserId
          return (
            <div
              key={user.id}
              onClick={() => setActiveUser(user.id)}
              className={clsx(
                'bg-white dark:bg-gray-900 rounded-xl border p-5 cursor-pointer hover:shadow-md transition-shadow relative',
                isActive
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-gray-200 dark:border-gray-800'
              )}
            >
              {/* Active badge */}
              {isActive && (
                <div className="absolute top-3 right-3 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                  <CheckCircle2 size={14} />
                  Aktiv
                </div>
              )}

              {/* Avatar + name */}
              <div className="flex items-center gap-3 mb-3">
                <div className={clsx(
                  'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0',
                  AVATAR_COLORS[idx % AVATAR_COLORS.length]
                )}>
                  {user.initials}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.title}</p>
                </div>
              </div>

              {/* Role badge */}
              <div className="mb-3">
                <span className={clsx('text-[10px] px-2 py-0.5 rounded font-medium', ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600')}>
                  {user.role}
                </span>
              </div>

              {/* Contact */}
              <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Mail size={12} className="shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={12} className="shrink-0" />
                  <span>{user.phone}</span>
                </div>
              </div>

              {/* Hourly rate */}
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-400">
                <span>Timesats</span>
                <span className="font-medium text-gray-600 dark:text-gray-300">{user.hourlyRate.toLocaleString('da-DK')} kr./t</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
