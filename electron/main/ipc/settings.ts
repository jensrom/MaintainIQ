import { ipcMain } from 'electron'
import { getPool } from '../db'

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:update', async (_e, patch) => {
    const pool = await getPool()
    const n = patch.notifications ?? {}
    const setClauses: string[] = []
    const req = pool.request()
    const add = (col: string, val: unknown) => { req.input(col, val); setClauses.push(`${col} = @${col}`) }

    if ('darkMode'   in patch) add('dark_mode',   patch.darkMode ? 1 : 0)
    if ('pharmaMode' in patch) add('pharma_mode', patch.pharmaMode ? 1 : 0)
    if ('overdueWO'       in n) add('notif_overdue_wo',      n.overdueWO ? 1 : 0)
    if ('newRequests'     in n) add('notif_new_requests',    n.newRequests ? 1 : 0)
    if ('lowStock'        in n) add('notif_low_stock',       n.lowStock ? 1 : 0)
    if ('emptyStock'      in n) add('notif_empty_stock',     n.emptyStock ? 1 : 0)
    if ('overduePM'       in n) add('notif_overdue_pm',      n.overduePM ? 1 : 0)
    if ('openDeviations'  in n) add('notif_open_deviations', n.openDeviations ? 1 : 0)
    if ('overdueCapa'     in n) add('notif_overdue_capa',    n.overdueCapa ? 1 : 0)
    if ('pendingChanges'  in n) add('notif_pending_changes', n.pendingChanges ? 1 : 0)

    if (setClauses.length > 0) {
      await req.query(`UPDATE app_settings SET ${setClauses.join(', ')} WHERE id = 1`)
    }
  })

  ipcMain.handle('settings:updateCompany', async (_e, patch) => {
    const pool = await getPool()
    const map: Record<string, string> = {
      name: 'name', logo: 'logo', logoOnPrint: 'logo_on_print', logoOnQR: 'logo_on_qr',
      address: 'address', city: 'city', zip: 'zip', country: 'country',
      phone: 'phone', email: 'email', vatNumber: 'vat_number', website: 'website',
    }
    const setClauses: string[] = []
    const req = pool.request()
    let i = 0
    for (const [js, db] of Object.entries(map)) {
      if (js in patch) {
        const pname = `p${i++}`
        const val = (js === 'logoOnPrint' || js === 'logoOnQR') ? (patch[js] ? 1 : 0) : (patch[js] ?? null)
        req.input(pname, val)
        setClauses.push(`${db} = @${pname}`)
      }
    }
    if (setClauses.length > 0) {
      await req.query(`UPDATE company_settings SET ${setClauses.join(', ')} WHERE id = 1`)
    }
  })

  ipcMain.handle('settings:updateWidget', async (_e, id, displayType) => {
    const pool = await getPool()
    const exists = await pool.request().input('id', id)
      .query(`SELECT id FROM widget_configs WHERE id = @id`)
    if (exists.recordset.length > 0) {
      await pool.request().input('id', id).input('dt', displayType)
        .query(`UPDATE widget_configs SET display_type = @dt WHERE id = @id`)
    } else {
      await pool.request().input('id', id).input('dt', displayType)
        .query(`INSERT INTO widget_configs (id, display_type) VALUES (@id, @dt)`)
    }
  })
}
