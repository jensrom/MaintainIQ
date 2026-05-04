import { ipcMain } from 'electron'
import { getPool } from '../db'

export function registerLogHandlers(): void {
  ipcMain.handle('log:create', async (_e, entry) => {
    const pool = await getPool()
    await pool.request()
      .input('id', entry.id).input('type', entry.type).input('severity', entry.severity)
      .input('text', entry.text).input('followUp', entry.followUp ? 1 : 0)
      .input('createdAt', entry.createdAt).input('userId', entry.userId)
      .input('tags', JSON.stringify(entry.tags ?? []))
      .query(`INSERT INTO log_entries (id,type,severity,text,follow_up,created_at,user_id,tags)
              VALUES (@id,@type,@severity,@text,@followUp,@createdAt,@userId,@tags)`)

    for (const assetId of (entry.assetIds ?? [])) {
      await pool.request()
        .input('logId', entry.id).input('assetId', assetId)
        .query(`INSERT INTO log_entry_assets (log_id, asset_id) VALUES (@logId, @assetId)`)
    }
  })
}
