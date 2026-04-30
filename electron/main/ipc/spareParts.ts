import { ipcMain } from 'electron'
import { getPool } from '../db'

export function registerSPHandlers(): void {
  ipcMain.handle('sp:adjustStock', async (_e, id, delta, date, note) => {
    const pool = await getPool()
    await pool.request()
      .input('id', id).input('delta', delta)
      .query(`UPDATE spare_parts SET quantity = quantity + @delta WHERE id = @id`)
    await pool.request()
      .input('spId', id).input('date', date).input('delta', delta).input('note', note ?? null)
      .query(`INSERT INTO spare_part_history (spare_part_id, date, change_delta, note)
              VALUES (@spId, @date, @delta, @note)`)
  })
}
