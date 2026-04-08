export type WorkOrderStatus =
  | 'Arbejdsanmodning'
  | 'Åben'
  | 'I gang'
  | 'Planlagt'
  | 'Afventer'
  | 'Afsluttet'
  | 'Annulleret'

export type Priority = 'Kritisk' | 'Høj' | 'Normal' | 'Lav'

export type WorkOrderCategory =
  | 'Forebyggende'
  | 'Afhjælpende'
  | 'Inspektion'
  | 'Projekt'
  | 'Rengøring'

export type AssetType = 'Site' | 'Lokation' | 'Enhed' | 'Værktøj'

export type UserRole =
  | 'Vedligeholdstekniker'
  | 'Senior Tekniker'
  | 'Planlægger'
  | 'Driftsleder'
  | 'Kvalitetschef'

export type PMIntervalType =
  | 'Fast interval'
  | 'Flydende interval'
  | 'Målerbaseret'
  | 'Sæsonbaseret'
  | 'Hændelsesbaseret'

export type LogEntryType =
  | 'Observation'
  | 'Fejl'
  | 'Reparation'
  | 'Inspektion'
  | 'Note'

export type LogSeverity = 'Lav' | 'Medium' | 'Høj' | 'Kritisk'

export type NotificationType =
  | 'overdue_wo'
  | 'new_request'
  | 'low_stock'
  | 'empty_stock'
  | 'overdue_pm'

export interface User {
  id: string
  name: string
  initials: string
  title: string
  email: string
  phone: string
  role: UserRole
  hourlyRate: number
}

export interface Asset {
  id: string
  name: string
  type: AssetType
  parentId: string | null
  criticality: 'Kritisk' | 'Høj' | 'Normal' | 'Lav'
  location: string
  description?: string
}

export interface WorkOrderTask {
  id: string
  text: string
  done: boolean
}

export interface WorkOrderComment {
  id: string
  userId: string
  text: string
  createdAt: string
}

export interface WorkOrderTimeLog {
  id: string
  userId: string
  hours: number
  note: string
  date: string
}

export interface WorkOrderSparePartUsage {
  id: string
  sparePartId: string
  quantity: number
}

export interface WorkOrderHistoryEntry {
  id: string
  field: string
  oldValue: string
  newValue: string
  userId: string
  date: string
}

export interface WorkOrder {
  id: string
  title: string
  assetId: string
  assigneeId: string | null
  status: WorkOrderStatus
  priority: Priority
  category: WorkOrderCategory
  dueDate: string
  description: string
  isPharma: boolean
  createdAt: string
  requesterName?: string
  requesterEmail?: string
  requesterPhone?: string
  tasks: WorkOrderTask[]
  comments: WorkOrderComment[]
  timeLog: WorkOrderTimeLog[]
  spareParts: WorkOrderSparePartUsage[]
  history: WorkOrderHistoryEntry[]
}

export interface SparePart {
  id: string
  name: string
  partNumber: string
  quantity: number
  minQuantity: number
  location: string
  price: number
  supplierId: string
  history: { date: string; change: number; note: string }[]
}

export interface Supplier {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  category: string
}

export interface PMTask {
  id: string
  title: string
  assetIds: string[]
  intervalType: PMIntervalType
  frequencyDays: number
  frequencyLabel: string
  lastDone: string | null
  nextDue: string
  status: 'Forfaldne' | 'Kommende' | 'Udført'
  estimatedHours: number
  assigneeId: string | null
  tasks: WorkOrderTask[]
  isPharma: boolean
}

export interface LogEntry {
  id: string
  assetIds: string[]
  type: LogEntryType
  severity: LogSeverity
  text: string
  followUp: boolean
  tags: string[]
  createdAt: string
  userId: string
}

export interface AppNotification {
  id: string
  type: NotificationType
  message: string
  target: string
  targetId?: string
  createdAt: string
}

export interface WidgetConfig {
  id: string
  displayType: 'count' | 'percent' | 'pie' | 'bar'
}

export interface Settings {
  darkMode: boolean
  pharmaMode: boolean
  notifications: {
    overdueWO: boolean
    newRequests: boolean
    lowStock: boolean
    emptyStock: boolean
    overduePM: boolean
  }
}
