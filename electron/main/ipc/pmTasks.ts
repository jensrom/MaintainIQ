import { ipcMain } from 'electron'
import { getPool } from '../db'

export function registerPMHandlers(): void {
  ipcMain.handle('pm:markDone', async (_e, id, today, nextDue) => {
    const pool = await getPool()
    await pool.request()
      .input('id', id).input('today', today).input('nextDue', nextDue)
      .query(`UPDATE pm_tasks SET last_done = @today, next_due = @nextDue, status = 'Udført' WHERE id = @id`)
    await pool.request()
      .input('pmId', id)
      .query(`UPDATE pm_task_steps SET done = 0 WHERE pm_id = @pmId`)
  })

  ipcMain.handle('pm:create', async (_e, task) => {
    const pool = await getPool()
    await pool.request()
      .input('id', task.id).input('title', task.title)
      .input('intervalType', task.intervalType).input('freqDays', task.frequencyDays)
      .input('freqLabel', task.frequencyLabel ?? null).input('lastDone', task.lastDone ?? null)
      .input('nextDue', task.nextDue).input('status', task.status ?? 'Kommende')
      .input('estHours', task.estimatedHours ?? 0).input('assigneeId', task.assigneeId ?? null)
      .input('isPharma', task.isPharma ? 1 : 0)
      .query(`INSERT INTO pm_tasks
        (id,title,interval_type,frequency_days,frequency_label,last_done,next_due,
         status,estimated_hours,assignee_id,is_pharma)
        VALUES (@id,@title,@intervalType,@freqDays,@freqLabel,@lastDone,@nextDue,
         @status,@estHours,@assigneeId,@isPharma)`)

    for (const assetId of (task.assetIds ?? [])) {
      await pool.request()
        .input('pmId', task.id).input('assetId', assetId)
        .query(`INSERT INTO pm_task_assets (pm_id, asset_id) VALUES (@pmId, @assetId)`)
    }

    let stepOrder = 0
    for (const step of (task.tasks ?? [])) {
      await pool.request()
        .input('id', step.id).input('pmId', task.id).input('text', step.text)
        .input('done', 0).input('order', stepOrder++)
        .query(`INSERT INTO pm_task_steps (id, pm_id, text, done, sort_order)
                VALUES (@id, @pmId, @text, @done, @order)`)
    }
  })

  ipcMain.handle('pm:toggleStep', async (_e, _pmId, stepId, done) => {
    const pool = await getPool()
    await pool.request()
      .input('id', stepId).input('done', done ? 1 : 0)
      .query(`UPDATE pm_task_steps SET done = @done WHERE id = @id`)
  })
}
