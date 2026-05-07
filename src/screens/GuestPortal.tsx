import { useState } from 'react'
import { CheckCircle2, Send, Clock } from 'lucide-react'
import { format, parseISO, isValid } from 'date-fns'
import { da } from 'date-fns/locale'
import { useStore } from '../store'
import type { Priority } from '../types'

function fmt(dateStr: string) {
  try { const d = parseISO(dateStr); return isValid(d) ? format(d, 'd. MMM yyyy', { locale: da }) : dateStr }
  catch { return dateStr }
}

export default function GuestPortal() {
  const { assets, createWorkOrder, workOrders, companySettings } = useStore()
  const welcomeText = companySettings.guestPortalWelcome ?? 'Udfyld formularen for at indberette et problem eller en vedligeholdelsesanmodning.'
  const confirmText = companySettings.guestPortalConfirmation ?? 'Tak for din anmodning! Vi har modtaget den og vender tilbage hurtigst muligt.'
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', description: '', assetId: '', priority: 'Normal' as Priority,
  })

  const recentRequests = workOrders
    .filter(wo => wo.status === 'Arbejdsanmodning')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description || !form.assetId) return
    createWorkOrder({
      title: `Anmodning: ${form.description.slice(0, 50)}${form.description.length > 50 ? '...' : ''}`,
      assetId: form.assetId,
      assigneeId: null,
      status: 'Arbejdsanmodning',
      priority: form.priority,
      category: 'Afhjælpende',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      description: form.description,
      isPharma: false,
      requesterName: form.name,
      requesterEmail: form.email,
      requesterPhone: form.phone,
    })
    setSubmitted(true)
  }

  function reset() {
    setForm({ name: '', email: '', phone: '', description: '', assetId: '', priority: 'Normal' })
    setSubmitted(false)
  }

  const inp = 'w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Gæsteportal</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Indberetning af fejl og vedligeholdsanmodninger</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {!submitted ? (
              <form onSubmit={handleSubmit}>
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">Ny vedligeholdelsesanmodning</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{welcomeText}</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Navn</label>
                      <input className={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Dit fulde navn" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
                      <input type="email" className={inp} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="din@email.dk" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Telefon</label>
                      <input type="tel" className={inp} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+45 xx xx xx xx" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Beskrivelse af problemet *</label>
                    <textarea
                      required
                      className={inp}
                      rows={4}
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Beskriv problemet så detaljeret som muligt..."
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Aktiv / Lokation *</label>
                      <select required className={inp} value={form.assetId} onChange={e => setForm(f => ({ ...f, assetId: e.target.value }))}>
                        <option value="">Vælg lokation eller udstyr...</option>
                        {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Prioritet</label>
                      <select className={inp} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}>
                        <option value="Høj">Høj</option>
                        <option value="Normal">Normal</option>
                        <option value="Lav">Lav</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Send size={15} /> Indsend anmodning
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="p-12 text-center">
                <CheckCircle2 size={48} className="mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Anmodning modtaget!</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{confirmText}</p>
                <button
                  onClick={reset}
                  className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Indsend ny anmodning
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent requests */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Seneste anmodninger</h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {recentRequests.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Clock size={28} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-400">Ingen anmodninger endnu</p>
              </div>
            ) : (
              recentRequests.map(wo => {
                const asset = assets.find(a => a.id === wo.assetId)
                return (
                  <div key={wo.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">{wo.title}</p>
                      <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        wo.priority === 'Høj' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        wo.priority === 'Lav' ? 'bg-gray-100 text-gray-500 dark:bg-gray-800' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>{wo.priority}</span>
                    </div>
                    <p className="text-xs text-gray-400">{asset?.name ?? '—'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {wo.requesterName && <span className="text-xs text-gray-400">{wo.requesterName}</span>}
                      <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
                      <span className="text-xs text-gray-400">{fmt(wo.createdAt)}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
