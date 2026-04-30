import { ipcMain } from 'electron'
import { getPool } from '../db'

export function registerUserHandlers(): void {
  ipcMain.handle('user:update', async (_e, id, patch) => {
    const pool = await getPool()
    const map: Record<string, string> = {
      name: 'name', initials: 'initials', title: 'title', email: 'email',
      phone: 'phone', role: 'role', hourlyRate: 'hourly_rate',
      isActive: 'is_active', mfaEnabled: 'mfa_enabled',
      entraId: 'entra_id', passwordHash: 'password_hash', lastLogin: 'last_login',
    }
    const setClauses: string[] = []
    const req = pool.request().input('id', id)
    let i = 0
    for (const [js, db] of Object.entries(map)) {
      if (js in patch) {
        const pname = `p${i++}`
        const bools = new Set(['isActive', 'mfaEnabled'])
        const val = bools.has(js) ? (patch[js] ? 1 : 0) : (patch[js] ?? null)
        req.input(pname, val)
        setClauses.push(`${db} = @${pname}`)
      }
    }
    if (setClauses.length > 0) {
      await req.query(`UPDATE users SET ${setClauses.join(', ')} WHERE id = @id`)
    }
    // Update group memberships if provided
    if (Array.isArray(patch.groupIds)) {
      await pool.request().input('uid', id).query(`DELETE FROM user_group_members WHERE user_id = @uid`)
      for (const gid of patch.groupIds) {
        await pool.request().input('uid', id).input('gid', gid)
          .query(`INSERT INTO user_group_members (user_id, group_id) VALUES (@uid, @gid)`)
      }
    }
  })
}
