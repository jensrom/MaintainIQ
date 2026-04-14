import { useState } from 'react'
import { Mail, Phone, Shield, Plus, X, Check, Pencil, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'
import type { User, UserRole } from '../types'

const ROLE_OPTS: UserRole[] = [
  'Vedligeholdstekniker', 'Senior Tekniker', 'Planlægger', 'Driftsleder', 'Kvalitetschef',
]

const AVATAR_COLORS = [
  'bg-blue-600', 'bg-indigo-600', 'bg-emerald-600', 'bg-amber-600', 'bg-violet-600',
]

const GROUP_COLOR_BADGE: Record<string, string> = {
  red:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  green:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  amber:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  gray:   'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

function GroupPicker({
  userId,
  currentGroupIds,
  onClose,
}: {
  userId: string
  currentGroupIds: string[]
  onClose: () => void
}) {
  const { userGroups, updateUser } = useStore()
  const [selected, setSelected] = useState<string[]>([...currentGroupIds])

  function toggle(gid: string) {
    setSelected(prev =>
      prev.includes(gid) ? prev.filter(x => x !== gid) : [...prev, gid]
    )
  }

  function save() {
    updateUser(userId, { groupIds: selected })
    onClose()
  }

  return (
    <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
      <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tilknyt til grupper</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Brugeren arver alle rettigheder fra valgte grupper</p>
      </div>
      <div className="max-h-48 overflow-y-auto py-1">
        {userGroups.map(g => (
          <label key={g.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(g.id)}
              onChange={() => toggle(g.id)}
              className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600"
            />
            <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium', GROUP_COLOR_BADGE[g.color] ?? GROUP_COLOR_BADGE.gray)}>
              {g.name}
            </span>
            <span className="text-[11px] text-slate-400 truncate flex-1">{g.description}</span>
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2 px-3 py-2 border-t border-slate-100 dark:border-slate-800">
        <button onClick={onClose} className="text-xs px-2 py-1 text-slate-500 hover:text-slate-700">Annuller</button>
        <button onClick={save} className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Gem</button>
      </div>
    </div>
  )
}

export default function UserManagement() {
  const { users, userGroups, activeUserId, setActiveUser, getEffectivePermissions } = useStore()
  const [groupPickerFor, setGroupPickerFor] = useState<string | null>(null)

  // If updateUser doesn't exist yet on store, we handle gracefully
  const store = useStore()
  const updateUser = (store as any).updateUser as ((id: string, patch: Partial<User>) => void) | undefined

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Brugere</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {users.length} brugere · Adgang styres via brugergrupper
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus size={15} /> Ny bruger
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Bruger</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Kontakt</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Grupper</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Rettigheder</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {users.map((user, idx) => {
              const isActive = user.id === activeUserId
              const groups = userGroups.filter(g => user.groupIds?.includes(g.id))
              const permCount = getEffectivePermissions(user.id).length
              return (
                <tr
                  key={user.id}
                  className={clsx(
                    'hover:bg-slate-50/60 dark:hover:bg-slate-800/30',
                    isActive && 'bg-blue-50/40 dark:bg-blue-900/10'
                  )}
                >
                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={clsx(
                          'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0',
                          AVATAR_COLORS[idx % AVATAR_COLORS.length]
                        )}
                      >
                        {user.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{user.name}</p>
                          {isActive && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded font-medium">Aktiv</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{user.title}</p>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Mail size={11} className="shrink-0" />
                        <span className="truncate max-w-[160px]">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Phone size={11} className="shrink-0" />
                        <span>{user.phone}</span>
                      </div>
                    </div>
                  </td>

                  {/* Groups */}
                  <td className="px-4 py-3">
                    <div className="relative">
                      <div className="flex flex-wrap gap-1">
                        {groups.length === 0 ? (
                          <span className="text-xs text-slate-400">Ingen grupper</span>
                        ) : (
                          groups.map(g => (
                            <span
                              key={g.id}
                              className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium', GROUP_COLOR_BADGE[g.color] ?? GROUP_COLOR_BADGE.gray)}
                            >
                              {g.name}
                            </span>
                          ))
                        )}
                      </div>
                      {groupPickerFor === user.id && (
                        <GroupPicker
                          userId={user.id}
                          currentGroupIds={user.groupIds ?? []}
                          onClose={() => setGroupPickerFor(null)}
                        />
                      )}
                    </div>
                  </td>

                  {/* Permissions count */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Shield size={13} className="text-slate-400" />
                      <span className="text-xs text-slate-500">{permCount} rettigheder</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={clsx(
                      'text-[10px] px-2 py-0.5 rounded font-medium',
                      user.isActive !== false
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    )}>
                      {user.isActive !== false ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setGroupPickerFor(groupPickerFor === user.id ? null : user.id)}
                        className="px-2 py-1 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                      >
                        <Shield size={11} /> Grupper <ChevronDown size={11} />
                      </button>
                      <button
                        onClick={() => setActiveUser(user.id)}
                        className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                        title="Skift til denne bruger"
                      >
                        <Pencil size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Klik "Grupper" for at tildele brugergrupper til en bruger · Brugeren arver kombinationen af rettigheder fra alle tildelte grupper
      </p>
    </div>
  )
}
