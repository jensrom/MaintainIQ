import { useState, useMemo } from 'react'
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO,
  isToday, isSameMonth, getDay, addMonths, subMonths, isValid,
} from 'date-fns'
import { da } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, X, ClipboardList, CalendarCheck, Plus } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'
import type { Priority, WorkOrderCategory } from '../types'

type ShowMode = 'WO' | 'PM' | 'Begge'

interface CalendarItem {
  id: string
  title: string
  type: 'WO' | 'PM'
  priority?: string
  isPharma?: boolean
}

interface QuickWOForm {
  title: string
  assetId: string
  priority: Priority
  category: WorkOrderCategory
  description: string
}

const EMPTY_FORM: QuickWOForm = {
  title: '',
  assetId: '',
  priority: 'Normal',
  category: 'Afhjælpende',
  description: '',
}

function QuickCreateModal({
  dueDate,
  onClose,
  onSave,
  assets,
  users,
}: {
  dueDate: string
  onClose: () => void
  onSave: (form: QuickWOForm) => void
  assets: { id: string; name: string }[]
  users: { id: string; name: string }[]
}) {
  const [form, setForm] = useState<QuickWOForm>(EMPTY_FORM)
  const inp = 'w-full text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.assetId) return
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Ny arbejdsordre</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Forfaldsdato: {format(parseISO(dueDate), 'd. MMMM yyyy', { locale: da })}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Titel *</label>
            <input
              required
              className={inp}
              placeholder="Beskriv opgaven kort..."
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Aktiv *</label>
              <select required className={inp} value={form.assetId} onChange={e => setForm(f => ({ ...f, assetId: e.target.value }))}>
                <option value="">Vælg aktiv...</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Prioritet</label>
              <select className={inp} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}>
                {(['Kritisk', 'Høj', 'Normal', 'Lav'] as Priority[]).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type</label>
            <select className={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as WorkOrderCategory }))}>
              {(['Afhjælpende', 'Forebyggende', 'Inspektion', 'Projekt', 'Rengøring'] as WorkOrderCategory[]).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Beskrivelse</label>
            <textarea
              className={inp}
              rows={2}
              placeholder="Valgfri beskrivelse..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Annuller
            </button>
            <button type="submit" className="flex-1 px-4 py-2 text-xs rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">
              Opret arbejdsordre
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CalendarView() {
  const { workOrders, pmTasks, assets, users, createWorkOrder } = useStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showMode, setShowMode] = useState<ShowMode>('Begge')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [quickCreateDate, setQuickCreateDate] = useState<string | null>(null)

  // Build a map: dateStr → items[]
  const itemsByDate = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {}

    if (showMode !== 'PM') {
      workOrders
        .filter(wo => !['Afsluttet', 'Annulleret'].includes(wo.status) && wo.dueDate)
        .forEach(wo => {
          const d = wo.dueDate
          if (!map[d]) map[d] = []
          map[d].push({ id: wo.id, title: wo.title, type: 'WO', priority: wo.priority, isPharma: wo.isPharma })
        })
    }

    if (showMode !== 'WO') {
      pmTasks
        .filter(pm => pm.nextDue && pm.status !== 'Udført')
        .forEach(pm => {
          const d = pm.nextDue
          if (!map[d]) map[d] = []
          map[d].push({ id: pm.id, title: pm.title, type: 'PM', isPharma: pm.isPharma })
        })
    }

    return map
  }, [workOrders, pmTasks, showMode])

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  // Pad days to start on Monday (0=Mon … 6=Sun)
  const startPad = useMemo(() => {
    const dow = getDay(days[0]) // 0=Sun
    return dow === 0 ? 6 : dow - 1
  }, [days])

  const today = new Date().toISOString().split('T')[0]

  function handleDayClick(dateStr: string) {
    setSelectedDate(dateStr === selectedDate ? null : dateStr)
  }

  function handleQuickCreate(dateStr: string, e: React.MouseEvent) {
    e.stopPropagation()
    setQuickCreateDate(dateStr)
  }

  function handleSaveQuickWO(form: QuickWOForm) {
    if (!quickCreateDate) return
    createWorkOrder({
      title: form.title,
      assetId: form.assetId,
      assigneeId: null,
      status: 'Åben',
      priority: form.priority,
      category: form.category,
      dueDate: quickCreateDate,
      description: form.description,
      isPharma: false,
    })
    setQuickCreateDate(null)
  }

  const selectedItems = selectedDate ? (itemsByDate[selectedDate] ?? []) : []

  const PRIORITY_DOT: Record<string, string> = {
    Kritisk: 'bg-red-500',
    Høj: 'bg-orange-400',
    Normal: 'bg-blue-400',
    Lav: 'bg-gray-300',
  }

  return (
    <div className="p-6">
      {quickCreateDate && (
        <QuickCreateModal
          dueDate={quickCreateDate}
          onClose={() => setQuickCreateDate(null)}
          onSave={handleSaveQuickWO}
          assets={assets}
          users={users}
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Kalender</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {format(currentMonth, 'MMMM yyyy', { locale: da })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs font-medium">
            {(['WO', 'PM', 'Begge'] as ShowMode[]).map(m => (
              <button
                key={m}
                onClick={() => setShowMode(m)}
                className={clsx(
                  'px-3 py-1.5 transition-colors',
                  showMode === m
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                {m === 'WO' ? 'Arbejdsordrer' : m === 'PM' ? 'Planlagt vedligehold' : 'Begge'}
              </button>
            ))}
          </div>
          {/* Nav */}
          <button
            onClick={() => setCurrentMonth(m => subMonths(m, 1))}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            I dag
          </button>
          <button
            onClick={() => setCurrentMonth(m => addMonths(m, 1))}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Calendar grid */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
            {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map(d => (
              <div key={d} className="py-2 text-center text-xs font-medium text-gray-400 dark:text-gray-500">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {/* Padding cells */}
            {Array.from({ length: startPad }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[80px] border-b border-r border-gray-50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-950/30" />
            ))}

            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const items = itemsByDate[dateStr] ?? []
              const isSelected = selectedDate === dateStr
              const isTodayDate = dateStr === today
              const isPast = dateStr < today

              return (
                <div
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  className={clsx(
                    'group min-h-[80px] border-b border-r border-gray-50 dark:border-gray-800/50 p-1.5 cursor-pointer transition-colors',
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={clsx(
                      'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                      isTodayDate ? 'bg-blue-600 text-white' : isPast ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'
                    )}>
                      {format(day, 'd')}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {items.length > 2 && (
                        <span className="text-[10px] text-gray-400">+{items.length - 2}</span>
                      )}
                      <button
                        onClick={e => handleQuickCreate(dateStr, e)}
                        title="Opret arbejdsordre"
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    {items.slice(0, 2).map(item => (
                      <div
                        key={item.id}
                        className={clsx(
                          'text-[10px] px-1.5 py-0.5 rounded truncate flex items-center gap-1',
                          item.type === 'WO'
                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                            : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                        )}
                      >
                        {item.isPharma && <span className="shrink-0">🧪</span>}
                        <span className="truncate">{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Side panel — selected day detail */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              {selectedDate
                ? format(parseISO(selectedDate), 'd. MMMM yyyy', { locale: da })
                : 'Vælg en dato'}
            </h3>
            <div className="flex items-center gap-1">
              {selectedDate && (
                <>
                  <button
                    onClick={() => setQuickCreateDate(selectedDate)}
                    title="Opret arbejdsordre på denne dato"
                    className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                  <button onClick={() => setSelectedDate(null)} className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {!selectedDate && (
              <p className="text-xs text-gray-400 text-center py-8">Klik på en dato i kalenderen for at se dagens opgaver</p>
            )}
            {selectedDate && selectedItems.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-8">Ingen opgaver denne dag</p>
            )}
            {selectedItems.length > 0 && (
              <div className="space-y-2">
                {selectedItems.map(item => {
                  const asset = item.type === 'WO'
                    ? assets.find(a => a.id === workOrders.find(w => w.id === item.id)?.assetId)
                    : null
                  return (
                    <div key={item.id} className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-1.5 mb-1">
                        {item.type === 'WO'
                          ? <ClipboardList size={12} className="text-blue-500 shrink-0" />
                          : <CalendarCheck size={12} className="text-green-500 shrink-0" />}
                        <span className={clsx('text-[10px] font-medium px-1.5 py-0.5 rounded',
                          item.type === 'WO' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        )}>
                          {item.type === 'WO' ? 'AO' : 'PM'}
                        </span>
                        {item.isPharma && <span className="text-xs">🧪</span>}
                      </div>
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 leading-snug">{item.title}</p>
                      {asset && <p className="text-[10px] text-gray-400 mt-0.5">{asset.name}</p>}
                      {item.priority && (
                        <p className={clsx('text-[10px] mt-0.5', {
                          'text-red-500': item.priority === 'Kritisk',
                          'text-orange-500': item.priority === 'Høj',
                          'text-blue-500': item.priority === 'Normal',
                          'text-gray-400': item.priority === 'Lav',
                        })}>{item.priority}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          {/* Legend */}
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-blue-400" /> AO
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-green-400" /> PM
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
