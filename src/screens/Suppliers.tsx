import { useState } from 'react'
import { Mail, Phone, User, X, Package } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'
import type { Supplier } from '../types'

const CATEGORY_COLORS: Record<string, string> = {
  'Kompressorer & Pneumatik': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Filtre & HVAC': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  'Pumper & Ventiler': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  'Automation & Elektro': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'GMP & Pharma Udstyr': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
}

function SupplierPanel({ supplier, onClose }: { supplier: Supplier; onClose: () => void }) {
  const { spareParts } = useStore()
  const linkedParts = spareParts.filter(sp => sp.supplierId === supplier.id)

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col z-40">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">{supplier.name}</h2>
          <span className={clsx('text-[10px] px-2 py-0.5 rounded font-medium mt-1 inline-block', CATEGORY_COLORS[supplier.category] ?? 'bg-gray-100 text-gray-600')}>
            {supplier.category}
          </span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Contact info */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kontakt</h4>
          <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
            <User size={14} className="text-gray-400 shrink-0" />
            {supplier.contactPerson}
          </div>
          <a href={`mailto:${supplier.email}`} className="flex items-center gap-2.5 text-sm text-blue-600 dark:text-blue-400 hover:underline">
            <Mail size={14} className="shrink-0" />
            {supplier.email}
          </a>
          <a href={`tel:${supplier.phone}`} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
            <Phone size={14} className="shrink-0" />
            {supplier.phone}
          </a>
        </div>

        {/* Linked spare parts */}
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Reservedele ({linkedParts.length})
          </h4>
          {linkedParts.length === 0 ? (
            <p className="text-sm text-gray-400">Ingen reservedele tilknyttet denne leverandør</p>
          ) : (
            <div className="space-y-2">
              {linkedParts.map(sp => {
                const stock = sp.quantity === 0 ? 'Tomt' : sp.quantity < sp.minQuantity ? 'Lav' : 'OK'
                return (
                  <div key={sp.id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{sp.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{sp.partNumber}</p>
                    </div>
                    <div className="text-right">
                      <span className={clsx('text-xs font-medium', stock === 'Tomt' ? 'text-red-500' : stock === 'Lav' ? 'text-amber-500' : 'text-green-600')}>
                        {sp.quantity} stk
                      </span>
                      <p className="text-[10px] text-gray-400">{sp.price.toLocaleString('da-DK')} kr./stk</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Suppliers() {
  const { suppliers, spareParts } = useStore()
  const [selected, setSelected] = useState<Supplier | null>(null)

  function partCount(supplierId: string) {
    return spareParts.filter(sp => sp.supplierId === supplierId).length
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Leverandører</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{suppliers.length} leverandører</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map(sup => {
          const parts = partCount(sup.id)
          const isSelected = selected?.id === sup.id
          return (
            <div
              key={sup.id}
              onClick={() => setSelected(isSelected ? null : sup)}
              className={clsx(
                'bg-white dark:bg-gray-900 rounded-xl border p-4 cursor-pointer hover:shadow-md transition-shadow',
                isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-gray-800'
              )}
            >
              {/* Category badge */}
              <span className={clsx('text-[10px] px-2 py-0.5 rounded font-medium', CATEGORY_COLORS[sup.category] ?? 'bg-gray-100 text-gray-600')}>
                {sup.category}
              </span>

              {/* Name */}
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mt-2 mb-3">{sup.name}</h3>

              {/* Contact */}
              <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <User size={13} className="text-gray-400 shrink-0" />
                  <span>{sup.contactPerson}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-gray-400 shrink-0" />
                  <span className="truncate">{sup.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-gray-400 shrink-0" />
                  <span>{sup.phone}</span>
                </div>
              </div>

              {/* Parts count */}
              {parts > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1.5 text-xs text-gray-400">
                  <Package size={12} />
                  {parts} reservedel{parts !== 1 ? 'e' : ''}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selected && (
        <>
          <SupplierPanel supplier={selected} onClose={() => setSelected(null)} />
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30" onClick={() => setSelected(null)} />
        </>
      )}
    </div>
  )
}
