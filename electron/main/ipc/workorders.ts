import { ipcMain } from 'electron'
import { getPool } from '../db'

export function registerWOHandlers(): void {
  ipcMain.handle('wo:create', async (_e, wo) => {
    const pool = await getPool()
    await pool.request()
      .input('id', wo.id).input('title', wo.title).input('assetId', wo.assetId ?? null)
      .input('assigneeId', wo.assigneeId ?? null).input('status', wo.status)
      .input('priority', wo.priority).input('category', wo.category)
      .input('dueDate', wo.dueDate).input('description', wo.description ?? null)
      .input('isPharma', wo.isPharma ? 1 : 0).input('createdAt', wo.createdAt)
      .input('requesterName', wo.requesterName ?? null)
      .input('requesterEmail', wo.requesterEmail ?? null)
      .input('requesterPhone', wo.requesterPhone ?? null)
      .query(`INSERT INTO work_orders
        (id,title,asset_id,assignee_id,status,priority,category,due_date,
         description,is_pharma,created_at,requester_name,requester_email,requester_phone)
        VALUES (@id,@title,@assetId,@assigneeId,@status,@priority,@category,@dueDate,
         @description,@isPharma,@createdAt,@requesterName,@requesterEmail,@requesterPhone)`)
  })

  ipcMain.handle('wo:update', async (_e, id, patch, historyEntry?) => {
    const pool = await getPool()
    const map: Record<string, string> = {
      status: 'status', priority: 'priority', category: 'category',
      dueDate: 'due_date', description: 'description', assigneeId: 'assignee_id',
      assetId: 'asset_id', isPharma: 'is_pharma',
      requesterName: 'requester_name', requesterEmail: 'requester_email',
      requesterPhone: 'requester_phone',
    }
    const setClauses: string[] = []
    const req = pool.request().input('id', id)
    let i = 0
    for (const [jsKey, dbCol] of Object.entries(map)) {
      if (jsKey in patch) {
        const pname = `p${i++}`
        const val = jsKey === 'isPharma' ? (patch[jsKey] ? 1 : 0) : (patch[jsKey] ?? null)
        req.input(pname, val)
        setClauses.push(`${dbCol} = @${pname}`)
      }
    }
    if (setClauses.length > 0) {
      await req.query(`UPDATE work_orders SET ${setClauses.join(', ')} WHERE id = @id`)
    }
    if (historyEntry) {
      await pool.request()
        .input('id', historyEntry.id).input('woId', id)
        .input('field', historyEntry.field).input('oldValue', historyEntry.oldValue ?? null)
        .input('newValue', historyEntry.newValue ?? null)
        .input('userId', historyEntry.userId).input('date', historyEntry.date)
        .query(`INSERT INTO wo_history (id,wo_id,field,old_value,new_value,user_id,date)
                VALUES (@id,@woId,@field,@oldValue,@newValue,@userId,@date)`)
    }
  })

  ipcMain.handle('wo:addComment', async (_e, woId, id, userId, text) => {
    const today = new Date().toISOString().split('T')[0]
    const pool = await getPool()
    await pool.request()
      .input('id', id).input('woId', woId).input('userId', userId)
      .input('text', text).input('createdAt', today)
      .query(`INSERT INTO wo_comments (id,wo_id,user_id,text,created_at)
              VALUES (@id,@woId,@userId,@text,@createdAt)`)
  })

  ipcMain.handle('wo:logTime', async (_e, _woId, entry) => {
    const pool = await getPool()
    await pool.request()
      .input('id', entry.id).input('woId', entry.woId ?? _woId)
      .input('userId', entry.userId).input('hours', entry.hours)
      .input('note', entry.note ?? null).input('date', entry.date)
      .query(`INSERT INTO wo_time_log (id,wo_id,user_id,hours,note,date)
              VALUES (@id,@woId,@userId,@hours,@note,@date)`)
  })

  ipcMain.handle('wo:toggleTask', async (_e, _woId, taskId, done) => {
    const pool = await getPool()
    await pool.request()
      .input('id', taskId).input('done', done ? 1 : 0)
      .query(`UPDATE wo_tasks SET done = @done WHERE id = @id`)
  })

  ipcMain.handle('wo:addSparePart', async (_e, woId, entry) => {
    const pool = await getPool()
    // Upsert: update qty if exists, else insert
    const existing = await pool.request()
      .input('woId', woId).input('spId', entry.sparePartId)
      .query(`SELECT id FROM wo_spare_parts_usage WHERE wo_id = @woId AND spare_part_id = @spId`)
    if (existing.recordset.length > 0) {
      await pool.request()
        .input('woId', woId).input('spId', entry.sparePartId).input('qty', entry.quantity)
        .query(`UPDATE wo_spare_parts_usage SET quantity = quantity + @qty
                WHERE wo_id = @woId AND spare_part_id = @spId`)
    } else {
      await pool.request()
        .input('id', entry.id).input('woId', woId)
        .input('spId', entry.sparePartId).input('qty', entry.quantity)
        .query(`INSERT INTO wo_spare_parts_usage (id,wo_id,spare_part_id,quantity)
                VALUES (@id,@woId,@spId,@qty)`)
    }
  })
}
