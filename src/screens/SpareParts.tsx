import { useState, useMemo } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { da } from 'date-fns/locale'
import { Minus, Plus, X } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'
import type { SparePart } from '../types'

function fmt(dateStr: string) {
  try { const d = parseISO(dateStr); return isValid(d) ? format(d, 'd. MMM yyyy', { locale: da }) : dateStr }
  catch { return dateStr }
}

type StockFilter = 'Tomt' | 'Lav' | 'OK' | null

function stockStatus(sp: SparePart): 'Tomt' | 'Lav' | 'OK' {
  if (sp.quantity === 0) return 'Tomt'
  if (sp.quantity < sp.minQuantity) return 'Lav'
  return 'OK'
}

const STOCK_STYLES: Record<string, string> = {
  'Tomt': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  'Lav': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'OK': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
}

function SparePartDetail({ sp, onClose }: { sp: SparePart; onClose: () => void }) {
  const { suppliers, adjustStock } = useStore()
  const supplier = suppliers.find(s => s.id === sp.supplierId)
  const status = stockStatus(sp)

  return (
    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md max-h-[90vh] bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex flex-col z-40 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-gray-400">{sp.partNumber}</span>
            <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium', STOCK_STYLES[status])}>{status}</span>
          </div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">{sp.name}</h2>
        </div>
        <button onClick={onClose} className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Stock control */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Lagerbeholdning</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{sp.quantity}</p>
            <p className="text-xs text-gray-400">Min. {sp.minQuantity} stk</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => adjustStock(sp.id, -1)}
              disabled={sp.quantity === 0}
              className="w-9 h-9 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Minus size={16} />
            </button>
            <button
              onClick={() => adjustStock(sp.id, 1)}
              className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Placering</p>
            <p className="font-medium text-gray-800 dark:text-gray-200">{sp.location}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Pris pr. stk</p>
            <p className="font-medium text-gray-800 dark:text-gray-200">{sp.price.toLocaleString('da-DK')} kr.</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Lagerværdi</p>
            <p className="font-medium text-gray-800 dark:text-gray-200">{(sp.quantity * sp.price).toLocaleString('da-DK')} kr.</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Minimum</p>
            <p className="font-medium text-gray-800 dark:text-gray-200">{sp.minQuantity} stk</p>
          </div>
        </div>

        {/* Supplier */}
        {supplier && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Leverandør</p>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{supplier.name}</p>
            <p className="text-xs text-gray-400">{supplier.contactPerson}</p>
            <p className="text-xs text-gray-400">{supplier.email}</p>
            <p className="text-xs text-gray-400">{supplier.phone}</p>
          </div>
        )}

        {/* History */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Lagerhistorik</p>
          <div className="space-y-1.5">
            {sp.history.length === 0 && <p className="text-xs text-gray-400">Ingen historik</p>}
            {sp.history.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div>
                  <span className="text-xs text-gray-400">{fmt(h.date)}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{h.note}</span>
                </div>
                <span className={clsx('text-xs font-semibold', h.change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500')}>
                  {h.change > 0 ? '+' : ''}{h.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SpareParts() {
  const { spareParts, adjustStock } = useStore()
  const [filter, setFilter] = useState<StockFilter>(null)
  const [selected, setSelected] = useState<SparePart | null>(null)

  const counts = useMemo(() => ({
    Tomt: spareParts.filter(sp => sp.quantity === 0).length,
    Lav: spareParts.filter(sp => sp.quantity > 0 && sp.quantity < sp.minQuantity).length,
    OK: spareParts.filter(sp => sp.quantity >= sp.minQuantity).length,
  }), [spareParts])

  const filtered = useMemo(() => {
    if (!filter) return spareParts
    return spareParts.filter(sp => stockStatus(sp) === filter)
  }, [spareParts, filter])

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Reservedele</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{spareParts.length} reservedele i lager</p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilter(null)}
          className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', filter === null ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700')}
        >
          Vis alle ({spareParts.length})
        </button>
        {(['Tomt', 'Lav', 'OK'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(filter === s ? null : s)}
            className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', STOCK_STYLES[s], filter === s && 'ring-2 ring-offset-1 ring-current')}
          >
            {s} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500">Varenavn</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500">Varenummer</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500">Lager</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500">Placering</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500">Pris</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500">Regulér</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">Ingen reservedele matcher filteret</td></tr>
              ) : (
                filtered.map(sp => {
                  const status = stockStatus(sp)
                  return (
                    <tr
                      key={sp.id}
                      onClick={() => setSelected(sp)}
                      className={clsx('border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer', selected?.id === sp.id && 'bg-blue-50 dark:bg-blue-900/20')}
                    >
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{sp.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{sp.partNumber}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('text-[11px] px-2 py-0.5 rounded font-medium', STOCK_STYLES[status])}>{status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('font-semibold', status === 'Tomt' ? 'text-red-500' : status === 'Lav' ? 'text-amber-500' : 'text-gray-800 dark:text-gray-200')}>
                          {sp.quantity}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">/ min {sp.minQuantity}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{sp.location}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{sp.price.toLocaleString('da-DK')} kr.</td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => adjustStock(sp.id, -1)}
                            disabled={sp.quantity === 0}
                            className="w-7 h-7 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          ><Minus size={12} /></button>
                          <button
                            onClick={() => adjustStock(sp.id, 1)}
                            className="w-7 h-7 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          ><Plus size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <>
          <SparePartDetail sp={spareParts.find(s => s.id === selected.id)!} onClose={() => setSelected(null)} />
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30" onClick={() => setSelected(null)} />
        </>
      )}
    </div>
  )
}
