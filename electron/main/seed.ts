import sql from 'mssql'
import {
  USERS, USER_GROUPS, ASSETS, ASSET_CATEGORIES, WORK_ORDERS,
  SPARE_PARTS, SUPPLIERS, PM_TASKS, LOG_ENTRIES, COMPANY_SETTINGS, LOOKUP_TABLES,
} from '../../src/data/mockData'

// GMP seed data (mirrors the INITIAL arrays in the GMP screens)
const DEVIATIONS = [
  { id: 'DEV-001', title: 'Temperaturafvigelse i HVAC-anlæg HVC-001', type: 'Udstyr', severity: 'Kritisk', status: 'Afventer CAPA', reportedBy: 'Mette Hansen', reportedAt: '2025-03-12', assetName: 'HVAC HVC-001', description: 'Temperaturen i produktionshallen A oversteg den tilladte grænse på 22°C i 47 minutter.', rootCause: 'Defekt temperatursensor i zone 3.', capaIds: ['CAPA-001', 'CAPA-002'] },
  { id: 'DEV-002', title: 'Procedureafvigelse ved rengøring af autoklav AUT-001', type: 'Procedure', severity: 'Høj', status: 'Under undersøgelse', reportedBy: 'Anders Nielsen', reportedAt: '2025-03-18', assetName: 'Autoklav AUT-001', description: 'Operatøren fulgte ikke korrekt rengøringsprocedure SOP-CLN-004.', rootCause: null, capaIds: ['CAPA-003'] },
  { id: 'DEV-003', title: 'Batchrekord-fejl batch #B-2025-089', type: 'Dokumentation', severity: 'Høj', status: 'Åben', reportedBy: 'Peter Madsen', reportedAt: '2025-03-20', assetName: 'Fyldningsanlæg FYL-001', description: 'Manglende underskrift på kvalitetskontrol-trin i batchrekord.', rootCause: null, capaIds: [] },
  { id: 'DEV-004', title: 'Trykafvigelse kompressor KOM-001', type: 'Udstyr', severity: 'Medium', status: 'Verificeret', reportedBy: 'Lars Petersen', reportedAt: '2025-02-28', assetName: 'Kompressor KOM-001', description: 'Trykket faldt til 5,8 bar i 12 minutter.', rootCause: 'Slidte pakninger i trykregulatoren.', capaIds: ['CAPA-004'] },
  { id: 'DEV-005', title: 'Partikelkontaminering i renrum klasse B', type: 'Kontaminering', severity: 'Kritisk', status: 'Lukket', reportedBy: 'Kirsten Sørensen', reportedAt: '2025-02-10', assetName: 'Lagerhal B — Renrum', description: 'Partikeltal over acceptgrænse konstateret under miljøovervågning.', rootCause: 'Defekt HEPA-filter i loft.', capaIds: ['CAPA-005', 'CAPA-006'] },
  { id: 'DEV-006', title: 'Kalibreringscertifikat udløbet — pH-måler', type: 'Udstyr', severity: 'Medium', status: 'Lukket', reportedBy: 'Mette Hansen', reportedAt: '2025-01-15', assetName: 'pH-måler LAB-004', description: 'pH-måler anvendt med udløbet kalibreringscertifikat.', rootCause: 'Manglende opfølgning på kalibrerings-alarm.', capaIds: ['CAPA-007'] },
  { id: 'DEV-007', title: 'Miljøafvigelse — fugtniveau i lager', type: 'Miljø', severity: 'Lav', status: 'Åben', reportedBy: 'Anders Nielsen', reportedAt: '2025-03-22', assetName: 'Lagerhal B', description: 'Fugtniveauet oversteg 60% RH i 2 timer.', rootCause: null, capaIds: [] },
  { id: 'DEV-008', title: 'SOP-afvigelse ved dispensering — Lab D', type: 'Procedure', severity: 'Høj', status: 'Under undersøgelse', reportedBy: 'Peter Madsen', reportedAt: '2025-03-25', assetName: 'Laboratorium D', description: 'Forkert vejeprocedure anvendt ved dispensering af råmateriale.', rootCause: null, capaIds: [] },
]

const CAPA_RECORDS = [
  { id: 'CAPA-001', title: 'Udskiftning af temperatursensor zone 3', type: 'Korrigerende', deviationId: 'DEV-001', assignee: 'Anders Nielsen', dueDate: '2025-04-05', status: 'Afventer verifikation', description: 'Defekt temperatursensor i HVAC zone 3 skal udskiftes og kalibreres.', completedAt: null, actions: ['Identificer og bestil ny sensor (type PT100)', 'Afmonter og udskift defekt sensor', 'Kalibrer ny sensor iht. SOP-CAL-012', 'Kør 24-timers verifikationstest', 'Opdater kalibreringsdatabasen'], actionsDone: [true, true, true, false, false] },
  { id: 'CAPA-002', title: 'Revision af alarm-eskaleringsprocedure', type: 'Forebyggende', deviationId: 'DEV-001', assignee: 'Kirsten Sørensen', dueDate: '2025-04-15', status: 'I gang', description: 'SOP-ALM-003 revideres for at sikre hurtigere eskalering.', completedAt: null, actions: ['Gennemgang af eksisterende SOP-ALM-003', 'Kortlæg svaghedspunkter', 'Udkast til ny procedure', 'Review og godkendelse', 'Træning af personale', 'Implementér og verificér'], actionsDone: [true, true, false, false, false, false] },
  { id: 'CAPA-003', title: 'Genoptræning af operatører i rengøringsprocedure', type: 'Korrigerende', deviationId: 'DEV-002', assignee: 'Mette Hansen', dueDate: '2025-04-10', status: 'Lukket', description: 'Alle operatører gennemfører obligatorisk genoptræning i SOP-CLN-004.', completedAt: '2025-03-28', actions: ['Identificer berørte operatører', 'Planlæg træningssessioner', 'Gennemfør træning', 'Dokumenter træningsbeviser'], actionsDone: [true, true, true, true] },
  { id: 'CAPA-004', title: 'Planlagt udskiftning af pakninger KOM-001', type: 'Korrigerende', deviationId: 'DEV-004', assignee: 'Anders Nielsen', dueDate: '2025-03-30', status: 'Verificeret', description: 'Slidte pakninger i trykregulatoren på KOM-001 udskiftes.', completedAt: '2025-03-29', actions: ['Bestil reservedele', 'Planlæg servicenedlukning', 'Udskift pakninger', 'Gennemfør tryctest', 'Dokumentér i servicelogbog'], actionsDone: [true, true, true, true, true] },
  { id: 'CAPA-005', title: 'Udskiftning af HEPA-filter i renrum B', type: 'Korrigerende', deviationId: 'DEV-005', assignee: 'Lars Petersen', dueDate: '2025-02-20', status: 'Lukket', description: 'Defekt HEPA-filter udskiftes og renrummet valideres.', completedAt: '2025-02-18', actions: ['Evakuér og luk renrum', 'Udskift HEPA-filter', 'Udfør partikeltælling', 'Genvalider renrum', 'Genoptag produktion'], actionsDone: [true, true, true, true, true] },
  { id: 'CAPA-006', title: 'Forebyggende HEPA-filterprogram implementeret', type: 'Forebyggende', deviationId: 'DEV-005', assignee: 'Kirsten Sørensen', dueDate: '2025-03-15', status: 'Lukket', description: 'Indfør kvartalsvise HEPA-filtereftersyn som fast PM-opgave.', completedAt: '2025-03-10', actions: ['Udarbejd PM-procedure', 'Opret PM-opgave i CMMS', 'Tildel ansvarlig tekniker'], actionsDone: [true, true, true] },
  { id: 'CAPA-007', title: 'Implementér kalibrerings-påmindelsessystem', type: 'Forebyggende', deviationId: 'DEV-006', assignee: 'Lars Petersen', dueDate: '2025-04-30', status: 'I gang', description: 'Opsæt automatisk notifikation 30 dage før udløb af kalibreringscertifikater.', completedAt: null, actions: ['Kortlæg alt QC-udstyr', 'Konfigurér notifikationsregler', 'Test notifikationsflow', 'Dokumentér i SOP-CAL-001', 'Træning af QC-personale'], actionsDone: [true, false, false, false, false] },
  { id: 'CAPA-008', title: 'Revision af dispenseringsprocedure Lab D', type: 'Korrigerende', deviationId: 'DEV-008', assignee: 'Peter Madsen', dueDate: '2025-04-20', status: 'Åben', description: 'SOP-LAB-008 revideres med tydeliggørelse af vejeprocedure.', completedAt: null, actions: ['Gennemgang af eksisterende SOP', 'Identificer uklarhedspunkter', 'Udkast til revideret procedure', 'Kvalitetsgodkendelse', 'Implementering og træning'], actionsDone: [false, false, false, false, false] },
]

const CHANGE_RECORDS = [
  { id: 'CR-001', title: 'Opgradering af SCADA-software til v4.2', type: 'Software', priority: 'Høj', status: 'Under vurdering', requestedBy: 'Lars Petersen', requestedAt: '2025-03-10', targetDate: '2025-05-01', description: 'SCADA-systemet opgraderes fra v3.8 til v4.2.', reason: 'Leverandøren ophører support for v3.8 pr. 1. juli 2025.', impactAssessment: 'Lav risiko for produktionsafbrydelse. Kræver 4-timers nedetid.', approvedBy: null, approvedAt: null, implementedAt: null, verifiedAt: null, affectedAssets: ['KOM-001', 'KOM-002', 'FYL-001'], affectedSOPs: ['SOP-PRD-001', 'SOP-PRD-003'] },
  { id: 'CR-002', title: 'Revision af rengøringsprocedure SOP-CLN-004', type: 'Procedure', priority: 'Høj', status: 'Godkendt', requestedBy: 'Peter Madsen', requestedAt: '2025-03-18', targetDate: '2025-04-15', description: 'SOP-CLN-004 revideres som følge af DEV-002.', reason: 'Afvigelse DEV-002 identificerede uklarhed i eksisterende procedure.', impactAssessment: 'Ingen produktionspåvirkning. Kræver genoptræning af 7 operatører.', approvedBy: 'Kirsten Sørensen', approvedAt: '2025-03-25', implementedAt: null, verifiedAt: null, affectedAssets: ['AUT-001', 'AUT-002'], affectedSOPs: ['SOP-CLN-004'] },
  { id: 'CR-003', title: 'Udskiftning af trykmålere med digitale enheder', type: 'Udstyr', priority: 'Normal', status: 'Implementeret', requestedBy: 'Anders Nielsen', requestedAt: '2025-02-05', targetDate: '2025-03-31', description: 'Analoge trykmålere udskiftes med digitale enheder.', reason: 'Digitale enheder giver bedre sporbarhed.', impactAssessment: 'Kræver 6 timers planlagt nedetid.', approvedBy: 'Kirsten Sørensen', approvedAt: '2025-02-15', implementedAt: '2025-03-28', verifiedAt: null, affectedAssets: ['TRY-001', 'TRY-002'], affectedSOPs: ['SOP-CAL-012'] },
  { id: 'CR-004', title: 'Implementering af elektronisk batchrekord-system', type: 'Software', priority: 'Kritisk', status: 'Under vurdering', requestedBy: 'Kirsten Sørensen', requestedAt: '2025-03-20', targetDate: '2025-07-01', description: 'Papirbaserede batchrekorder erstattes af elektronisk system.', reason: 'Kommende FDA-inspektion Q4 2025.', impactAssessment: 'Høj kompleksitet. Kræver validering (IQ/OQ/PQ).', approvedBy: null, approvedAt: null, implementedAt: null, verifiedAt: null, affectedAssets: ['FYL-001', 'AUT-001'], affectedSOPs: ['SOP-QC-001'] },
  { id: 'CR-005', title: 'HEPA-filterprogram — kvartalsvise eftersyn', type: 'Procedure', priority: 'Normal', status: 'Verificeret', requestedBy: 'Lars Petersen', requestedAt: '2025-02-12', targetDate: '2025-03-15', description: 'Fast PM-procedure for kvartalsvise HEPA-filtereftersyn.', reason: 'CAPA-006 fra DEV-005.', impactAssessment: 'Kræver 2 timers nedetid per renrum per kvartal.', approvedBy: 'Peter Madsen', approvedAt: '2025-02-20', implementedAt: '2025-03-10', verifiedAt: '2025-03-18', affectedAssets: ['HVC-001', 'HVC-002'], affectedSOPs: ['SOP-FAC-003'] },
  { id: 'CR-006', title: 'Renovering af laminar flow-kabinet LAB-LFC-01', type: 'Facility', priority: 'Høj', status: 'Godkendt', requestedBy: 'Peter Madsen', requestedAt: '2025-03-25', targetDate: '2025-04-30', description: 'LAB-LFC-01 renoveres med ny motor og HEPA-filter.', reason: 'Kabinettet viser tegn på mekanisk slid.', impactAssessment: 'Lab D lukkes i 3 arbejdsdage.', approvedBy: 'Kirsten Sørensen', approvedAt: '2025-03-30', implementedAt: null, verifiedAt: null, affectedAssets: ['LAB-LFC-01'], affectedSOPs: ['SOP-VAL-009'] },
  { id: 'CR-007', title: 'Ændring af blandingstider for batch type B', type: 'Procedure', priority: 'Kritisk', status: 'Lukket', requestedBy: 'Mette Hansen', requestedAt: '2025-01-08', targetDate: '2025-02-01', description: 'Blandingstiden øges fra 45 til 60 minutter.', reason: 'Intern validering viser forbedret homogenitet.', impactAssessment: 'Kapacitetsreduktion på ca. 10% per batch.', approvedBy: 'Peter Madsen', approvedAt: '2025-01-18', implementedAt: '2025-01-25', verifiedAt: '2025-02-03', affectedAssets: ['MIX-001'], affectedSOPs: ['SOP-PRD-005'] },
  { id: 'CR-008', title: 'Ansættelse af ekstra kvalitetsteknikers adgang', type: 'Personale', priority: 'Lav', status: 'Udkast', requestedBy: 'Kirsten Sørensen', requestedAt: '2025-04-01', targetDate: '2025-05-01', description: 'Onboarding-procedure for ny kvalitetstekniker opdateres.', reason: 'Ny medarbejder starter 1. maj.', impactAssessment: 'Ingen produktionspåvirkning.', approvedBy: null, approvedAt: null, implementedAt: null, verifiedAt: null, affectedAssets: [], affectedSOPs: ['SOP-ADM-002'] },
]

const DEFAULT_WIDGETS = [
  { id: 'open', display_type: 'count' },
  { id: 'overdue', display_type: 'count' },
  { id: 'critical', display_type: 'count' },
  { id: 'pm_compliance', display_type: 'percent' },
  { id: 'low_stock', display_type: 'count' },
  { id: 'requests', display_type: 'count' },
]

export async function seedIfEmpty(pool: sql.ConnectionPool): Promise<void> {
  const check = await pool.request().query('SELECT COUNT(*) AS cnt FROM users')
  if (check.recordset[0].cnt > 0) return   // Already seeded

  console.log('[MaintainIQ] Fresh database — seeding demo data...')

  // User groups
  for (const g of USER_GROUPS) {
    await pool.request()
      .input('id', g.id).input('name', g.name).input('description', g.description)
      .input('color', g.color).input('isSystem', g.isSystem ? 1 : 0)
      .query(`INSERT INTO user_groups (id,name,description,color,is_system)
              VALUES (@id,@name,@description,@color,@isSystem)`)
    for (const perm of g.permissions) {
      await pool.request().input('gid', g.id).input('perm', perm)
        .query(`INSERT INTO user_group_permissions (group_id, permission) VALUES (@gid, @perm)`)
    }
  }

  // Users
  for (const u of USERS) {
    await pool.request()
      .input('id', u.id).input('name', u.name).input('initials', u.initials)
      .input('title', u.title).input('email', u.email).input('phone', u.phone ?? null)
      .input('role', u.role).input('rate', u.hourlyRate).input('active', u.isActive ? 1 : 0)
      .input('mfa', u.mfaEnabled ? 1 : 0).input('entraId', u.entraId ?? null)
      .input('pw', u.passwordHash ?? null)
      .query(`INSERT INTO users (id,name,initials,title,email,phone,role,hourly_rate,is_active,mfa_enabled,entra_id,password_hash)
              VALUES (@id,@name,@initials,@title,@email,@phone,@role,@rate,@active,@mfa,@entraId,@pw)`)
    for (const gid of u.groupIds) {
      await pool.request().input('uid', u.id).input('gid', gid)
        .query(`INSERT INTO user_group_members (user_id, group_id) VALUES (@uid, @gid)`)
    }
  }

  // Asset categories
  for (const c of ASSET_CATEGORIES) {
    await pool.request()
      .input('id', c.id).input('name', c.name).input('baseType', c.baseType)
      .input('color', c.color).input('icon', c.icon).input('isSystem', c.isSystem ? 1 : 0)
      .input('parentId', c.parentId ?? null).input('sortOrder', c.sortOrder)
      .query(`INSERT INTO asset_categories (id,name,base_type,color,icon,is_system,parent_id,sort_order)
              VALUES (@id,@name,@baseType,@color,@icon,@isSystem,@parentId,@sortOrder)`)
  }

  // Assets
  for (const a of ASSETS) {
    await pool.request()
      .input('id', a.id).input('name', a.name).input('type', a.type)
      .input('catId', a.categoryId ?? null).input('parentId', a.parentId ?? null)
      .input('crit', a.criticality).input('loc', a.location ?? null)
      .input('desc', a.description ?? null).input('code', a.code)
      .input('status', a.status).input('createdAt', a.createdAt)
      .input('brand', a.brand ?? null).input('model', a.model ?? null)
      .input('year', a.yearOfManufacture ?? null).input('barcode', a.barcode ?? null)
      .input('suppId', a.supplierId ?? null).input('notes', a.notes ?? null)
      .input('address', a.address ?? null).input('city', a.city ?? null)
      .input('province', a.province ?? null).input('zip', a.zip ?? null)
      .input('country', a.country ?? null).input('dept', a.department ?? null)
      .query(`INSERT INTO assets (id,name,type,category_id,parent_id,criticality,location,description,code,status,created_at,brand,model,year_of_manufacture,barcode,supplier_id,notes,address,city,province,zip,country,department)
              VALUES (@id,@name,@type,@catId,@parentId,@crit,@loc,@desc,@code,@status,@createdAt,@brand,@model,@year,@barcode,@suppId,@notes,@address,@city,@province,@zip,@country,@dept)`)
  }

  // Suppliers
  for (const s of SUPPLIERS) {
    await pool.request()
      .input('id', s.id).input('name', s.name).input('contact', s.contactPerson ?? null)
      .input('email', s.email ?? null).input('phone', s.phone ?? null).input('cat', s.category ?? null)
      .query(`INSERT INTO suppliers (id,name,contact_person,email,phone,category) VALUES (@id,@name,@contact,@email,@phone,@cat)`)
  }

  // Spare parts
  for (const sp of SPARE_PARTS) {
    await pool.request()
      .input('id', sp.id).input('name', sp.name).input('pn', sp.partNumber ?? null)
      .input('qty', sp.quantity).input('min', sp.minQuantity).input('loc', sp.location ?? null)
      .input('price', sp.price).input('suppId', sp.supplierId ?? null)
      .query(`INSERT INTO spare_parts (id,name,part_number,quantity,min_quantity,location,price,supplier_id)
              VALUES (@id,@name,@pn,@qty,@min,@loc,@price,@suppId)`)
    for (const h of (sp.history ?? [])) {
      await pool.request()
        .input('spId', sp.id).input('date', h.date).input('delta', h.change).input('note', h.note ?? null)
        .query(`INSERT INTO spare_part_history (spare_part_id,date,change_delta,note) VALUES (@spId,@date,@delta,@note)`)
    }
  }

  // Work orders + sub-tables
  for (const wo of WORK_ORDERS) {
    await pool.request()
      .input('id', wo.id).input('title', wo.title).input('assetId', wo.assetId ?? null)
      .input('assigneeId', wo.assigneeId ?? null).input('status', wo.status)
      .input('priority', wo.priority).input('category', wo.category)
      .input('dueDate', wo.dueDate).input('desc', wo.description ?? null)
      .input('isPharma', wo.isPharma ? 1 : 0).input('createdAt', wo.createdAt)
      .input('rName', wo.requesterName ?? null).input('rEmail', wo.requesterEmail ?? null)
      .input('rPhone', wo.requesterPhone ?? null)
      .query(`INSERT INTO work_orders (id,title,asset_id,assignee_id,status,priority,category,due_date,description,is_pharma,created_at,requester_name,requester_email,requester_phone)
              VALUES (@id,@title,@assetId,@assigneeId,@status,@priority,@category,@dueDate,@desc,@isPharma,@createdAt,@rName,@rEmail,@rPhone)`)
    let i = 0
    for (const t of (wo.tasks ?? [])) {
      await pool.request().input('id', t.id).input('woId', wo.id).input('text', t.text)
        .input('done', t.done ? 1 : 0).input('order', i++)
        .query(`INSERT INTO wo_tasks (id,wo_id,text,done,sort_order) VALUES (@id,@woId,@text,@done,@order)`)
    }
    for (const c of (wo.comments ?? [])) {
      await pool.request().input('id', c.id).input('woId', wo.id).input('uid', c.userId)
        .input('text', c.text).input('ca', c.createdAt)
        .query(`INSERT INTO wo_comments (id,wo_id,user_id,text,created_at) VALUES (@id,@woId,@uid,@text,@ca)`)
    }
    for (const t of (wo.timeLog ?? [])) {
      await pool.request().input('id', t.id).input('woId', wo.id).input('uid', t.userId)
        .input('hours', t.hours).input('note', t.note ?? null).input('date', t.date)
        .query(`INSERT INTO wo_time_log (id,wo_id,user_id,hours,note,date) VALUES (@id,@woId,@uid,@hours,@note,@date)`)
    }
    for (const sp of (wo.spareParts ?? [])) {
      await pool.request().input('id', sp.id).input('woId', wo.id)
        .input('spId', sp.sparePartId).input('qty', sp.quantity)
        .query(`INSERT INTO wo_spare_parts_usage (id,wo_id,spare_part_id,quantity) VALUES (@id,@woId,@spId,@qty)`)
    }
  }

  // PM Tasks
  for (const pm of PM_TASKS) {
    await pool.request()
      .input('id', pm.id).input('title', pm.title).input('intType', pm.intervalType)
      .input('freqDays', pm.frequencyDays).input('freqLabel', pm.frequencyLabel ?? null)
      .input('lastDone', pm.lastDone ?? null).input('nextDue', pm.nextDue).input('status', pm.status)
      .input('estHours', pm.estimatedHours).input('assigneeId', pm.assigneeId ?? null)
      .input('isPharma', pm.isPharma ? 1 : 0)
      .query(`INSERT INTO pm_tasks (id,title,interval_type,frequency_days,frequency_label,last_done,next_due,status,estimated_hours,assignee_id,is_pharma)
              VALUES (@id,@title,@intType,@freqDays,@freqLabel,@lastDone,@nextDue,@status,@estHours,@assigneeId,@isPharma)`)
    for (const assetId of (pm.assetIds ?? [])) {
      await pool.request().input('pmId', pm.id).input('assetId', assetId)
        .query(`INSERT INTO pm_task_assets (pm_id, asset_id) VALUES (@pmId, @assetId)`)
    }
    let stepOrder = 0
    for (const step of (pm.tasks ?? [])) {
      await pool.request().input('id', step.id).input('pmId', pm.id).input('text', step.text)
        .input('done', step.done ? 1 : 0).input('order', stepOrder++)
        .query(`INSERT INTO pm_task_steps (id,pm_id,text,done,sort_order) VALUES (@id,@pmId,@text,@done,@order)`)
    }
  }

  // Log entries
  for (const le of LOG_ENTRIES) {
    await pool.request()
      .input('id', le.id).input('type', le.type).input('severity', le.severity)
      .input('text', le.text).input('followUp', le.followUp ? 1 : 0)
      .input('createdAt', le.createdAt).input('userId', le.userId)
      .input('tags', JSON.stringify(le.tags ?? []))
      .query(`INSERT INTO log_entries (id,type,severity,text,follow_up,created_at,user_id,tags)
              VALUES (@id,@type,@severity,@text,@followUp,@createdAt,@userId,@tags)`)
    for (const assetId of (le.assetIds ?? [])) {
      await pool.request().input('logId', le.id).input('assetId', assetId)
        .query(`INSERT INTO log_entry_assets (log_id, asset_id) VALUES (@logId, @assetId)`)
    }
  }

  // Company settings
  await pool.request()
    .input('name', COMPANY_SETTINGS.name).input('print', COMPANY_SETTINGS.logoOnPrint ? 1 : 0)
    .input('qr', COMPANY_SETTINGS.logoOnQR ? 1 : 0).input('address', COMPANY_SETTINGS.address ?? null)
    .input('city', COMPANY_SETTINGS.city ?? null).input('zip', COMPANY_SETTINGS.zip ?? null)
    .input('country', COMPANY_SETTINGS.country ?? null).input('phone', COMPANY_SETTINGS.phone ?? null)
    .input('email', COMPANY_SETTINGS.email ?? null).input('vat', COMPANY_SETTINGS.vatNumber ?? null)
    .input('web', COMPANY_SETTINGS.website ?? null)
    .query(`UPDATE company_settings SET name=@name,logo_on_print=@print,logo_on_qr=@qr,
            address=@address,city=@city,zip=@zip,country=@country,phone=@phone,
            email=@email,vat_number=@vat,website=@web WHERE id=1`)

  // Widget configs
  for (const w of DEFAULT_WIDGETS) {
    await pool.request().input('id', w.id).input('dt', w.display_type)
      .query(`INSERT INTO widget_configs (id, display_type) VALUES (@id, @dt)`)
  }

  // Lookup tables
  for (const lt of LOOKUP_TABLES) {
    await pool.request().input('id', lt.id).input('key', lt.key).input('name', lt.name)
      .input('desc', lt.description ?? null)
      .query(`INSERT INTO lookup_tables (id,key_name,name,description) VALUES (@id,@key,@name,@desc)`)
    for (const item of lt.items) {
      await pool.request().input('id', item.id).input('tableId', lt.id).input('name', item.name)
        .input('color', item.color ?? null).input('sortOrder', item.sortOrder)
        .input('isSystem', item.isSystem ? 1 : 0).input('desc', item.description ?? null)
        .query(`INSERT INTO lookup_items (id,table_id,name,color,sort_order,is_system,description)
                VALUES (@id,@tableId,@name,@color,@sortOrder,@isSystem,@desc)`)
    }
  }

  // GMP: Deviations
  for (const d of DEVIATIONS) {
    await pool.request()
      .input('id', d.id).input('title', d.title).input('type', d.type)
      .input('severity', d.severity).input('status', d.status)
      .input('reportedBy', d.reportedBy).input('reportedAt', d.reportedAt)
      .input('assetName', d.assetName ?? null).input('description', d.description ?? null)
      .input('rootCause', d.rootCause ?? null)
      .query(`INSERT INTO deviations (id,title,type,severity,status,reported_by,reported_at,asset_name,description,root_cause)
              VALUES (@id,@title,@type,@severity,@status,@reportedBy,@reportedAt,@assetName,@description,@rootCause)`)
    for (const capaId of d.capaIds) {
      await pool.request().input('devId', d.id).input('capaId', capaId)
        .query(`INSERT INTO deviation_capa_links (deviation_id, capa_id) VALUES (@devId, @capaId)`)
    }
  }

  // GMP: CAPA
  for (const c of CAPA_RECORDS) {
    await pool.request()
      .input('id', c.id).input('title', c.title).input('type', c.type)
      .input('devId', c.deviationId ?? null).input('assignee', c.assignee)
      .input('dueDate', c.dueDate).input('status', c.status)
      .input('description', c.description ?? null).input('completedAt', c.completedAt ?? null)
      .query(`INSERT INTO capa_records (id,title,type,deviation_id,assignee,due_date,status,description,completed_at)
              VALUES (@id,@title,@type,@devId,@assignee,@dueDate,@status,@description,@completedAt)`)
    for (let i = 0; i < c.actions.length; i++) {
      await pool.request().input('capaId', c.id).input('text', c.actions[i])
        .input('done', c.actionsDone[i] ? 1 : 0).input('order', i)
        .query(`INSERT INTO capa_actions (capa_id,text,done,sort_order) VALUES (@capaId,@text,@done,@order)`)
    }
  }

  // GMP: Change Requests
  for (const cr of CHANGE_RECORDS) {
    await pool.request()
      .input('id', cr.id).input('title', cr.title).input('type', cr.type)
      .input('priority', cr.priority).input('status', cr.status)
      .input('requestedBy', cr.requestedBy).input('requestedAt', cr.requestedAt)
      .input('targetDate', cr.targetDate).input('description', cr.description ?? null)
      .input('reason', cr.reason ?? null).input('impact', cr.impactAssessment ?? null)
      .input('approvedBy', cr.approvedBy ?? null).input('approvedAt', cr.approvedAt ?? null)
      .input('implementedAt', cr.implementedAt ?? null).input('verifiedAt', cr.verifiedAt ?? null)
      .query(`INSERT INTO change_requests (id,title,type,priority,status,requested_by,requested_at,target_date,description,reason,impact_assessment,approved_by,approved_at,implemented_at,verified_at)
              VALUES (@id,@title,@type,@priority,@status,@requestedBy,@requestedAt,@targetDate,@description,@reason,@impact,@approvedBy,@approvedAt,@implementedAt,@verifiedAt)`)
    for (const code of cr.affectedAssets) {
      await pool.request().input('chId', cr.id).input('code', code)
        .query(`INSERT INTO change_affected_assets (change_id, asset_code) VALUES (@chId, @code)`)
    }
    for (const sop of cr.affectedSOPs) {
      await pool.request().input('chId', cr.id).input('sop', sop)
        .query(`INSERT INTO change_affected_sops (change_id, sop_code) VALUES (@chId, @sop)`)
    }
  }

  console.log('[MaintainIQ] Demo data seeded successfully.')
}
