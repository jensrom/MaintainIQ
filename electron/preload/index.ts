import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Connection ──────────────────────────────────────────────────────────────
  db_getConfig:      ()             => ipcRenderer.invoke('db:getConfig'),
  db_saveConfig:     (c: unknown)   => ipcRenderer.invoke('db:saveConfig', c),
  db_testConnection: (c: unknown)   => ipcRenderer.invoke('db:testConnection', c),
  db_init:           ()             => ipcRenderer.invoke('db:init'),

  // ── Data ────────────────────────────────────────────────────────────────────
  data_loadAll: () => ipcRenderer.invoke('data:loadAll'),

  // ── Work Orders ─────────────────────────────────────────────────────────────
  wo_create:      (wo: unknown)                                   => ipcRenderer.invoke('wo:create', wo),
  wo_update:      (id: string, p: unknown, h?: unknown)           => ipcRenderer.invoke('wo:update', id, p, h),
  wo_addComment:  (woId: string, id: string, userId: string, text: string) =>
    ipcRenderer.invoke('wo:addComment', woId, id, userId, text),
  wo_logTime:     (woId: string, entry: unknown)                  => ipcRenderer.invoke('wo:logTime', woId, entry),
  wo_toggleTask:  (woId: string, taskId: string, done: boolean)   => ipcRenderer.invoke('wo:toggleTask', woId, taskId, done),
  wo_addSparePart:(woId: string, entry: unknown)                  => ipcRenderer.invoke('wo:addSparePart', woId, entry),

  // ── Assets ──────────────────────────────────────────────────────────────────
  asset_create: (a: unknown)                  => ipcRenderer.invoke('asset:create', a),
  asset_update: (id: string, p: unknown)      => ipcRenderer.invoke('asset:update', id, p),
  asset_delete: (id: string)                  => ipcRenderer.invoke('asset:delete', id),

  // ── Spare Parts ─────────────────────────────────────────────────────────────
  sp_adjustStock: (id: string, delta: number, date: string, note: string) =>
    ipcRenderer.invoke('sp:adjustStock', id, delta, date, note),

  // ── PM Tasks ────────────────────────────────────────────────────────────────
  pm_markDone:  (id: string, today: string, nextDue: string) => ipcRenderer.invoke('pm:markDone', id, today, nextDue),
  pm_create:    (task: unknown)                              => ipcRenderer.invoke('pm:create', task),
  pm_toggleStep:(pmId: string, stepId: string, done: boolean)=> ipcRenderer.invoke('pm:toggleStep', pmId, stepId, done),

  // ── Log Entries ─────────────────────────────────────────────────────────────
  log_create: (entry: unknown) => ipcRenderer.invoke('log:create', entry),

  // ── GMP ─────────────────────────────────────────────────────────────────────
  gmp_updateDeviation: (id: string, p: unknown) => ipcRenderer.invoke('gmp:updateDeviation', id, p),
  gmp_updateCapa:      (id: string, p: unknown) => ipcRenderer.invoke('gmp:updateCapa', id, p),
  gmp_updateChange:    (id: string, p: unknown) => ipcRenderer.invoke('gmp:updateChange', id, p),
  gmp_createDeviation: (d: unknown)             => ipcRenderer.invoke('gmp:createDeviation', d),
  gmp_createCapa:      (c: unknown)             => ipcRenderer.invoke('gmp:createCapa', c),
  gmp_createChange:    (c: unknown)             => ipcRenderer.invoke('gmp:createChange', c),

  // ── Settings ────────────────────────────────────────────────────────────────
  settings_update:        (p: unknown)                    => ipcRenderer.invoke('settings:update', p),
  settings_updateCompany: (p: unknown)                    => ipcRenderer.invoke('settings:updateCompany', p),
  settings_updateWidget:  (id: string, dt: string)        => ipcRenderer.invoke('settings:updateWidget', id, dt),

  // ── Users ────────────────────────────────────────────────────────────────────
  user_update: (id: string, p: unknown) => ipcRenderer.invoke('user:update', id, p),

  // ── Audit ────────────────────────────────────────────────────────────────────
  audit_add: (entry: unknown) => ipcRenderer.invoke('audit:add', entry),
})
