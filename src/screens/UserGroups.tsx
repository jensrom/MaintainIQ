import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Shield, Users, ChevronDown, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'
import type { UserGroup, Permission } from '../types'

const COLOR_OPTIONS = [
  { value: 'red',    label: 'Rød',    cls: 'bg-red-500' },
  { value: 'blue',   label: 'Blå',    cls: 'bg-blue-500' },
  { value: 'green',  label: 'Grøn',   cls: 'bg-green-500' },
  { value: 'purple', label: 'Lilla',  cls: 'bg-purple-500' },
  { value: 'amber',  label: 'Gul',    cls: 'bg-amber-500' },
  { value: 'gray',   label: 'Grå',    cls: 'bg-gray-400' },
]

const COLOR_BADGE: Record<string, string> = {
  red:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  green:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  amber:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  gray:   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

// Permission groups for display
const PERMISSION_SECTIONS: { label: string; perms: Permission[] }[] = [
  { label: 'Dashboard', perms: ['view_dashboard'] },
  { label: 'Arbejdsordrer', perms: ['view_workorders', 'create_workorder', 'edit_workorder', 'close_workorder', 'approve_workorder', 'delete_workorder'] },
  { label: 'Enheder', perms: ['view_assets', 'create_asset', 'edit_asset', 'delete_asset'] },
  { label: 'Reservedele', perms: ['view_spareParts', 'adjust_stock', 'manage_spareParts'] },
  { label: 'Planlagt vedligehold', perms: ['view_pm', 'create_pm', 'edit_pm', 'complete_pm', 'approve_pm'] },
  { label: 'Logbog', perms: ['view_logbook', 'create_logentry'] },
  { label: 'Leverandører', perms: ['view_suppliers', 'manage_suppliers'] },
  { label: 'Rapporter & Audit', perms: ['view_reports', 'view_audit', 'export_data'] },
  { label: 'Administration', perms: ['admin_users', 'admin_groups', 'admin_settings'] },
  { label: 'Pharma & GMP', perms: ['pharma_signoff', 'pharma_review', 'pharma_approve', 'manage_calibration', 'manage_deviations', 'manage_capa'] },
  { label: 'Gæsteportal', perms: ['view_guest_requests', 'manage_guest_requests'] },
]

const PERM_LABELS: Record<Permission, string> = {
  view_dashboard: 'Se dashboard',
  view_workorders: 'Se arbejdsordrer', create_workorder: 'Oprette AO', edit_workorder: 'Redigere AO',
  close_workorder: 'Afslutte AO', approve_workorder: 'Godkende AO', delete_workorder: 'Slette AO',
  view_assets: 'Se enheder', create_asset: 'Oprette enheder', edit_asset: 'Redigere enheder', delete_asset: 'Slette enheder',
  view_spareParts: 'Se reservedele', adjust_stock: 'Justere lager', manage_spareParts: 'Administrere reservedele',
  view_pm: 'Se PM-opgaver', create_pm: 'Oprette PM', edit_pm: 'Redigere PM', complete_pm: 'Udføre PM', approve_pm: 'Godkende PM',
  view_logbook: 'Se logbog', create_logentry: 'Oprette logposter',
  view_suppliers: 'Se leverandører', manage_suppliers: 'Administrere leverandører',
  view_reports: 'Se rapporter', view_audit: 'Se audit trail', export_data: 'Eksportere data',
  admin_users: 'Administrere brugere', admin_groups: 'Administrere grupper', admin_settings: 'Systemindstillinger',
  pharma_signoff: 'Elektronisk underskrift', pharma_review: 'GMP review', pharma_approve: 'GMP godkendelse',
  manage_calibration: 'Kalibrering', manage_deviations: 'Afvigelsesrapporter', manage_capa: 'CAPA',
  view_guest_requests: 'Se gæsteanmodninger', manage_guest_requests: 'Behandle gæsteanmodninger',
}

interface GroupFormData {
  name: string
  description: string
  color: string
  permissions: Permission[]
  siteIds: string[]
}

function GroupForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: GroupFormData
  onSave: (data: GroupFormData) => void
  onCancel: () => void
}) {
  const [data, setData] = useState<GroupFormData>(initial)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(PERMISSION_SECTIONS.map(s => s.label)))

  function togglePerm(perm: Permission) {
    setData(d => ({
      ...d,
      permissions: d.permissions.includes(perm)
        ? d.permissions.filter(p => p !== perm)
        : [...d.permissions, perm],
    }))
  }

  function toggleSection(section: { label: string; perms: Permission[] }, allChecked: boolean) {
    setData(d => ({
      ...d,
      permissions: allChecked
        ? d.permissions.filter(p => !section.perms.includes(p))
        : [...new Set([...d.permissions, ...section.perms])],
    }))
  }

  function toggleExpand(label: string) {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-500 mb-1">Gruppenavn *</label>
          <input
            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={data.name}
            onChange={e => setData(d => ({ ...d, name: e.target.value }))}
            placeholder="f.eks. Vedligeholdsteknikere"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-500 mb-1">Beskrivelse</label>
          <input
            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={data.description}
            onChange={e => setData(d => ({ ...d, description: e.target.value }))}
            placeholder="Kort beskrivelse af gruppen"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Farve</label>
          <div className="flex gap-2 flex-wrap">
            {COLOR_OPTIONS.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setData(d => ({ ...d, color: c.value }))}
                className={clsx('w-6 h-6 rounded-full transition-all', c.cls, data.color === c.value && 'ring-2 ring-offset-2 ring-blue-500')}
                title={c.label}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Tilladelser <span className="font-normal text-slate-400">({data.permissions.length} valgt)</span>
        </p>
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
          {PERMISSION_SECTIONS.map(section => {
            const allChecked = section.perms.every(p => data.permissions.includes(p))
            const someChecked = section.perms.some(p => data.permissions.includes(p))
            const expanded = expandedSections.has(section.label)
            return (
              <div key={section.label}>
                <div className="flex items-center px-3 py-2 bg-slate-50 dark:bg-slate-800/50 gap-2">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={el => { if (el) el.indeterminate = someChecked && !allChecked }}
                    onChange={() => toggleSection(section, allChecked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => toggleExpand(section.label)}
                    className="flex-1 flex items-center gap-1.5 text-left"
                  >
                    {expanded ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronRight size={12} className="text-slate-400" />}
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{section.label}</span>
                  </button>
                </div>
                {expanded && (
                  <div className="px-6 py-2 grid grid-cols-2 gap-1.5">
                    {section.perms.map(perm => (
                      <label key={perm} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={data.permissions.includes(perm)}
                          onChange={() => togglePerm(perm)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600"
                        />
                        <span className="text-xs text-slate-600 dark:text-slate-400">{PERM_LABELS[perm]}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
          Annuller
        </button>
        <button
          type="button"
          onClick={() => data.name.trim() && onSave(data)}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Gem gruppe
        </button>
      </div>
    </div>
  )
}

export default function UserGroups() {
  const { userGroups, users, createUserGroup, updateUserGroup, deleteUserGroup } = useStore()
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const emptyForm: GroupFormData = { name: '', description: '', color: 'blue', permissions: [], siteIds: [] }

  function membersOf(groupId: string) {
    return users.filter(u => u.groupIds.includes(groupId))
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Brugergrupper</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Definer adgangsrettigheder pr. gruppe — brugere arver adgang fra alle tildelte grupper
          </p>
        </div>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus size={15} /> Ny gruppe
          </button>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">Opret ny gruppe</h3>
          <GroupForm
            initial={emptyForm}
            onSave={data => { createUserGroup(data); setCreating(false) }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {/* Groups list */}
      <div className="space-y-3">
        {userGroups.map(group => {
          const members = membersOf(group.id)
          const isEditing = editing === group.id
          return (
            <div key={group.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {/* Group header */}
              <div className="flex items-center px-4 py-3 gap-3">
                <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', `bg-${group.color}-100 dark:bg-${group.color}-900/30`)}>
                  <Shield size={15} className={`text-${group.color}-600 dark:text-${group.color}-400`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{group.name}</p>
                    {group.isSystem && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded font-medium">System</span>
                    )}
                    <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium', COLOR_BADGE[group.color] ?? COLOR_BADGE.gray)}>
                      {group.permissions.length} rettigheder
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{group.description}</p>
                </div>
                {/* Members */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Users size={13} className="text-slate-400" />
                  <span className="text-xs text-slate-500">{members.length} {members.length === 1 ? 'bruger' : 'brugere'}</span>
                  <div className="flex -space-x-1.5 ml-1">
                    {members.slice(0, 4).map((m, i) => (
                      <div
                        key={m.id}
                        className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900 text-white text-[9px] font-bold flex items-center justify-center"
                        title={m.name}
                        style={{ zIndex: 10 - i }}
                      >
                        {m.initials}
                      </div>
                    ))}
                    {members.length > 4 && (
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 text-slate-600 dark:text-slate-300 text-[9px] font-bold flex items-center justify-center">
                        +{members.length - 4}
                      </div>
                    )}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditing(isEditing ? null : group.id)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded"
                    title="Rediger"
                  >
                    <Pencil size={14} />
                  </button>
                  {!group.isSystem && (
                    confirmDelete === group.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => { deleteUserGroup(group.id); setConfirmDelete(null) }} className="p-1 text-red-500 hover:text-red-700"><Check size={14} /></button>
                        <button onClick={() => setConfirmDelete(null)} className="p-1 text-slate-400"><X size={14} /></button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(group.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded"><Trash2 size={14} /></button>
                    )
                  )}
                </div>
              </div>

              {/* Edit form */}
              {isEditing && (
                <div className="border-t border-slate-100 dark:border-slate-800 p-5">
                  <GroupForm
                    initial={{ name: group.name, description: group.description, color: group.color, permissions: [...group.permissions], siteIds: [...group.siteIds] }}
                    onSave={data => { updateUserGroup(group.id, data); setEditing(null) }}
                    onCancel={() => setEditing(null)}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
