import { create } from 'zustand'
import { addDays } from 'date-fns'
import type {
  WorkOrder, WorkOrderStatus, Priority, WorkOrderCategory,
  SparePart, PMTask, LogEntry, User, Asset, Supplier,
  AppNotification, Settings, WidgetConfig,
} from '../types'
import {
  USERS, ASSETS, WORK_ORDERS, SPARE_PARTS, SUPPLIERS, PM_TASKS, LOG_ENTRIES,
} from '../data/mockData'

interface AppState {
  // Data
  users: User[]
  assets: Asset[]
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

  createWorkOrder: (wo) => {
    const existing = get().workOrders.map(w => w.id)
    const id = nextId('AO-', existing)
    const newWO: WorkOrder = {
      ...wo,
      id,
      createdAt: todayStr(),
      tasks: [],
      comments: [],
      timeLog: [],
      spareParts: [],
      history: [],
    }
    set(s => ({ workOrders: [newWO, ...s.workOrders] }))
    return id
  },

  updateWorkOrder: (id, patch) => {
    set(s => ({
      workOrders: s.workOrders.map(wo => {
        if (wo.id !== id) return wo
        const updated = { ...wo, ...patch }
        // Add history entry for status change
        if (patch.status && patch.status !== wo.status) {
          updated.history = [
            {
              id: nextId('h', wo.history.map(h => h.id)),
              field: 'Status',
              oldValue: wo.status,
              newValue: patch.status,
              userId: s.activeUserId,
              date: todayStr(),
            },
            ...wo.history,
          ]
        }
        return updated
      }),
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
    set(s => ({
      pmTasks: s.pmTasks.map(pm => {
        if (pm.id !== id) return pm
        const today = new Date()
        const nextDue = addDays(today, pm.frequencyDays).toISOString().split('T')[0]
        return {
          ...pm,
          lastDone: todayStr(),
          nextDue,
          status: 'Udført' as const,
          tasks: pm.tasks.map(t => ({ ...t, done: false })),
        }
      }),
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
    set(s => ({
      spareParts: s.spareParts.map(sp => {
        if (sp.id !== id) return sp
        const newQty = Math.max(0, sp.quantity + delta)
        return {
          ...sp,
          quantity: newQty,
          history: [
            { date: todayStr(), change: delta, note: delta > 0 ? 'Manuel tilføjelse' : 'Manuel fradrag' },
            ...sp.history,
          ],
        }
      }),
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
