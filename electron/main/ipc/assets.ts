import { ipcMain } from 'electron'
import { getPool } from '../db'

export function registerAssetHandlers(): void {
  ipcMain.handle('asset:create', async (_e, a) => {
    const pool = await getPool()
    await pool.request()
      .input('id', a.id).input('name', a.name).input('type', a.type)
      .input('catId', a.categoryId ?? null).input('parentId', a.parentId ?? null)
      .input('criticality', a.criticality).input('location', a.location ?? null)
      .input('description', a.description ?? null).input('code', a.code)
      .input('status', a.status ?? 'online').input('createdAt', a.createdAt)
      .input('brand', a.brand ?? null).input('model', a.model ?? null)
      .input('year', a.yearOfManufacture ?? null).input('barcode', a.barcode ?? null)
      .input('supplierId', a.supplierId ?? null).input('notes', a.notes ?? null)
      .input('address', a.address ?? null).input('city', a.city ?? null)
      .input('province', a.province ?? null).input('zip', a.zip ?? null)
      .input('country', a.country ?? null).input('department', a.department ?? null)
      .query(`INSERT INTO assets
        (id,name,type,category_id,parent_id,criticality,location,description,code,status,
         created_at,brand,model,year_of_manufacture,barcode,supplier_id,notes,
         address,city,province,zip,country,department)
        VALUES (@id,@name,@type,@catId,@parentId,@criticality,@location,@description,@code,@status,
         @createdAt,@brand,@model,@year,@barcode,@supplierId,@notes,
         @address,@city,@province,@zip,@country,@department)`)
  })

  ipcMain.handle('asset:update', async (_e, id, patch) => {
    const pool = await getPool()
    const map: Record<string, string> = {
      name: 'name', type: 'type', categoryId: 'category_id', parentId: 'parent_id',
      criticality: 'criticality', location: 'location', description: 'description',
      code: 'code', status: 'status', brand: 'brand', model: 'model',
      yearOfManufacture: 'year_of_manufacture', barcode: 'barcode',
      supplierId: 'supplier_id', notes: 'notes', address: 'address',
      city: 'city', province: 'province', zip: 'zip', country: 'country',
      department: 'department',
    }
    const today = new Date().toISOString().split('T')[0]
    const setClauses: string[] = [`updated_at = '${today}'`]
    const req = pool.request().input('id', id)
    let i = 0
    for (const [jsKey, dbCol] of Object.entries(map)) {
      if (jsKey in patch) {
        const pname = `p${i++}`
        req.input(pname, patch[jsKey] ?? null)
        setClauses.push(`${dbCol} = @${pname}`)
      }
    }
    await req.query(`UPDATE assets SET ${setClauses.join(', ')} WHERE id = @id`)
  })

  ipcMain.handle('asset:delete', async (_e, id) => {
    const pool = await getPool()
    // Cascade: delete children first, then the asset
    const children = await pool.request()
      .input('parentId', id)
      .query(`SELECT id FROM assets WHERE parent_id = @parentId`)
    for (const child of children.recordset) {
      await pool.request().input('id', child.id).query(`DELETE FROM assets WHERE id = @id`)
    }
    await pool.request().input('id', id).query(`DELETE FROM assets WHERE id = @id`)
  })
}
