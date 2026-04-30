import { ipcMain } from 'electron'
import { loadConfig, saveConfig, testConnection, getPool } from '../db'
import { SCHEMA_STATEMENTS } from '../schema'
import { seedIfEmpty } from '../seed'
import { registerDataHandlers } from './data'
import { registerWOHandlers } from './workorders'
import { registerAssetHandlers } from './assets'
import { registerSPHandlers } from './spareParts'
import { registerPMHandlers } from './pmTasks'
import { registerLogHandlers } from './logEntries'
import { registerGMPHandlers } from './gmp'
import { registerSettingsHandlers } from './settings'
import { registerUserHandlers } from './users'

export function registerHandlers(): void {
  // ── DB / Connection ────────────────────────────────────────────────────────
  ipcMain.handle('db:getConfig', () => loadConfig())

  ipcMain.handle('db:saveConfig', (_e, config) => {
    saveConfig(config)
  })

  ipcMain.handle('db:testConnection', async (_e, config) => {
    return testConnection(config)
  })

  ipcMain.handle('db:init', async () => {
    const pool = await getPool()
    for (const stmt of SCHEMA_STATEMENTS) {
      try {
        await pool.request().query(stmt)
      } catch (err) {
        console.error('Schema statement failed:', (err as Error).message)
      }
    }
    await seedIfEmpty(pool)
    return { ok: true }
  })

  // ── Audit (simple insert, no module needed) ────────────────────────────────
  ipcMain.handle('audit:add', async (_e, entry) => {
    const pool = await getPool()
    await pool.request()
      .input('id', entry.id)
      .input('timestamp', entry.timestamp)
      .input('userId', entry.userId)
      .input('action', entry.action)
      .input('entityType', entry.entityType)
      .input('entityId', entry.entityId)
      .input('entityName', entry.entityName ?? null)
      .input('details', entry.details ?? null)
      .query(`INSERT INTO audit_log
        (id,timestamp,user_id,action,entity_type,entity_id,entity_name,details)
        VALUES (@id,@timestamp,@userId,@action,@entityType,@entityId,@entityName,@details)`)
  })

  registerDataHandlers()
  registerWOHandlers()
  registerAssetHandlers()
  registerSPHandlers()
  registerPMHandlers()
  registerLogHandlers()
  registerGMPHandlers()
  registerSettingsHandlers()
  registerUserHandlers()
}
