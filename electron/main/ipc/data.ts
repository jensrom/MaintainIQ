import { ipcMain } from 'electron'
import { getPool } from '../db'
import sql from 'mssql'

function bit(v: unknown): boolean { return v === true || v === 1 }

export function registerDataHandlers(): void {
  ipcMain.handle('data:loadAll', async () => {
    const pool = await getPool()

    const [
      usersRes, membersRes, groupsRes, permsRes,
      catRes, assetsRes,
      suppliersRes, spRes, spHistRes,
      woRes, woTasksRes, woCommRes, woTimeRes, woSpRes, woHistRes,
      pmRes, pmAssetsRes, pmStepsRes,
      logRes, logAssetsRes,
      auditRes, settingsRes, companyRes, widgetRes,
      ltRes, liRes,
      devRes, devCapaLinksRes,
      capaRes, capaActRes,
      crRes, crAssetsRes, crSopsRes,
    ] = await Promise.all([
      pool.request().query('SELECT * FROM users'),
      pool.request().query('SELECT * FROM user_group_members'),
      pool.request().query('SELECT * FROM user_groups'),
      pool.request().query('SELECT * FROM user_group_permissions'),
      pool.request().query('SELECT * FROM asset_categories ORDER BY sort_order'),
      pool.request().query('SELECT * FROM assets'),
      pool.request().query('SELECT * FROM suppliers'),
      pool.request().query('SELECT * FROM spare_parts'),
      pool.request().query('SELECT * FROM spare_part_history ORDER BY date DESC'),
      pool.request().query('SELECT * FROM work_orders ORDER BY created_at DESC'),
      pool.request().query('SELECT * FROM wo_tasks ORDER BY sort_order'),
      pool.request().query('SELECT * FROM wo_comments ORDER BY created_at'),
      pool.request().query('SELECT * FROM wo_time_log ORDER BY date DESC'),
      pool.request().query('SELECT * FROM wo_spare_parts_usage'),
      pool.request().query('SELECT * FROM wo_history ORDER BY date DESC'),
      pool.request().query('SELECT * FROM pm_tasks'),
      pool.request().query('SELECT * FROM pm_task_assets'),
      pool.request().query('SELECT * FROM pm_task_steps ORDER BY sort_order'),
      pool.request().query('SELECT * FROM log_entries ORDER BY created_at DESC'),
      pool.request().query('SELECT * FROM log_entry_assets'),
      pool.request().query('SELECT TOP 500 * FROM audit_log ORDER BY timestamp DESC'),
      pool.request().query('SELECT * FROM app_settings WHERE id = 1'),
      pool.request().query('SELECT * FROM company_settings WHERE id = 1'),
      pool.request().query('SELECT * FROM widget_configs'),
      pool.request().query('SELECT * FROM lookup_tables'),
      pool.request().query('SELECT * FROM lookup_items ORDER BY sort_order'),
      pool.request().query('SELECT * FROM deviations ORDER BY reported_at DESC'),
      pool.request().query('SELECT * FROM deviation_capa_links'),
      pool.request().query('SELECT * FROM capa_records ORDER BY due_date'),
      pool.request().query('SELECT * FROM capa_actions ORDER BY sort_order'),
      pool.request().query('SELECT * FROM change_requests ORDER BY requested_at DESC'),
      pool.request().query('SELECT * FROM change_affected_assets'),
      pool.request().query('SELECT * FROM change_affected_sops'),
    ])

    // ── Users ────────────────────────────────────────────────────────────────
    const membersByUser = new Map<string, string[]>()
    for (const m of membersRes.recordset) {
      const arr = membersByUser.get(m.user_id) ?? []
      arr.push(m.group_id)
      membersByUser.set(m.user_id, arr)
    }
    const users = usersRes.recordset.map(r => ({
      id: r.id, name: r.name, initials: r.initials, title: r.title,
      email: r.email, phone: r.phone, role: r.role,
      hourlyRate: Number(r.hourly_rate),
      groupIds: membersByUser.get(r.id) ?? [],
      isActive: bit(r.is_active), lastLogin: r.last_login,
      mfaEnabled: bit(r.mfa_enabled), entraId: r.entra_id,
      passwordHash: r.password_hash,
    }))

    // ── User Groups ──────────────────────────────────────────────────────────
    const permsByGroup = new Map<string, string[]>()
    for (const p of permsRes.recordset) {
      const arr = permsByGroup.get(p.group_id) ?? []
      arr.push(p.permission)
      permsByGroup.set(p.group_id, arr)
    }
    const userGroups = groupsRes.recordset.map(r => ({
      id: r.id, name: r.name, description: r.description ?? '',
      color: r.color, isSystem: bit(r.is_system), siteIds: [],
      permissions: permsByGroup.get(r.id) ?? [],
    }))

    // ── Asset Categories ─────────────────────────────────────────────────────
    const assetCategories = catRes.recordset.map(r => ({
      id: r.id, name: r.name, baseType: r.base_type,
      color: r.color, icon: r.icon,
      isSystem: bit(r.is_system), parentId: r.parent_id, sortOrder: r.sort_order,
    }))

    // ── Assets ───────────────────────────────────────────────────────────────
    const assets = assetsRes.recordset.map(r => ({
      id: r.id, name: r.name, type: r.type, categoryId: r.category_id,
      parentId: r.parent_id, criticality: r.criticality, location: r.location,
      description: r.description, code: r.code, status: r.status, image: r.image,
      address: r.address, city: r.city, province: r.province, zip: r.zip, country: r.country,
      brand: r.brand, model: r.model, yearOfManufacture: r.year_of_manufacture,
      barcode: r.barcode, unspscCode: r.unspsc_code, gang: r.gang, row: r.row_num,
      shelf: r.shelf, supplierId: r.supplier_id, account: r.account,
      department: r.department, notes: r.notes,
      createdAt: r.created_at, updatedAt: r.updated_at,
    }))

    // ── Suppliers ────────────────────────────────────────────────────────────
    const suppliers = suppliersRes.recordset.map(r => ({
      id: r.id, name: r.name, contactPerson: r.contact_person,
      email: r.email, phone: r.phone, category: r.category,
    }))

    // ── Spare Parts ──────────────────────────────────────────────────────────
    const spHistByPart = new Map<string, unknown[]>()
    for (const h of spHistRes.recordset) {
      const arr = spHistByPart.get(h.spare_part_id) ?? []
      arr.push({ date: h.date, change: h.change_delta, note: h.note })
      spHistByPart.set(h.spare_part_id, arr)
    }
    const spareParts = spRes.recordset.map(r => ({
      id: r.id, name: r.name, partNumber: r.part_number,
      quantity: r.quantity, minQuantity: r.min_quantity,
      location: r.location, price: Number(r.price), supplierId: r.supplier_id,
      history: spHistByPart.get(r.id) ?? [],
    }))

    // ── Work Orders ──────────────────────────────────────────────────────────
    const tasksByWO    = groupBy(woTasksRes.recordset, 'wo_id')
    const commentsByWO = groupBy(woCommRes.recordset,  'wo_id')
    const timeByWO     = groupBy(woTimeRes.recordset,  'wo_id')
    const spByWO       = groupBy(woSpRes.recordset,    'wo_id')
    const histByWO     = groupBy(woHistRes.recordset,  'wo_id')

    const workOrders = woRes.recordset.map(r => ({
      id: r.id, title: r.title, assetId: r.asset_id, assigneeId: r.assignee_id,
      status: r.status, priority: r.priority, category: r.category,
      dueDate: r.due_date, description: r.description,
      isPharma: bit(r.is_pharma), createdAt: r.created_at,
      requesterName: r.requester_name, requesterEmail: r.requester_email,
      requesterPhone: r.requester_phone,
      tasks: (tasksByWO.get(r.id) ?? []).map((t: sql.IRecordSet<never>[number]) => ({
        id: t.id, text: t.text, done: bit(t.done),
      })),
      comments: (commentsByWO.get(r.id) ?? []).map((c: sql.IRecordSet<never>[number]) => ({
        id: c.id, userId: c.user_id, text: c.text, createdAt: c.created_at,
      })),
      timeLog: (timeByWO.get(r.id) ?? []).map((t: sql.IRecordSet<never>[number]) => ({
        id: t.id, userId: t.user_id, hours: Number(t.hours), note: t.note, date: t.date,
      })),
      spareParts: (spByWO.get(r.id) ?? []).map((s: sql.IRecordSet<never>[number]) => ({
        id: s.id, sparePartId: s.spare_part_id, quantity: s.quantity,
      })),
      history: (histByWO.get(r.id) ?? []).map((h: sql.IRecordSet<never>[number]) => ({
        id: h.id, field: h.field, oldValue: h.old_value,
        newValue: h.new_value, userId: h.user_id, date: h.date,
      })),
    }))

    // ── PM Tasks ─────────────────────────────────────────────────────────────
    const pmAssetsByPM = groupBy(pmAssetsRes.recordset, 'pm_id')
    const stepsByPM    = groupBy(pmStepsRes.recordset,  'pm_id')

    const pmTasks = pmRes.recordset.map(r => ({
      id: r.id, title: r.title, intervalType: r.interval_type,
      frequencyDays: r.frequency_days, frequencyLabel: r.frequency_label,
      lastDone: r.last_done, nextDue: r.next_due, status: r.status,
      estimatedHours: Number(r.estimated_hours), assigneeId: r.assignee_id,
      isPharma: bit(r.is_pharma),
      assetIds: (pmAssetsByPM.get(r.id) ?? []).map((a: sql.IRecordSet<never>[number]) => a.asset_id),
      tasks: (stepsByPM.get(r.id) ?? []).map((s: sql.IRecordSet<never>[number]) => ({
        id: s.id, text: s.text, done: bit(s.done),
      })),
    }))

    // ── Log Entries ──────────────────────────────────────────────────────────
    const logAssetsByLog = groupBy(logAssetsRes.recordset, 'log_id')

    const logEntries = logRes.recordset.map(r => ({
      id: r.id, type: r.type, severity: r.severity, text: r.text,
      followUp: bit(r.follow_up), createdAt: r.created_at, userId: r.user_id,
      tags: r.tags ? JSON.parse(r.tags) : [],
      assetIds: (logAssetsByLog.get(r.id) ?? []).map((a: sql.IRecordSet<never>[number]) => a.asset_id),
    }))

    // ── Audit Log ────────────────────────────────────────────────────────────
    const auditLog = auditRes.recordset.map(r => ({
      id: r.id, timestamp: r.timestamp, userId: r.user_id, action: r.action,
      entityType: r.entity_type, entityId: r.entity_id,
      entityName: r.entity_name, details: r.details,
    }))

    // ── Settings ─────────────────────────────────────────────────────────────
    const sr = settingsRes.recordset[0]
    const settings = sr ? {
      darkMode: bit(sr.dark_mode), pharmaMode: bit(sr.pharma_mode),
      notifications: {
        overdueWO:       bit(sr.notif_overdue_wo),
        newRequests:     bit(sr.notif_new_requests),
        lowStock:        bit(sr.notif_low_stock),
        emptyStock:      bit(sr.notif_empty_stock),
        overduePM:       bit(sr.notif_overdue_pm),
        openDeviations:  bit(sr.notif_open_deviations),
        overdueCapa:     bit(sr.notif_overdue_capa),
        pendingChanges:  bit(sr.notif_pending_changes),
      },
    } : null

    // ── Company Settings ──────────────────────────────────────────────────────
    const cr2 = companyRes.recordset[0]
    const companySettings = cr2 ? {
      name: cr2.name, logo: cr2.logo, logoOnPrint: bit(cr2.logo_on_print),
      logoOnQR: bit(cr2.logo_on_qr), address: cr2.address, city: cr2.city,
      zip: cr2.zip, country: cr2.country, phone: cr2.phone,
      email: cr2.email, vatNumber: cr2.vat_number, website: cr2.website,
    } : null

    // ── Widget Configs ────────────────────────────────────────────────────────
    const widgetConfigs = widgetRes.recordset.map(r => ({
      id: r.id, displayType: r.display_type,
    }))

    // ── Lookup Tables ─────────────────────────────────────────────────────────
    const itemsByTable = groupBy(liRes.recordset, 'table_id')
    const lookupTables = ltRes.recordset.map(r => ({
      id: r.id, key: r.key_name, name: r.name, description: r.description,
      items: (itemsByTable.get(r.id) ?? []).map((i: sql.IRecordSet<never>[number]) => ({
        id: i.id, name: i.name, color: i.color,
        sortOrder: i.sort_order, isSystem: bit(i.is_system), description: i.description,
      })),
    }))

    // ── GMP: Deviations ───────────────────────────────────────────────────────
    const capaLinksByDev = groupBy(devCapaLinksRes.recordset, 'deviation_id')
    const deviations = devRes.recordset.map(r => ({
      id: r.id, title: r.title, type: r.type, severity: r.severity,
      status: r.status, reportedBy: r.reported_by, reportedAt: r.reported_at,
      assetName: r.asset_name, description: r.description, rootCause: r.root_cause,
      capaIds: (capaLinksByDev.get(r.id) ?? []).map((l: sql.IRecordSet<never>[number]) => l.capa_id),
    }))

    // ── GMP: CAPA ─────────────────────────────────────────────────────────────
    const actionsByCapaRaw = groupBy(capaActRes.recordset, 'capa_id')
    const capaRecords = capaRes.recordset.map(r => {
      const acts = actionsByCapaRaw.get(r.id) ?? []
      return {
        id: r.id, title: r.title, type: r.type, deviationId: r.deviation_id,
        assignee: r.assignee, dueDate: r.due_date, status: r.status,
        description: r.description, completedAt: r.completed_at,
        actions:     acts.map((a: sql.IRecordSet<never>[number]) => a.text as string),
        actionsDone: acts.map((a: sql.IRecordSet<never>[number]) => bit(a.done)),
      }
    })

    // ── GMP: Change Requests ──────────────────────────────────────────────────
    const crAssetsByChange = groupBy(crAssetsRes.recordset, 'change_id')
    const crSopsByChange   = groupBy(crSopsRes.recordset,   'change_id')
    const changeRecords = crRes.recordset.map(r => ({
      id: r.id, title: r.title, type: r.type, priority: r.priority,
      status: r.status, requestedBy: r.requested_by, requestedAt: r.requested_at,
      targetDate: r.target_date, description: r.description,
      reason: r.reason, impactAssessment: r.impact_assessment,
      approvedBy: r.approved_by, approvedAt: r.approved_at,
      implementedAt: r.implemented_at, verifiedAt: r.verified_at,
      affectedAssets: (crAssetsByChange.get(r.id) ?? []).map((a: sql.IRecordSet<never>[number]) => a.asset_code as string),
      affectedSOPs:   (crSopsByChange.get(r.id) ?? []).map((s: sql.IRecordSet<never>[number]) => s.sop_code as string),
    }))

    return {
      users, userGroups, assetCategories, assets, suppliers, spareParts,
      workOrders, pmTasks, logEntries, auditLog,
      settings, companySettings, widgetConfigs, lookupTables,
      deviations, capaRecords, changeRecords,
    }
  })
}

function groupBy<T extends Record<string, unknown>>(rows: T[], key: string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const row of rows) {
    const k = String(row[key])
    const arr = map.get(k) ?? []
    arr.push(row)
    map.set(k, arr)
  }
  return map
}
