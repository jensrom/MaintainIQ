import sql from 'mssql'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

export interface ConnectionConfig {
  server: string
  port: number
  database: string
  windowsAuth: boolean
  user?: string
  password?: string
  encrypt: boolean
  trustServerCertificate: boolean
}

const configPath = () => path.join(app.getPath('userData'), 'db-config.json')

let pool: sql.ConnectionPool | null = null

function toSqlConfig(c: ConnectionConfig): sql.config {
  return {
    server: c.server,
    port: c.port || 1433,
    database: c.database,
    options: {
      encrypt: c.encrypt,
      trustServerCertificate: c.trustServerCertificate,
      enableArithAbort: true,
    },
    connectionTimeout: 15000,
    requestTimeout: 30000,
    ...(c.windowsAuth
      ? { authentication: { type: 'ntlm', options: { domain: '', userName: '', password: '' } } }
      : { user: c.user, password: c.password }),
  }
}

export async function getPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) return pool
  const config = loadConfig()
  if (!config) throw new Error('Ingen databasekonfiguration fundet')
  pool = await sql.connect(toSqlConfig(config))
  return pool
}

export function loadConfig(): ConnectionConfig | null {
  try {
    const raw = fs.readFileSync(configPath(), 'utf-8')
    return JSON.parse(raw) as ConnectionConfig
  } catch {
    return null
  }
}

export function saveConfig(config: ConnectionConfig): void {
  const dir = path.dirname(configPath())
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(configPath(), JSON.stringify(config, null, 2), 'utf-8')
  // Reset pool so next getPool() reconnects with new config
  if (pool) {
    pool.close().catch(() => {})
    pool = null
  }
}

export async function testConnection(config: ConnectionConfig): Promise<{ ok: boolean; error?: string }> {
  let testPool: sql.ConnectionPool | null = null
  try {
    testPool = await sql.connect(toSqlConfig(config))
    await testPool.request().query('SELECT 1 AS ok')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  } finally {
    if (testPool) testPool.close().catch(() => {})
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close()
    pool = null
  }
}
