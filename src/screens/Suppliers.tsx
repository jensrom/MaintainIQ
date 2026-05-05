import { useState } from 'react'
import { Mail, Phone, User, X, Package, Plus, Pencil, Trash2 } from 'lucide-react'
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

const CATEGORIES = [
  'Kompressorer & Pneumatik',
  'Filtre & HVAC',
  'Pumper & Ventiler',
  'Automation & Elektro',
  'GMP & Pharma Udstyr',
  'Andet',
]

const inp = 'w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2'

interface SupplierForm {
  name: string
  contactPerson: string
  email: string
  phone: string
  category: string
}

const EMPTY_FORM: SupplierForm = {
  name: '', contactPerson: '', email: '', phone: '', category: 'Andet',
}

function SupplierModal({
  initial,
  title,
  onSave,
  onClose,
}: {
  initial: SupplierForm
  title: string
  onSave: (f: SupplierForm) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<SupplierForm>(initial)
  const f = (key: keyof SupplierForm, v: string) => setForm(prev => ({ ...prev, [key]: v }))

  return (
    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md max-h-[90vh] bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex flex-col z-40 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        <button onClick={onClose} className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Leverandørnavn *</label>
          <input className={inp} value={form.name} onChange={e => f('name', e.target.value)} placeholder="Firmanavn..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Kategori</label>
          <select className={inp} value={form.category} onChange={e => f('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Kontaktperson</label>
          <input className={inp} value={form.contactPerson} onChange={e => f('contactPerson', e.target.value)} placeholder="Navn på kontakt..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">E-mail</label>
          <input type="email" className={inp} value={form.email} onChange={e => f('email', e.target.value)} placeholder="kontakt@firma.dk" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Telefon</label>
          <input type="tel" className={inp} value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="+45 00 00 00 00" />
        </div>
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 text-sm rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Annuller</button>
        <button
          onClick={() => { if (form.name) { onSave(form); onClose() } }}
          className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >Gem</button>
      </div>
    </div>
  )
}

function SupplierPanel({
  supplier,
  onClose,
  onEdit,
  onDelete,
}: {
  supplier: Supplier
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { spareParts } = useStore()
  const linkedParts = spareParts.filter(sp => sp.supplierId === supplier.id)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md max-h-[90vh] bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex flex-col z-40 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">{supplier.name}</h2>
          <span className={clsx('text-[10px] px-2 py-0.5 rounded font-medium mt-1 inline-block', CATEGORY_COLORS[supplier.category] ?? 'bg-gray-100 text-gray-600')}>
            {supplier.category}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1.5 rounded text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800" title="Redigér"><Pencil size={15} /></button>
          <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800" title="Slet"><Trash2 size={15} /></button>
          <button onClick={onClose} className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={16} /></button>
        </div>
      </div>

      {confirmDelete && (
        <div className="mx-4 mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300 mb-2">Slet <strong>{supplier.name}</strong>? Dette kan ikke fortrydes.</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDelete(false)} className="flex-1 py-1.5 border border-gray-200 dark:border-gray-700 text-xs rounded-lg text-gray-600 dark:text-gray-400">Annuller</button>
            <button onClick={onDelete} className="flex-1 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">Slet</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Contact info */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kontakt</h4>
          <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
            <User size={14} className="text-gray-400 shrink-0" />
            {supplier.contactPerson || '—'}
          </div>
          <a href={`mailto:${supplier.email}`} className="flex items-center gap-2.5 text-sm text-blue-600 dark:text-blue-400 hover:underline">
            <Mail size={14} className="shrink-0" />
            {supplier.email || '—'}
          </a>
          <a href={`tel:${supplier.phone}`} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
            <Phone size={14} className="shrink-0" />
            {supplier.phone || '—'}
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
  const { suppliers, spareParts, createSupplier, updateSupplier, deleteSupplier } = useStore()
  const [selected, setSelected] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  function partCount(supplierId: string) {
    return spareParts.filter(sp => sp.supplierId === supplierId).length
  }

  const selectedSup = suppliers.find(s => s.id === selected) ?? null
  const editingSup = suppliers.find(s => s.id === editingId) ?? null

  function handleDelete() {
    if (!selected) return
    deleteSupplier(selected)
    setSelected(null)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Leverandører</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{suppliers.length} leverandører</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setSelected(null); setEditingId(null) }}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} /> Ny leverandør
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map(sup => {
          const parts = partCount(sup.id)
          const isSelected = selected === sup.id
          return (
            <div
              key={sup.id}
              onClick={() => { setSelected(isSelected ? null : sup.id); setShowCreate(false); setEditingId(null) }}
              className={clsx(
                'bg-white dark:bg-gray-900 rounded-xl border p-4 cursor-pointer hover:shadow-md transition-shadow',
                isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-gray-800'
              )}
            >
              <span className={clsx('text-[10px] px-2 py-0.5 rounded font-medium', CATEGORY_COLORS[sup.category] ?? 'bg-gray-100 text-gray-600')}>
                {sup.category}
              </span>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mt-2 mb-3">{sup.name}</h3>
              <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <User size={13} className="text-gray-400 shrink-0" />
                  <span>{sup.contactPerson || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-gray-400 shrink-0" />
                  <span className="truncate">{sup.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-gray-400 shrink-0" />
                  <span>{sup.phone || '—'}</span>
                </div>
              </div>
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

      {selectedSup && !editingId && (
        <>
          <SupplierPanel
            supplier={selectedSup}
            onClose={() => setSelected(null)}
            onEdit={() => { setEditingId(selected); setSelected(null) }}
            onDelete={handleDelete}
          />
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30" onClick={() => setSelected(null)} />
        </>
      )}

      {showCreate && (
        <>
          <SupplierModal
            initial={EMPTY_FORM}
            title="Ny leverandør"
            onSave={form => createSupplier(form)}
            onClose={() => setShowCreate(false)}
          />
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30" onClick={() => setShowCreate(false)} />
        </>
      )}

      {editingSup && (
        <>
          <SupplierModal
            initial={{
              name: editingSup.name,
              contactPerson: editingSup.contactPerson,
              email: editingSup.email,
              phone: editingSup.phone,
              category: editingSup.category,
            }}
            title="Redigér leverandør"
            onSave={form => updateSupplier(editingId!, form)}
            onClose={() => setEditingId(null)}
          />
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30" onClick={() => setEditingId(null)} />
        </>
      )}
    </div>
  )
}
