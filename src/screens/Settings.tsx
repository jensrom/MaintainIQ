import { Moon, Sun, Bell, BellOff, FlaskConical, SlidersHorizontal } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { useStore } from '../store'

function Toggle({ checked, onChange, label, description, icon }: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex items-center gap-3">
        {icon && <span className="text-gray-400 dark:text-gray-500">{icon}</span>}
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
          {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none',
          checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
        )}
      >
        <span className={clsx(
          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0'
        )} />
      </button>
    </div>
  )
}

export default function Settings() {
  const { settings, updateSettings } = useStore()

  function setDark(v: boolean) {
    updateSettings({ darkMode: v })
    document.documentElement.classList.toggle('dark', v)
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Indstillinger</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Konfigurér systemets udseende og adfærd</p>
      </div>

      {/* Link to CMMS settings */}
      <NavLink
        to="/cmms-indstillinger"
        className="flex items-center justify-between px-5 py-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 mb-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <SlidersHorizontal size={18} className="text-blue-500" />
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">CMMS Indstillinger</p>
            <p className="text-xs text-gray-400">Enhedskategorier, opslagstabeller, vedligeholds- og arbejdsordreindstillinger</p>
          </div>
        </div>
        <span className="text-xs text-blue-500 font-medium">Åbn →</span>
      </NavLink>

      {/* Appearance */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-5 mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 pb-2">Udseende</h2>
        <Toggle
          checked={settings.darkMode}
          onChange={setDark}
          label="Mørkt tema"
          description="Skift mellem lyst og mørkt udseende"
          icon={settings.darkMode ? <Moon size={16} /> : <Sun size={16} />}
        />
      </section>

      {/* GMP Mode */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-5 mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 pb-2">GMP / Pharma</h2>
        <Toggle
          checked={settings.pharmaMode}
          onChange={v => updateSettings({ pharmaMode: v })}
          label="Pharma-tilstand"
          description="Aktivér GMP-flagning af arbejdsordrer og PM-opgaver (🧪)"
          icon={<FlaskConical size={16} />}
        />
      </section>

      {/* Notifications */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 pb-2">Notifikationer</h2>
        <Toggle
          checked={settings.notifications.overdueWO}
          onChange={v => updateSettings({ notifications: { ...settings.notifications, overdueWO: v } })}
          label="Forfaldne arbejdsordrer"
          description="Varsling når en arbejdsordres forfaldsdato er overskredet"
          icon={<Bell size={16} />}
        />
        <Toggle
          checked={settings.notifications.newRequests}
          onChange={v => updateSettings({ notifications: { ...settings.notifications, newRequests: v } })}
          label="Nye anmodninger"
          description="Varsling ved nye indkommende arbejdsanmodninger fra gæsteportalen"
          icon={<Bell size={16} />}
        />
        <Toggle
          checked={settings.notifications.emptyStock}
          onChange={v => updateSettings({ notifications: { ...settings.notifications, emptyStock: v } })}
          label="Tomt lager"
          description="Varsling når en reservedel er helt opbrugt"
          icon={<BellOff size={16} />}
        />
        <Toggle
          checked={settings.notifications.lowStock}
          onChange={v => updateSettings({ notifications: { ...settings.notifications, lowStock: v } })}
          label="Lavt lager"
          description="Varsling når en reservedel er under minimumsniveauet"
          icon={<Bell size={16} />}
        />
        <Toggle
          checked={settings.notifications.overduePM}
          onChange={v => updateSettings({ notifications: { ...settings.notifications, overduePM: v } })}
          label="Forfaldne PM-opgaver"
          description="Varsling når en planlagt vedligeholdelsesopgave ikke er udført til tiden"
          icon={<Bell size={16} />}
        />
      </section>
    </div>
  )
}
