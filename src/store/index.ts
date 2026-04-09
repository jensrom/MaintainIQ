import { create } from 'zustand'
import { addDays } from 'date-fns'
import type {
  WorkOrder, WorkOrderStatus, Priority, WorkOrderCategory,
  SparePart, PMTask, LogEntry, User, Asset, AssetCategory, LookupTable, LookupItem, Supplier,
  AppNotification, Settings, WidgetConfig, AuditEntry, AuditAction,
} from '../types'
import {
  USERS, ASSETS, ASSET_CATEGORIES, LOOKUP_TABLES,
  WORK_ORDERS, SPARE_PARTS, SUPPLIERS, PM_TASKS, LOG_ENTRIES,
} from '../data/mockData'

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
  // Actions — Spare Parts
  adjustStock: (id: string, delta: number) => void
  // Actions — Log
  createLogEntry: (entry: Omit<LogEntry, 'id' | 'createdAt'>) => void
  // Actions — Settings / UI
  setActiveUser: (id: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  updateWidgetConfig: (id: string, displayType: WidgetConfig['displayType']) => void
  setSidebarCollapsed: (v: boolean) => void
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
  activeUserId: 'u4',
  sidebarCollapsed: false,
  settings: {
    darkMode: false,
    pharmaMode: true,
    notifications: {
      overdueWO: true,
      newRequests: true,
      lowStock: true,
      emptyStock: true,
      overduePM: true,
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
    return id
  },

  updateWorkOrder: (id, patch) => {
    const wo = get().workOrders.find(w => w.id === id)
    const ts = nowStr()
    set(s => ({
      workOrders: s.workOrders.map(w => {
        if (w.id !== id) return w
        const updated = { ...w, ...patch }
        if (patch.status && patch.status !== w.status) {
          updated.history = [
            { id: nextId('h', w.history.map(h => h.id)), field: 'Status', oldValue: w.status,
              newValue: patch.status, userId: s.activeUserId, date: todayStr() },
            ...w.history,
          ]
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
    set(s => ({
      spareParts: s.spareParts.map(part => {
        if (part.id !== id) return part
        const newQty = Math.max(0, part.quantity + delta)
        return { ...part, quantity: newQty, history: [{ date: todayStr(), change: delta, note: delta > 0 ? 'Manuel tilføjelse' : 'Manuel fradrag' }, ...part.history] }
      }),
      auditLog: sp ? [
        { id: nextId('au', s.auditLog.map(a => a.id)), timestamp: ts, userId: s.activeUserId,
          action: 'adjust_stock', entityType: 'spare_part', entityId: id, entityName: sp.name,
          details: `Lager justeret ${delta > 0 ? '+' : ''}${delta} → ${Math.max(0, sp.quantity + delta)} stk` },
        ...s.auditLog,
      ] : s.auditLog,
    }))
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

  setActiveUser: (id) => set({ activeUserId: id }),

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

  getNotifications: () => {
    const { workOrders, spareParts, pmTasks, settings } = get()
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

    return notes
  },
}))
