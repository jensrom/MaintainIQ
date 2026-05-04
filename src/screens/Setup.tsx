import { useState } from 'react'
import { Database, Server, ShieldCheck, Wifi, WifiOff, ChevronRight, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import type { ConnectionConfig } from '../types/electron'

const DEFAULT: ConnectionConfig = {
  server: '',
  port: 1433,
  database: 'MaintainIQ',
  windowsAuth: false,
  user: 'sa',
  password: '',
  encrypt: false,
  trustServerCertificate: true,
}

export default function Setup({ onConnected }: { onConnected: () => void }) {
  const [cfg, setCfg] = useState<ConnectionConfig>(DEFAULT)
  const [testing, setTesting] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null)

  function set(patch: Partial<ConnectionConfig>) {
    setCfg(prev => ({ ...prev, ...patch }))
    setTestResult(null)
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await window.electronAPI!.db_testConnection(cfg)
      setTestResult(result)
    } catch {
      setTestResult({ ok: false, error: 'Ukendt fejl' })
    } finally {
      setTesting(false)
    }
  }

  async function handleConnect() {
    setConnecting(true)
    try {
      // Test first
      const result = await window.electronAPI!.db_testConnection(cfg)
      if (!result.ok) { setTestResult(result); setConnecting(false); return }
      // Save config + init DB schema
      await window.electronAPI!.db_saveConfig(cfg)
      await window.electronAPI!.db_init()
      onConnected()
    } catch (e) {
      setTestResult({ ok: false, error: (e as Error).message })
      setConnecting(false)
    }
  }

  const field = 'w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">MaintainIQ</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-8">
          <div className="flex items-center gap-2 mb-1">
            <Database size={18} className="text-blue-600" />
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Databaseforbindelse</h1>
          </div>
          <p className="text-sm text-slate-400 mb-6">
            Angiv forbindelsesoplysninger til din SQL Server Express
          </p>

          <div className="space-y-4">
            {/* Server + Port */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  <Server size={11} className="inline mr-1" />Server / IP-adresse
                </label>
                <input
                  className={field}
                  placeholder="192.168.1.100 eller SERVERNAME"
                  value={cfg.server}
                  onChange={e => set({ server: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Port</label>
                <input
                  className={field}
                  type="number"
                  value={cfg.port}
                  onChange={e => set({ port: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Database */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Databasenavn</label>
              <input
                className={field}
                placeholder="MaintainIQ"
                value={cfg.database}
                onChange={e => set({ database: e.target.value })}
              />
            </div>

            {/* Auth type toggle */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Godkendelse</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'SQL Server Login', value: false },
                  { label: 'Windows Auth', value: true },
                ].map(opt => (
                  <button
                    key={String(opt.value)}
                    onClick={() => set({ windowsAuth: opt.value })}
                    className={clsx(
                      'py-2 rounded-lg text-sm font-medium border transition-colors',
                      cfg.windowsAuth === opt.value
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SQL Auth credentials */}
            {!cfg.windowsAuth && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Brugernavn</label>
                  <input
                    className={field}
                    placeholder="sa"
                    value={cfg.user ?? ''}
                    onChange={e => set({ user: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Adgangskode</label>
                  <input
                    className={field}
                    type="password"
                    placeholder="••••••••"
                    value={cfg.password ?? ''}
                    onChange={e => set({ password: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Options */}
            <div className="flex items-center gap-6 pt-1">
              {[
                { label: 'Kryptering (SSL)', key: 'encrypt' as const },
                { label: 'Stol på certifikat', key: 'trustServerCertificate' as const },
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!cfg[opt.key]}
                    onChange={e => set({ [opt.key]: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-500">{opt.label}</span>
                </label>
              ))}
            </div>

            {/* Test result */}
            {testResult && (
              <div className={clsx(
                'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm',
                testResult.ok
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              )}>
                {testResult.ok
                  ? <><Wifi size={14} /> Forbindelsen lykkedes</>
                  : <><WifiOff size={14} /> {testResult.error}</>
                }
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleTest}
                disabled={!cfg.server || testing || connecting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                {testing ? <Loader2 size={14} className="animate-spin" /> : <Wifi size={14} />}
                Test forbindelse
              </button>
              <button
                onClick={handleConnect}
                disabled={!cfg.server || !cfg.database || connecting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-40 transition-colors"
              >
                {connecting
                  ? <Loader2 size={14} className="animate-spin" />
                  : <ChevronRight size={14} />
                }
                {connecting ? 'Opretter forbindelse...' : 'Forbind & start'}
              </button>
            </div>
          </div>
        </div>

        {/* Help text */}
        <div className="mt-5 bg-slate-100 dark:bg-slate-900 rounded-xl p-4 text-xs text-slate-500 space-y-1.5">
          <p className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <ShieldCheck size={12} /> Opsætning af SQL Server Express på serveren
          </p>
          <p>1. Åbn <strong>SQL Server Configuration Manager</strong></p>
          <p>2. Aktiver <strong>TCP/IP</strong> under Protocols for SQLEXPRESS</p>
          <p>3. Sæt TCP-port til <strong>1433</strong> og genstart SQL Server</p>
          <p>4. Åbn port <strong>1433</strong> i Windows Firewall</p>
          <p>5. Opret en SQL Server-bruger med adgang til databasen</p>
        </div>
      </div>
    </div>
  )
}
