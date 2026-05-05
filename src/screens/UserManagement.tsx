import { useState } from 'react'
import { Mail, Phone, Shield, Plus, X, Check, Pencil, ChevronDown, Trash2 } from 'lucide-react'
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

const inp = 'w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2'

interface UserForm {
  name: string
  initials: string
  title: string
  email: string
  phone: string
  role: UserRole
  hourlyRate: number
  isActive: boolean
  passwordHash: string
  groupIds: string[]
}

const EMPTY_FORM: UserForm = {
  name: '', initials: '', title: '', email: '', phone: '',
  role: 'Vedligeholdstekniker', hourlyRate: 0, isActive: true, passwordHash: '', groupIds: [],
}

function UserModal({
  initial,
  title,
  onSave,
  onClose,
}: {
  initial: UserForm
  title: string
  onSave: (f: UserForm) => void
  onClose: () => void
}) {
  const { userGroups } = useStore()
  const [form, setForm] = useState<UserForm>(initial)
  const f = <K extends keyof UserForm>(key: K, v: UserForm[K]) => setForm(prev => ({ ...prev, [key]: v }))

  function toggleGroup(gid: string) {
    setForm(prev => ({
      ...prev,
      groupIds: prev.groupIds.includes(gid)
        ? prev.groupIds.filter(x => x !== gid)
        : [...prev.groupIds, gid],
    }))
  }

  function submit() {
    if (!form.name || !form.email) return
    onSave(form)
    onClose()
  }

  return (
    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg max-h-[90vh] bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex flex-col z-40 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        <button onClick={onClose} className="p-1.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Fulde navn *</label>
            <input className={inp} value={form.name} onChange={e => f('name', e.target.value)} placeholder="Fornavn Efternavn" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Initialer</label>
            <input className={inp} value={form.initials} onChange={e => f('initials', e.target.value.toUpperCase().slice(0, 3))} placeholder="fx JR" maxLength={3} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Titel / Stilling</label>
          <input className={inp} value={form.title} onChange={e => f('title', e.target.value)} placeholder="f.eks. Senior Tekniker" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">E-mail *</label>
          <input type="email" className={inp} value={form.email} onChange={e => f('email', e.target.value)} placeholder="navn@firma.dk" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Telefon</label>
            <input type="tel" className={inp} value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="+45 00 00 00 00" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Adgangskode</label>
            <input type="text" className={inp} value={form.passwordHash} onChange={e => f('passwordHash', e.target.value)} placeholder="Sæt adgangskode..." />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Rolle</label>
            <select className={inp} value={form.role} onChange={e => f('role', e.target.value as UserRole)}>
              {ROLE_OPTS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Timepris (kr.)</label>
            <input type="number" min="0" className={inp} value={form.hourlyRate} onChange={e => f('hourlyRate', parseFloat(e.target.value) || 0)} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Brugergrupper</label>
          <div className="space-y-1.5">
            {userGroups.map(g => (
              <label key={g.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={form.groupIds.includes(g.id)}
                  onChange={() => toggleGroup(g.id)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600"
                />
                <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium', GROUP_COLOR_BADGE[g.color] ?? GROUP_COLOR_BADGE.gray)}>
                  {g.name}
                </span>
                <span className="text-xs text-slate-400 truncate flex-1">{g.description}</span>
              </label>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={e => f('isActive', e.target.checked)} className="rounded" />
          Aktiv bruger
        </label>
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 border border-slate-200 dark:border-slate-700 text-sm rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Annuller</button>
        <button onClick={submit} className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">Gem</button>
      </div>
    </div>
  )
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
  const { users, userGroups, activeUserId, setActiveUser, getEffectivePermissions, updateUser, createUser, deleteUser } = useStore()
  const [groupPickerFor, setGroupPickerFor] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const editingUser = users.find(u => u.id === editingId) ?? null

  function handleCreate(form: UserForm) {
    createUser({
      name: form.name,
      initials: form.initials || form.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      title: form.title,
      email: form.email,
      phone: form.phone,
      role: form.role,
      hourlyRate: form.hourlyRate,
      groupIds: form.groupIds,
      isActive: form.isActive,
      mfaEnabled: false,
      passwordHash: form.passwordHash || undefined,
    })
  }

  function handleUpdate(form: UserForm) {
    if (!editingId) return
    updateUser(editingId, {
      name: form.name,
      initials: form.initials,
      title: form.title,
      email: form.email,
      phone: form.phone,
      role: form.role,
      hourlyRate: form.hourlyRate,
      groupIds: form.groupIds,
      isActive: form.isActive,
      passwordHash: form.passwordHash || undefined,
    })
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Brugere</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {users.length} brugere · Adgang styres via brugergrupper
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setEditingId(null) }}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
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
              const isConfirmingDelete = confirmDeleteId === user.id
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
                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-red-600 dark:text-red-400">Slet?</span>
                        <button
                          onClick={() => { deleteUser(user.id); setConfirmDeleteId(null) }}
                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          <Check size={11} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setGroupPickerFor(groupPickerFor === user.id ? null : user.id)}
                          className="px-2 py-1 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                        >
                          <Shield size={11} /> Grupper <ChevronDown size={11} />
                        </button>
                        <button
                          onClick={() => { setEditingId(user.id); setShowCreate(false) }}
                          className="px-2 py-1 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded border border-slate-200 dark:border-slate-700"
                          title="Redigér bruger"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          onClick={() => setActiveUser(user.id)}
                          className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                          title="Log ind som denne bruger"
                        >
                          Skift
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(user.id)}
                          className="px-2 py-1 text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded border border-slate-200 dark:border-slate-700"
                          title="Slet bruger"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Klik "Grupper" for at tildele brugergrupper · Klik <Pencil size={10} className="inline" /> for at redigere brugeroplysninger
      </p>

      {showCreate && (
        <>
          <UserModal
            initial={EMPTY_FORM}
            title="Opret ny bruger"
            onSave={handleCreate}
            onClose={() => setShowCreate(false)}
          />
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30" onClick={() => setShowCreate(false)} />
        </>
      )}

      {editingUser && (
        <>
          <UserModal
            initial={{
              name: editingUser.name,
              initials: editingUser.initials,
              title: editingUser.title,
              email: editingUser.email,
              phone: editingUser.phone,
              role: editingUser.role,
              hourlyRate: editingUser.hourlyRate,
              isActive: editingUser.isActive !== false,
              passwordHash: editingUser.passwordHash ?? '',
              groupIds: editingUser.groupIds ?? [],
            }}
            title="Redigér bruger"
            onSave={handleUpdate}
            onClose={() => setEditingId(null)}
          />
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30" onClick={() => setEditingId(null)} />
        </>
      )}
    </div>
  )
}
