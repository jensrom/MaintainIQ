import { ipcMain } from 'electron'
import { getPool } from '../db'

function nextGmpId(prefix: string, existing: string[]): string {
  const nums = existing
    .filter(id => id.startsWith(prefix))
    .map(id => parseInt(id.replace(prefix, '')) || 0)
  const max = nums.length ? Math.max(...nums) : 0
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

export function registerGMPHandlers(): void {
  // ── Deviations ────────────────────────────────────────────────────────────
  ipcMain.handle('gmp:updateDeviation', async (_e, id, patch) => {
    const pool = await getPool()
    const map: Record<string, string> = {
      status: 'status', severity: 'severity', rootCause: 'root_cause',
      assetName: 'asset_name', description: 'description',
    }
    const setClauses: string[] = []
    const req = pool.request().input('id', id)
    let i = 0
    for (const [js, db] of Object.entries(map)) {
      if (js in patch) {
        const pname = `p${i++}`
        req.input(pname, patch[js] ?? null)
        setClauses.push(`${db} = @${pname}`)
      }
    }
    if (setClauses.length > 0) {
      await req.query(`UPDATE deviations SET ${setClauses.join(', ')} WHERE id = @id`)
    }
    // Update CAPA links if provided
    if (Array.isArray(patch.capaIds)) {
      await pool.request().input('id', id).query(`DELETE FROM deviation_capa_links WHERE deviation_id = @id`)
      for (const capaId of patch.capaIds) {
        await pool.request()
          .input('devId', id).input('capaId', capaId)
          .query(`INSERT INTO deviation_capa_links (deviation_id, capa_id) VALUES (@devId, @capaId)`)
      }
    }
  })

  ipcMain.handle('gmp:createDeviation', async (_e, d) => {
    const pool = await getPool()
    const existing = await pool.request().query(`SELECT id FROM deviations`)
    const id = d.id ?? nextGmpId('DEV-', existing.recordset.map((r: { id: string }) => r.id))
    await pool.request()
      .input('id', id).input('title', d.title).input('type', d.type)
      .input('severity', d.severity).input('status', d.status ?? 'Åben')
      .input('reportedBy', d.reportedBy).input('reportedAt', d.reportedAt)
      .input('assetName', d.assetName ?? null).input('description', d.description ?? null)
      .input('rootCause', d.rootCause ?? null)
      .query(`INSERT INTO deviations (id,title,type,severity,status,reported_by,reported_at,asset_name,description,root_cause)
              VALUES (@id,@title,@type,@severity,@status,@reportedBy,@reportedAt,@assetName,@description,@rootCause)`)
    return id
  })

  // ── CAPA ─────────────────────────────────────────────────────────────────
  ipcMain.handle('gmp:updateCapa', async (_e, id, patch) => {
    const pool = await getPool()
    const map: Record<string, string> = {
      status: 'status', assignee: 'assignee', dueDate: 'due_date',
      description: 'description', completedAt: 'completed_at',
    }
    const setClauses: string[] = []
    const req = pool.request().input('id', id)
    let i = 0
    for (const [js, db] of Object.entries(map)) {
      if (js in patch) {
        const pname = `p${i++}`
        req.input(pname, patch[js] ?? null)
        setClauses.push(`${db} = @${pname}`)
      }
    }
    if (setClauses.length > 0) {
      await req.query(`UPDATE capa_records SET ${setClauses.join(', ')} WHERE id = @id`)
    }
    // Update actionsDone if provided
    if (Array.isArray(patch.actionsDone)) {
      const steps = await pool.request()
        .input('capaId', id)
        .query(`SELECT id, sort_order FROM capa_actions WHERE capa_id = @capaId ORDER BY sort_order`)
      for (const step of steps.recordset) {
        const done = patch.actionsDone[step.sort_order] ?? false
        await pool.request()
          .input('stepId', step.id).input('done', done ? 1 : 0)
          .query(`UPDATE capa_actions SET done = @done WHERE id = @stepId`)
      }
    }
  })

  ipcMain.handle('gmp:createCapa', async (_e, c) => {
    const pool = await getPool()
    const existing = await pool.request().query(`SELECT id FROM capa_records`)
    const id = c.id ?? nextGmpId('CAPA-', existing.recordset.map((r: { id: string }) => r.id))
    await pool.request()
      .input('id', id).input('title', c.title).input('type', c.type)
      .input('devId', c.deviationId ?? null).input('assignee', c.assignee)
      .input('dueDate', c.dueDate).input('status', c.status ?? 'Åben')
      .input('description', c.description ?? null).input('completedAt', c.completedAt ?? null)
      .query(`INSERT INTO capa_records (id,title,type,deviation_id,assignee,due_date,status,description,completed_at)
              VALUES (@id,@title,@type,@devId,@assignee,@dueDate,@status,@description,@completedAt)`)
    let order = 0
    for (const action of (c.actions ?? [])) {
      const done = c.actionsDone?.[order] ?? false
      await pool.request()
        .input('capaId', id).input('text', action).input('done', done ? 1 : 0).input('order', order++)
        .query(`INSERT INTO capa_actions (capa_id, text, done, sort_order) VALUES (@capaId, @text, @done, @order)`)
    }
    return id
  })

  // ── Change Requests ───────────────────────────────────────────────────────
  ipcMain.handle('gmp:updateChange', async (_e, id, patch) => {
    const pool = await getPool()
    const map: Record<string, string> = {
      status: 'status', priority: 'priority', targetDate: 'target_date',
      description: 'description', reason: 'reason', impactAssessment: 'impact_assessment',
      approvedBy: 'approved_by', approvedAt: 'approved_at',
      implementedAt: 'implemented_at', verifiedAt: 'verified_at',
    }
    const setClauses: string[] = []
    const req = pool.request().input('id', id)
    let i = 0
    for (const [js, db] of Object.entries(map)) {
      if (js in patch) {
        const pname = `p${i++}`
        req.input(pname, patch[js] ?? null)
        setClauses.push(`${db} = @${pname}`)
      }
    }
    if (setClauses.length > 0) {
      await req.query(`UPDATE change_requests SET ${setClauses.join(', ')} WHERE id = @id`)
    }
    if (Array.isArray(patch.affectedAssets)) {
      await pool.request().input('id', id).query(`DELETE FROM change_affected_assets WHERE change_id = @id`)
      for (const code of patch.affectedAssets) {
        await pool.request().input('chId', id).input('code', code)
          .query(`INSERT INTO change_affected_assets (change_id, asset_code) VALUES (@chId, @code)`)
      }
    }
    if (Array.isArray(patch.affectedSOPs)) {
      await pool.request().input('id', id).query(`DELETE FROM change_affected_sops WHERE change_id = @id`)
      for (const sop of patch.affectedSOPs) {
        await pool.request().input('chId', id).input('sop', sop)
          .query(`INSERT INTO change_affected_sops (change_id, sop_code) VALUES (@chId, @sop)`)
      }
    }
  })

  ipcMain.handle('gmp:createChange', async (_e, c) => {
    const pool = await getPool()
    const existing = await pool.request().query(`SELECT id FROM change_requests`)
    const id = c.id ?? nextGmpId('CR-', existing.recordset.map((r: { id: string }) => r.id))
    await pool.request()
      .input('id', id).input('title', c.title).input('type', c.type)
      .input('priority', c.priority ?? 'Normal').input('status', c.status ?? 'Udkast')
      .input('requestedBy', c.requestedBy).input('requestedAt', c.requestedAt)
      .input('targetDate', c.targetDate).input('description', c.description ?? null)
      .input('reason', c.reason ?? null).input('impact', c.impactAssessment ?? null)
      .input('approvedBy', c.approvedBy ?? null).input('approvedAt', c.approvedAt ?? null)
      .input('implementedAt', c.implementedAt ?? null).input('verifiedAt', c.verifiedAt ?? null)
      .query(`INSERT INTO change_requests
        (id,title,type,priority,status,requested_by,requested_at,target_date,
         description,reason,impact_assessment,approved_by,approved_at,implemented_at,verified_at)
        VALUES (@id,@title,@type,@priority,@status,@requestedBy,@requestedAt,@targetDate,
         @description,@reason,@impact,@approvedBy,@approvedAt,@implementedAt,@verifiedAt)`)
    for (const code of (c.affectedAssets ?? [])) {
      await pool.request().input('chId', id).input('code', code)
        .query(`INSERT INTO change_affected_assets (change_id, asset_code) VALUES (@chId, @code)`)
    }
    for (const sop of (c.affectedSOPs ?? [])) {
      await pool.request().input('chId', id).input('sop', sop)
        .query(`INSERT INTO change_affected_sops (change_id, sop_code) VALUES (@chId, @sop)`)
    }
    return id
  })
}
