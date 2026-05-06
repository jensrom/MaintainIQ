import { create } from 'zustand'
import { addDays } from 'date-fns'
import type {
  WorkOrder, WorkOrderStatus, Priority, WorkOrderCategory,
  SparePart, PMTask, LogEntry, User, Asset, AssetCategory, LookupTable, LookupItem, Supplier,
  AppNotification, Settings, WidgetConfig, AuditEntry, AuditAction,
  UserGroup, AuthSession, CompanySettings, Permission,
  DeviationRecord, CAPARecord, ChangeRecord, CalibrationRecord,
} from '../types'
import {
  USERS, ASSETS, ASSET_CATEGORIES, LOOKUP_TABLES,
  WORK_ORDERS, SPARE_PARTS, SUPPLIERS, PM_TASKS, LOG_ENTRIES,
  USER_GROUPS, COMPANY_SETTINGS,
  INITIAL_DEVIATIONS, INITIAL_CAPA, INITIAL_CHANGES, INITIAL_CALIBRATIONS,
} from '../data/mockData'

const api = window.electronAPI

interface AppState {
  // Data
  users: User[]
  assets: Asset[]
  assetCategories: AssetCategory[]
  auditLog: AuditEntry[]
  workOrders: WorkOrder[]
  spareParts: SparePart[]
  suppliers: Supplier[]
  pmTasks: PMTask[]
  logEntries: LogEntry[]
  // UI state
  activeUserId: string
  settings: Settings
  widgetConfigs: WidgetConfig[]
  // Sidebar
  sidebarCollapsed: boolean
  // Actions — Assets
  createAsset: (asset: Omit<Asset, 'id' | 'createdAt'>) => string
  updateAsset: (id: string, patch: Partial<Asset>) => void
  deleteAsset: (id: string) => void
  // Actions — Asset Categories
  createAssetCategory: (cat: Omit<AssetCategory, 'id' | 'isSystem'>) => string
  updateAssetCategory: (id: string, patch: Partial<AssetCategory>) => void
  deleteAssetCategory: (id: string) => void
  // Actions — Lookup Tables
  lookupTables: LookupTable[]
  addLookupItem: (tableId: string, item: Omit<LookupItem, 'id'>) => void
  updateLookupItem: (tableId: string, itemId: string, patch: Partial<LookupItem>) => void
  deleteLookupItem: (tableId: string, itemId: string) => void
  // Actions — Work Orders
  createWorkOrder: (wo: Omit<WorkOrder, 'id' | 'createdAt' | 'tasks' | 'comments' | 'timeLog' | 'spareParts' | 'history'>) => string
  updateWorkOrder: (id: string, patch: Partial<WorkOrder>) => void
  addComment: (woId: string, text: string) => void
  logTime: (woId: string, hours: number, note: string, date: string) => void
  toggleTask: (woId: string, taskId: string) => void
  addSparePart: (woId: string, sparePartId: string, quantity: number) => void
  // Actions — Requests
  acceptRequest: (id: string, assigneeId: string | null) => void
  planRequest: (id: string, dueDate: string, assigneeId: string | null) => void
  // Actions — PM
  markPMDone: (id: string) => void
  createPMTask: (task: Omit<PMTask, 'id' | 'status' | 'lastDone'>) => void
  togglePMTask: (pmId: string, taskId: string) => void
  // Actions — Spare Parts (full CRUD)
  adjustStock: (id: string, delta: number) => void
  createSparePart: (sp: Omit<SparePart, 'id' | 'history'>) => string
  updateSparePart: (id: string, patch: Partial<Omit<SparePart, 'id' | 'history'>>) => void
  deleteSparePart: (id: string) => void
  // Actions — Suppliers (full CRUD)
  createSupplier: (s: Omit<Supplier, 'id'>) => string
  updateSupplier: (id: string, patch: Partial<Omit<Supplier, 'id'>>) => void
  deleteSupplier: (id: string) => void
  // Actions — PM (edit + delete)
  updatePMTask: (id: string, patch: Partial<PMTask>) => void
  deletePMTask: (id: string) => void
  // Actions — Users (create + delete)
  createUser: (u: Omit<User, 'id'>) => string
  deleteUser: (id: string) => void
  // Actions — Work Orders (delete)
  deleteWorkOrder: (id: string) => void
  // Actions — Log
  createLogEntry: (entry: Omit<LogEntry, 'id' | 'createdAt'>) => void
  deleteLogEntry: (id: string) => void
  // Actions — Settings / UI
  setActiveUser: (id: string) => void
  updateUser: (id: string, patch: Partial<User>) => void
  updateSettings: (patch: Partial<Settings>) => void
  updateWidgetConfig: (id: string, displayType: WidgetConfig['displayType']) => void
  setSidebarCollapsed: (v: boolean) => void
  // Auth
  auth: AuthSession | null
  // User Groups
  userGroups: UserGroup[]
  // Company
  companySettings: CompanySettings
  // Actions — Auth
  login: (email: string, password: string) => boolean
  loginWithEntra: () => void
  logout: () => void
  // Actions — User Groups
  createUserGroup: (g: Omit<UserGroup, 'id' | 'isSystem'>) => string
  updateUserGroup: (id: string, patch: Partial<UserGroup>) => void
  deleteUserGroup: (id: string) => void
  // Actions — Company
  updateCompanySettings: (patch: Partial<CompanySettings>) => void
  // GMP entities (store-backed, DB-synced)
  deviations: DeviationRecord[]
  capaRecords: CAPARecord[]
  changeRecords: ChangeRecord[]
  updateDeviation: (id: string, patch: Partial<DeviationRecord>) => void
  updateCapa: (id: string, patch: Partial<CAPARecord>) => void
  updateChange: (id: string, patch: Partial<ChangeRecord>) => void
  createDeviation: (d: Omit<DeviationRecord, 'id'>) => string
  createCapa: (c: Omit<CAPARecord, 'id'>) => string
  createChange: (c: Omit<ChangeRecord, 'id'>) => string
  deleteDeviation: (id: string) => void
  deleteCapa: (id: string) => void
  deleteChange: (id: string) => void
  // Calibration
  calibrations: CalibrationRecord[]
  createCalibration: (cal: Omit<CalibrationRecord, 'id'>) => string
  updateCalibration: (id: string, patch: Partial<CalibrationRecord>) => void
  deleteCalibration: (id: string) => void
  markCalibrationDone: (id: string) => void
  // Electron DB
  dbReady: boolean
  dbError: string | null
  initFromDb: () => Promise<void>
  // Helpers
  getEffectivePermissions: (userId: string) => Permission[]
  // Computed
  getNotifications: () => AppNotification[]
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function nowStr() {
  return new Date().toISOString()
}

function nextId(prefix: string, existing: string[]): string {
  const nums = existing
    .filter(id => id.startsWith(prefix))
    .map(id => parseInt(id.replace(prefix, '')) || 0)
  const max = nums.length ? Math.max(...nums) : 0
  return `${prefix}${max + 1}`
}

export const useStore = create<AppState>((set, get) => ({
  users: USERS,
  assets: ASSETS,
  assetCategories: ASSET_CATEGORIES,
  auditLog: [],
  lookupTables: LOOKUP_TABLES,
  workOrders: WORK_ORDERS,
  spareParts: SPARE_PARTS,
  suppliers: SUPPLIERS,
  pmTasks: PM_TASKS,
  logEntries: LOG_ENTRIES,
  deviations: INITIAL_DEVIATIONS,
  capaRecords: INITIAL_CAPA,
  changeRecords: INITIAL_CHANGES,
  calibrations: INITIAL_CALIBRATIONS,
  dbReady: false,
  dbError: null,
  activeUserId: 'u4',
  sidebarCollapsed: false,
  auth: (() => {
    try {
      const stored = localStorage.getItem('miq_auth')
      if (stored) {
        const session: AuthSession = JSON.parse(stored)
        if (new Date(session.expiresAt) > new Date()) return session
      }
    } catch {}
    return null
  })(),
  userGroups: USER_GROUPS,
  companySettings: COMPANY_SETTINGS,
  settings: {
    darkMode: false,
    pharmaMode: true,
    notifications: {
      overdueWO: true,
      newRequests: true,
      lowStock: true,
      emptyStock: true,
      overduePM: true,
      openDeviations: true,
      overdueCapa: true,
      pendingChanges: true,
    },
  },
  widgetConfigs: [
    { id: 'open', displayType: 'count' },
    { id: 'overdue', displayType: 'count' },
    { id: 'critical', displayType: 'count' },
    { id: 'pm_compliance', displayType: 'percent' },
    { id: 'low_stock', displayType: 'count' },
    { id: 'requests', displayType: 'count' },
  ],

  createAsset: (asset) => {
    const existing = get().assets.map(a => a.id)
    const id = nextId('ast', existing)
    const ts = nowStr()
    set(s => ({
      assets: [...s.assets, { ...asset, id, createdAt: todayStr() }],
      auditLog: [{ id: nextId('au', s.auditLog.map(a => a.id)), timestamp: ts, userId: s.activeUserId,
        action: 'create_asset', entityType: 'asset', entityId: id, entityName: asset.name,
        details: `Oprettet enhed "${asset.name}" (${asset.code})` }, ...s.auditLog],
    }))
    return id
  },

  updateAsset: (id, patch) => {
    const asset = get().assets.find(a => a.id === id)
    const ts = nowStr()
    set(s => ({
      assets: s.assets.map(a => a.id === id ? { ...a, ...patch, updatedAt: todayStr() } : a),
      auditLog: [{ id: nextId('au', s.auditLog.map(a => a.id)), timestamp: ts, userId: s.activeUserId,
        action: 'update_asset', entityType: 'asset', entityId: id, entityName: asset?.name ?? id,
        details: `Opdateret: ${Object.keys(patch).join(', ')}` }, ...s.auditLog],
    }))
  },

  deleteAsset: (id) => {
    const asset = get().assets.find(a => a.id === id)
    const ts = nowStr()
    set(s => ({
      assets: s.assets.filter(a => a.id !== id && a.parentId !== id),
      auditLog: [{ id: nextId('au', s.auditLog.map(a => a.id)), timestamp: ts, userId: s.activeUserId,
        action: 'delete_asset', entityType: 'asset', entityId: id, entityName: asset?.name ?? id,
        details: `Slettet enhed "${asset?.name ?? id}"` }, ...s.auditLog],
    }))
  },

  createAssetCategory: (cat) => {
    const existing = get().assetCategories.map(c => c.id)
    const id = nextId('cat', existing)
    set(s => ({ assetCategories: [...s.assetCategories, { ...cat, isSystem: false, id }] }))
    return id
  },

  updateAssetCategory: (id, patch) => {
    set(s => ({
      assetCategories: s.assetCategories.map(c => c.id === id ? { ...c, ...patch } : c),
    }))
  },

  deleteAssetCategory: (id) => {
    set(s => ({
      assetCategories: s.assetCategories.filter(c => c.id !== id),
    }))
  },

  addLookupItem: (tableId, item) => {
    set(s => ({
      lookupTables: s.lookupTables.map(t => {
        if (t.id !== tableId) return t
        const id = nextId('li', t.items.map(i => i.id))
        return { ...t, items: [...t.items, { ...item, id }] }
      }),
    }))
  },

  updateLookupItem: (tableId, itemId, patch) => {
    set(s => ({
      lookupTables: s.lookupTables.map(t => {
        if (t.id !== tableId) return t
        return { ...t, items: t.items.map(i => i.id === itemId ? { ...i, ...patch } : i) }
      }),
    }))
  },

  deleteLookupItem: (tableId, itemId) => {
    set(s => ({
      lookupTables: s.lookupTables.map(t => {
        if (t.id !== tableId) return t
        return { ...t, items: t.items.filter(i => i.id !== itemId) }
      }),
    }))
  },

  createWorkOrder: (wo) => {
    const existing = get().workOrders.map(w => w.id)
    const id = nextId('AO-', existing)
    const ts = nowStr()
    const newWO: WorkOrder = { ...wo, id, createdAt: todayStr(), tasks: [], comments: [], timeLog: [], spareParts: [], history: [] }
    set(s => ({
      workOrders: [newWO, ...s.workOrders],
      auditLog: [{ id: nextId('au', s.auditLog.map(a => a.id)), timestamp: ts, userId: s.activeUserId,
        action: 'create_wo', entityType: 'work_order', entityId: id, entityName: wo.title,
        details: `Oprettet arbejdsordre "${wo.title}" (${wo.priority} / ${wo.category})` }, ...s.auditLog],
    }))
    api?.wo_create(newWO).catch(console.error)
    return id
  },

  updateWorkOrder: (id, patch) => {
    const wo = get().workOrders.find(w => w.id === id)
    const ts = nowStr()
    let historyEntry: WorkOrder['history'][0] | undefined
    set(s => ({
      workOrders: s.workOrders.map(w => {
        if (w.id !== id) return w
        const updated = { ...w, ...patch }
        if (patch.status && patch.status !== w.status) {
          historyEntry = { id: nextId('h', w.history.map(h => h.id)), field: 'Status',
            oldValue: w.status, newValue: patch.status, userId: s.activeUserId, date: todayStr() }
          updated.history = [historyEntry, ...w.history]
        }
        return updated
      }),
      auditLog: patch.status && wo ? [
        { id: nextId('au', s.auditLog.map(a => a.id)), timestamp: ts, userId: s.activeUserId,
          action: 'update_wo_status', entityType: 'work_order', entityId: id, entityName: wo.title,
          details: `Status ændret: ${wo.status} → ${patch.status}` },
        ...s.auditLog,
      ] : s.auditLog,
    }))
    api?.wo_update(id, patch, historyEntry).catch(console.error)
  },

  addComment: (woId, text) => {
    set(s => ({
      workOrders: s.workOrders.map(wo => {
        if (wo.id !== woId) return wo
        return {
          ...wo,
          comments: [
            ...wo.comments,
            {
              id: nextId('c', wo.comments.map(c => c.id)),
              userId: s.activeUserId,
              text,
              createdAt: todayStr(),
            },
          ],
        }
      }),
    }))
  },

  logTime: (woId, hours, note, date) => {
    set(s => ({
      workOrders: s.workOrders.map(wo => {
        if (wo.id !== woId) return wo
        return {
          ...wo,
          timeLog: [
            ...wo.timeLog,
            {
              id: nextId('tl', wo.timeLog.map(t => t.id)),
              userId: s.activeUserId,
              hours,
              note,
              date,
            },
          ],
        }
      }),
    }))
  },

  toggleTask: (woId, taskId) => {
    set(s => ({
      workOrders: s.workOrders.map(wo => {
        if (wo.id !== woId) return wo
        return {
          ...wo,
          tasks: wo.tasks.map(t =>
            t.id === taskId ? { ...t, done: !t.done } : t
          ),
        }
      }),
    }))
  },

  addSparePart: (woId, sparePartId, quantity) => {
    set(s => ({
      workOrders: s.workOrders.map(wo => {
        if (wo.id !== woId) return wo
        const existing = wo.spareParts.find(sp => sp.sparePartId === sparePartId)
        if (existing) {
          return {
            ...wo,
            spareParts: wo.spareParts.map(sp =>
              sp.sparePartId === sparePartId
                ? { ...sp, quantity: sp.quantity + quantity }
                : sp
            ),
          }
        }
        return {
          ...wo,
          spareParts: [
            ...wo.spareParts,
            {
              id: nextId('sp', wo.spareParts.map(sp => sp.id)),
              sparePartId,
              quantity,
            },
          ],
        }
      }),
    }))
  },

  acceptRequest: (id, assigneeId) => {
    get().updateWorkOrder(id, { status: 'Åben', assigneeId })
  },

  planRequest: (id, dueDate, assigneeId) => {
    get().updateWorkOrder(id, { status: 'Planlagt', dueDate, assigneeId })
  },

  markPMDone: (id) => {
    const pm = get().pmTasks.find(p => p.id === id)
    const ts = nowStr()
    set(s => ({
      pmTasks: s.pmTasks.map(p => {
        if (p.id !== id) return p
        const nextDue = addDays(new Date(), p.frequencyDays).toISOString().split('T')[0]
        return { ...p, lastDone: todayStr(), nextDue, status: 'Udført' as const, tasks: p.tasks.map(t => ({ ...t, done: false })) }
      }),
      auditLog: pm ? [
        { id: nextId('au', s.auditLog.map(a => a.id)), timestamp: ts, userId: s.activeUserId,
          action: 'mark_pm_done', entityType: 'pm_task', entityId: id, entityName: pm.title,
          details: `PM markeret udført: "${pm.title}"` },
        ...s.auditLog,
      ] : s.auditLog,
    }))
  },

  createPMTask: (task) => {
    const id = nextId('pm', get().pmTasks.map(p => p.id))
    set(s => ({
      pmTasks: [
        ...s.pmTasks,
        {
          ...task,
          id,
          status: 'Kommende' as const,
          lastDone: null,
        },
      ],
    }))
  },

  togglePMTask: (pmId, taskId) => {
    set(s => ({
      pmTasks: s.pmTasks.map(pm => {
        if (pm.id !== pmId) return pm
        return {
          ...pm,
          tasks: pm.tasks.map(t =>
            t.id === taskId ? { ...t, done: !t.done } : t
          ),
        }
      }),
    }))
  },

  adjustStock: (id, delta) => {
    const sp = get().spareParts.find(s => s.id === id)
    const ts = nowStr()
    const today = todayStr()
    const note = delta > 0 ? 'Manuel tilføjelse' : 'Manuel fradrag'
    set(s => ({
      spareParts: s.spareParts.map(part => {
        if (part.id !== id) return part
        const newQty = Math.max(0, part.quantity + delta)
        return { ...part, quantity: newQty, history: [{ date: today, change: delta, note }, ...part.history] }
      }),
      auditLog: sp ? [
        { id: nextId('au', s.auditLog.map(a => a.id)), timestamp: ts, userId: s.activeUserId,
          action: 'adjust_stock', entityType: 'spare_part', entityId: id, entityName: sp.name,
          details: `Lager justeret ${delta > 0 ? '+' : ''}${delta} → ${Math.max(0, sp.quantity + delta)} stk` },
        ...s.auditLog,
      ] : s.auditLog,
    }))
    api?.sp_adjustStock(id, delta, today, note).catch(console.error)
  },

  createSparePart: (sp) => {
    const id = nextId('sp', get().spareParts.map(s => s.id))
    set(s => ({ spareParts: [...s.spareParts, { ...sp, id, history: [] }] }))
    return id
  },

  updateSparePart: (id, patch) => {
    set(s => ({ spareParts: s.spareParts.map(p => p.id === id ? { ...p, ...patch } : p) }))
  },

  deleteSparePart: (id) => {
    set(s => ({ spareParts: s.spareParts.filter(p => p.id !== id) }))
  },

  createSupplier: (sup) => {
    const id = nextId('sup', get().suppliers.map(s => s.id))
    set(s => ({ suppliers: [...s.suppliers, { ...sup, id }] }))
    return id
  },

  updateSupplier: (id, patch) => {
    set(s => ({ suppliers: s.suppliers.map(sup => sup.id === id ? { ...sup, ...patch } : sup) }))
  },

  deleteSupplier: (id) => {
    set(s => ({ suppliers: s.suppliers.filter(sup => sup.id !== id) }))
  },

  updatePMTask: (id, patch) => {
    set(s => ({ pmTasks: s.pmTasks.map(p => p.id === id ? { ...p, ...patch } : p) }))
  },

  deletePMTask: (id) => {
    set(s => ({ pmTasks: s.pmTasks.filter(p => p.id !== id) }))
  },

  createUser: (u) => {
    const id = nextId('u', get().users.map(usr => usr.id))
    set(s => ({ users: [...s.users, { ...u, id }] }))
    return id
  },

  deleteUser: (id) => {
    set(s => ({ users: s.users.filter(u => u.id !== id) }))
  },

  deleteWorkOrder: (id) => {
    set(s => ({ workOrders: s.workOrders.filter(w => w.id !== id) }))
  },

  createLogEntry: (entry) => {
    const id = nextId('log', get().logEntries.map(l => l.id))
    set(s => ({
      logEntries: [
        { ...entry, id, createdAt: todayStr() },
        ...s.logEntries,
      ],
    }))
  },

  deleteLogEntry: (id) => {
    set(s => ({ logEntries: s.logEntries.filter(l => l.id !== id) }))
  },

  setActiveUser: (id) => set({ activeUserId: id }),

  updateUser: (id, patch) => {
    set(s => ({ users: s.users.map(u => u.id === id ? { ...u, ...patch } : u) }))
  },

  updateSettings: (patch) => {
    set(s => ({ settings: { ...s.settings, ...patch } }))
  },

  updateWidgetConfig: (id, displayType) => {
    set(s => ({
      widgetConfigs: s.widgetConfigs.map(w =>
        w.id === id ? { ...w, displayType } : w
      ),
    }))
  },

  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  initFromDb: async () => {
    if (!api) return
    try {
      const data = await api.data_loadAll() as Record<string, unknown>
      set({
        users:         (data.users         as typeof USERS)         ?? get().users,
        userGroups:    (data.userGroups     as typeof USER_GROUPS)   ?? get().userGroups,
        assets:        (data.assets         as typeof ASSETS)        ?? get().assets,
        assetCategories:(data.assetCategories as typeof ASSET_CATEGORIES) ?? get().assetCategories,
        workOrders:    (data.workOrders     as typeof WORK_ORDERS)   ?? get().workOrders,
        spareParts:    (data.spareParts     as typeof SPARE_PARTS)   ?? get().spareParts,
        suppliers:     (data.suppliers      as typeof SUPPLIERS)     ?? get().suppliers,
        pmTasks:       (data.pmTasks        as typeof PM_TASKS)      ?? get().pmTasks,
        logEntries:    (data.logEntries     as typeof LOG_ENTRIES)   ?? get().logEntries,
        deviations:    (data.deviations     as DeviationRecord[])    ?? get().deviations,
        capaRecords:   (data.capaRecords    as CAPARecord[])         ?? get().capaRecords,
        changeRecords: (data.changeRecords  as ChangeRecord[])       ?? get().changeRecords,
        widgetConfigs: (data.widgetConfigs  as WidgetConfig[])?.length
          ? data.widgetConfigs as WidgetConfig[]
          : get().widgetConfigs,
        lookupTables:  (data.lookupTables   as LookupTable[])?.length
          ? data.lookupTables as LookupTable[]
          : get().lookupTables,
        ...(data.settings   ? { settings:        data.settings as Settings }        : {}),
        ...(data.companySettings ? { companySettings: data.companySettings as CompanySettings } : {}),
        dbReady: true,
        dbError: null,
      })
    } catch (err) {
      set({ dbError: (err as Error).message, dbReady: false })
    }
  },

  // ── GMP actions ──────────────────────────────────────────────────────────────
  updateDeviation: (id, patch) => {
    set(s => ({ deviations: s.deviations.map(d => d.id === id ? { ...d, ...patch } : d) }))
    api?.gmp_updateDeviation(id, patch).catch(console.error)
  },
  updateCapa: (id, patch) => {
    set(s => ({ capaRecords: s.capaRecords.map(c => c.id === id ? { ...c, ...patch } : c) }))
    api?.gmp_updateCapa(id, patch).catch(console.error)
  },
  updateChange: (id, patch) => {
    set(s => ({ changeRecords: s.changeRecords.map(c => c.id === id ? { ...c, ...patch } : c) }))
    api?.gmp_updateChange(id, patch).catch(console.error)
  },
  createDeviation: (d) => {
    const id = nextId('DEV-', get().deviations.map(x => x.id))
    const rec = { ...d, id } as DeviationRecord
    set(s => ({ deviations: [rec, ...s.deviations] }))
    api?.gmp_createDeviation(rec).catch(console.error)
    return id
  },
  createCapa: (c) => {
    const id = nextId('CAPA-', get().capaRecords.map(x => x.id))
    const rec = { ...c, id } as CAPARecord
    set(s => ({ capaRecords: [rec, ...s.capaRecords] }))
    api?.gmp_createCapa(rec).catch(console.error)
    return id
  },
  createChange: (c) => {
    const id = nextId('CR-', get().changeRecords.map(x => x.id))
    const rec = { ...c, id } as ChangeRecord
    set(s => ({ changeRecords: [rec, ...s.changeRecords] }))
    api?.gmp_createChange(rec).catch(console.error)
    return id
  },
  deleteDeviation: (id) => set(s => ({ deviations: s.deviations.filter(d => d.id !== id) })),
  deleteCapa: (id) => set(s => ({ capaRecords: s.capaRecords.filter(c => c.id !== id) })),
  deleteChange: (id) => set(s => ({ changeRecords: s.changeRecords.filter(c => c.id !== id) })),

  // ── Calibration actions ──────────────────────────────────────────────────────
  createCalibration: (cal) => {
    const id = nextId('cal-', get().calibrations.map(c => c.id))
    set(s => ({ calibrations: [{ ...cal, id }, ...s.calibrations] }))
    return id
  },
  updateCalibration: (id, patch) => {
    set(s => ({ calibrations: s.calibrations.map(c => c.id === id ? { ...c, ...patch } : c) }))
  },
  deleteCalibration: (id) => {
    set(s => ({ calibrations: s.calibrations.filter(c => c.id !== id) }))
  },
  markCalibrationDone: (id) => {
    const today = todayStr()
    const nextDue = new Date()
    nextDue.setMonth(nextDue.getMonth() + 6)
    set(s => ({
      calibrations: s.calibrations.map(c =>
        c.id === id
          ? { ...c, status: 'Kalibreret', lastCalibrated: today, nextDue: nextDue.toISOString().split('T')[0] }
          : c
      ),
    }))
  },

  login: (email, password) => {
    const user = get().users.find(
      u => (u.email === email || u.name === email) && u.passwordHash === password && u.isActive
    )
    if (!user) return false
    const now = new Date()
    const session: AuthSession = {
      userId: user.id,
      loginTime: now.toISOString(),
      expiresAt: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(),
      method: 'password',
      mfaVerified: false,
    }
    try { localStorage.setItem('miq_auth', JSON.stringify(session)) } catch {}
    set({ auth: session, activeUserId: user.id })
    return true
  },

  loginWithEntra: () => {
    // Mock Entra SSO — log in as first Entra-enabled user or fallback to u4
    const user = get().users.find(u => u.entraId || u.isActive) ?? get().users[0]
    const now = new Date()
    const session: AuthSession = {
      userId: user.id,
      loginTime: now.toISOString(),
      expiresAt: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(),
      method: 'entra',
      mfaVerified: true,
    }
    try { localStorage.setItem('miq_auth', JSON.stringify(session)) } catch {}
    set({ auth: session, activeUserId: user.id })
  },

  logout: () => {
    try { localStorage.removeItem('miq_auth') } catch {}
    set({ auth: null })
  },

  createUserGroup: (g) => {
    const existing = get().userGroups.map(ug => ug.id)
    const id = nextId('ug-', existing)
    set(s => ({ userGroups: [...s.userGroups, { ...g, id, isSystem: false }] }))
    return id
  },

  updateUserGroup: (id, patch) => {
    set(s => ({
      userGroups: s.userGroups.map(g => g.id === id ? { ...g, ...patch } : g),
    }))
  },

  deleteUserGroup: (id) => {
    set(s => ({ userGroups: s.userGroups.filter(g => g.id !== id) }))
  },

  updateCompanySettings: (patch) => {
    set(s => ({ companySettings: { ...s.companySettings, ...patch } }))
  },

  getEffectivePermissions: (userId) => {
    const { users, userGroups } = get()
    const user = users.find(u => u.id === userId)
    if (!user) return []
    const perms = new Set<Permission>()
    user.groupIds.forEach(gid => {
      const group = userGroups.find(g => g.id === gid)
      group?.permissions.forEach(p => perms.add(p))
    })
    return Array.from(perms)
  },

  getNotifications: () => {
    const { workOrders, spareParts, pmTasks, settings, deviations, capaRecords, changeRecords } = get()
    const notes: AppNotification[] = []
    const today = todayStr()

    if (settings.notifications.overdueWO) {
      workOrders
        .filter(wo =>
          !['Afsluttet', 'Annulleret', 'Arbejdsanmodning'].includes(wo.status) &&
          wo.dueDate < today
        )
        .forEach(wo => {
          notes.push({
            id: `n_ow_${wo.id}`,
            type: 'overdue_wo',
            message: `Forfaldne: ${wo.title}`,
            target: '/arbejdsordrer',
            targetId: wo.id,
            createdAt: today,
          })
        })
    }

    if (settings.notifications.newRequests) {
      const requests = workOrders.filter(wo => wo.status === 'Arbejdsanmodning')
      if (requests.length > 0) {
        notes.push({
          id: 'n_req',
          type: 'new_request',
          message: `${requests.length} ny${requests.length > 1 ? 'e' : ''} arbejdsanmodning${requests.length > 1 ? 'er' : ''}`,
          target: '/anmodninger',
          createdAt: today,
        })
      }
    }

    if (settings.notifications.emptyStock) {
      spareParts
        .filter(sp => sp.quantity === 0)
        .forEach(sp => {
          notes.push({
            id: `n_es_${sp.id}`,
            type: 'empty_stock',
            message: `Tomt lager: ${sp.name}`,
            target: '/reservedele',
            targetId: sp.id,
            createdAt: today,
          })
        })
    }

    if (settings.notifications.lowStock) {
      spareParts
        .filter(sp => sp.quantity > 0 && sp.quantity < sp.minQuantity)
        .forEach(sp => {
          notes.push({
            id: `n_ls_${sp.id}`,
            type: 'low_stock',
            message: `Lavt lager: ${sp.name} (${sp.quantity} tilbage)`,
            target: '/reservedele',
            targetId: sp.id,
            createdAt: today,
          })
        })
    }

    if (settings.notifications.overduePM) {
      pmTasks
        .filter(pm => pm.nextDue < today && pm.status !== 'Udført')
        .forEach(pm => {
          notes.push({
            id: `n_pm_${pm.id}`,
            type: 'overdue_pm',
            message: `Forfaldne PM: ${pm.title}`,
            target: '/planlagt',
            targetId: pm.id,
            createdAt: today,
          })
        })
    }

    const notifSettings = settings.notifications as Record<string, boolean>

    if (notifSettings.openDeviations) {
      deviations
        .filter(d => ['Åben', 'Under undersøgelse'].includes(d.status))
        .slice(0, 5)
        .forEach(d => notes.push({
          id: `n_dev_${d.id}`, type: 'open_deviation' as AppNotification['type'],
          message: `Åben afvigelse: ${d.title}`,
          target: '/afvigelser', targetId: d.id, createdAt: today,
        }))
    }

    if (notifSettings.overdueCapa) {
      capaRecords
        .filter(c => c.dueDate < today && !['Verificeret', 'Lukket'].includes(c.status))
        .forEach(c => notes.push({
          id: `n_capa_${c.id}`, type: 'overdue_capa' as AppNotification['type'],
          message: `Forfalden CAPA: ${c.title}`,
          target: '/capa', targetId: c.id, createdAt: today,
        }))
    }

    if (notifSettings.pendingChanges) {
      changeRecords
        .filter(c => c.status === 'Under vurdering')
        .slice(0, 5)
        .forEach(c => notes.push({
          id: `n_cr_${c.id}`, type: 'pending_change' as AppNotification['type'],
          message: `Afventer godkendelse: ${c.title}`,
          target: '/aendringsstyring', targetId: c.id, createdAt: today,
        }))
    }

    return notes
  },
}))
