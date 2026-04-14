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

// Structural base type — determines which fields/tabs are shown
export type AssetBaseType = 'site' | 'lokation' | 'udstyr' | 'vaerktoj' | 'andet'

export interface AssetCategory {
  id: string
  name: string
  baseType: AssetBaseType
  color: string   // 'blue' | 'purple' | 'amber' | 'gray' | 'green' | 'red' | 'slate' | 'orange'
  icon: string    // lucide icon name
  isSystem: boolean
  parentId: string | null
  sortOrder: number
}

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
  groupIds: string[]
  isActive: boolean
  lastLogin?: string
  mfaEnabled: boolean
  entraId?: string
  passwordHash?: string   // mock: plain text password
}

export interface Asset {
  id: string
  name: string
  type: AssetType           // structural hierarchy role
  categoryId: string        // reference to AssetCategory
  parentId: string | null
  criticality: 'Kritisk' | 'Høj' | 'Normal' | 'Lav'
  location: string          // display location string
  description?: string
  code: string              // e.g. 'KOM-001', 'LOK-A1'
  status: 'online' | 'offline'
  image?: string

  // Address — for site/lokation
  address?: string
  city?: string
  province?: string
  zip?: string
  country?: string

  // Equipment metadata — for udstyr/vaerktoj
  brand?: string
  model?: string
  yearOfManufacture?: string
  barcode?: string
  unspscCode?: string
  gang?: string             // aisle
  row?: string
  shelf?: string
  supplierId?: string

  // Common
  account?: string
  department?: string
  notes?: string

  createdAt: string
  updatedAt?: string
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

// ─── Audit log ────────────────────────────────────────────────────────────────

export type AuditAction =
  | 'create_asset' | 'update_asset' | 'delete_asset'
  | 'create_wo' | 'update_wo_status' | 'update_wo'
  | 'create_category' | 'update_category' | 'delete_category'
  | 'create_log_entry' | 'adjust_stock' | 'mark_pm_done'
  | 'create_pm' | 'accept_request'

export interface AuditEntry {
  id: string
  timestamp: string
  userId: string
  action: AuditAction
  entityType: 'asset' | 'work_order' | 'asset_category' | 'spare_part' | 'log_entry' | 'pm_task'
  entityId: string
  entityName: string
  details: string
}

// ─── Lookup tables ────────────────────────────────────────────────────────────

export interface LookupItem {
  id: string
  name: string
  color?: string      // tailwind color key
  sortOrder: number
  isSystem: boolean   // system items can be edited but not deleted
  description?: string
}

export interface LookupTable {
  id: string
  key: string         // e.g. 'work_order_types'
  name: string        // display name
  description?: string
  items: LookupItem[]
}

// ─── Widget / Settings ────────────────────────────────────────────────────────

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

// ─── Permissions & User Groups ────────────────────────────────────────────────

export type Permission =
  | 'view_dashboard'
  | 'view_workorders' | 'create_workorder' | 'edit_workorder'
  | 'close_workorder' | 'approve_workorder' | 'delete_workorder'
  | 'view_assets' | 'create_asset' | 'edit_asset' | 'delete_asset'
  | 'view_spareParts' | 'adjust_stock' | 'manage_spareParts'
  | 'view_pm' | 'create_pm' | 'edit_pm' | 'complete_pm' | 'approve_pm'
  | 'view_logbook' | 'create_logentry'
  | 'view_suppliers' | 'manage_suppliers'
  | 'view_reports' | 'view_audit' | 'export_data'
  | 'admin_users' | 'admin_groups' | 'admin_settings'
  | 'pharma_signoff' | 'pharma_review' | 'pharma_approve'
  | 'manage_calibration' | 'manage_deviations' | 'manage_capa'
  | 'view_guest_requests' | 'manage_guest_requests'

export interface UserGroup {
  id: string
  name: string
  description: string
  siteIds: string[]       // empty = all sites
  permissions: Permission[]
  color: string           // tailwind color key
  isSystem: boolean
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthSession {
  userId: string
  loginTime: string
  expiresAt: string
  method: 'password' | 'entra'
  mfaVerified: boolean
}

// ─── Company Settings ─────────────────────────────────────────────────────────

export interface CompanySettings {
  name: string
  logo?: string           // base64 data URL
  logoOnPrint: boolean
  logoOnQR: boolean
  address?: string
  city?: string
  zip?: string
  country?: string
  phone?: string
  email?: string
  vatNumber?: string
  website?: string
}
