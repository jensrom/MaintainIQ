export interface ConnectionConfig {
  server: string
  port: number
  database: string
  windowsAuth: boolean
  user?: string
  password?: string
  encrypt: boolean
  trustServerCertificate: boolean
}

declare global {
  interface Window {
    electronAPI?: {
      db_getConfig: () => Promise<ConnectionConfig | null>
      db_saveConfig: (c: ConnectionConfig) => Promise<void>
      db_testConnection: (c: ConnectionConfig) => Promise<{ ok: boolean; error?: string }>
      db_init: () => Promise<{ ok: boolean }>
      data_loadAll: () => Promise<Record<string, unknown>>
      wo_create: (wo: unknown) => Promise<void>
      wo_update: (id: string, patch: unknown, historyEntry?: unknown) => Promise<void>
      wo_addComment: (woId: string, id: string, userId: string, text: string) => Promise<void>
      wo_logTime: (woId: string, entry: unknown) => Promise<void>
      wo_toggleTask: (woId: string, taskId: string, done: boolean) => Promise<void>
      wo_addSparePart: (woId: string, entry: unknown) => Promise<void>
      asset_create: (a: unknown) => Promise<void>
      asset_update: (id: string, patch: unknown) => Promise<void>
      asset_delete: (id: string) => Promise<void>
      sp_adjustStock: (id: string, delta: number, date: string, note: string) => Promise<void>
      pm_markDone: (id: string, today: string, nextDue: string) => Promise<void>
      pm_create: (task: unknown) => Promise<void>
      pm_toggleStep: (pmId: string, stepId: string, done: boolean) => Promise<void>
      log_create: (entry: unknown) => Promise<void>
      gmp_updateDeviation: (id: string, patch: unknown) => Promise<void>
      gmp_updateCapa: (id: string, patch: unknown) => Promise<void>
      gmp_updateChange: (id: string, patch: unknown) => Promise<void>
      gmp_createDeviation: (d: unknown) => Promise<string>
      gmp_createCapa: (c: unknown) => Promise<string>
      gmp_createChange: (c: unknown) => Promise<string>
      settings_update: (patch: unknown) => Promise<void>
      settings_updateCompany: (patch: unknown) => Promise<void>
      settings_updateWidget: (id: string, displayType: string) => Promise<void>
      user_update: (id: string, patch: unknown) => Promise<void>
      audit_add: (entry: unknown) => Promise<void>
    }
  }
}
