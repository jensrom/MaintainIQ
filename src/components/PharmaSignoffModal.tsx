import { useState } from 'react'
import { ShieldCheck, X, AlertCircle, Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store'

interface Props {
  actionLabel: string        // e.g. "Afslut arbejdsordre" or "Markér PM udført"
  entityName: string         // e.g. "AO-001: Kompressor service"
  onConfirm: (comment: string) => void
  onCancel: () => void
}

// Microsoft logo SVG
function MicrosoftLogo() {
  return (
    <svg width="14" height="14" viewBox="0 0 23 23" fill="none">
      <path d="M1 1h10v10H1z" fill="#F25022"/>
      <path d="M12 1h10v10H12z" fill="#7FBA00"/>
      <path d="M1 12h10v10H1z" fill="#00A4EF"/>
      <path d="M12 12h10v10H12z" fill="#FFB900"/>
    </svg>
  )
}

const REASONS = [
  'Arbejde udført og verificeret',
  'Inspektion gennemført',
  'Kalibrering verificeret',
  'Afvigelse dokumenteret og lukket',
  'CAPA implementeret og verificeret',
  'Godkendelse af PM-udførelse',
  'Andet (se kommentar)',
]

export default function PharmaSignoffModal({ actionLabel, entityName, onConfirm, onCancel }: Props) {
  const { auth, users, login } = useStore()
  const activeUser = auth ? users.find(u => u.id === auth.userId) : null

  const [reason, setReason] = useState(REASONS[0])
  const [comment, setComment] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [entraLoading, setEntraLoading] = useState(false)

  const now = new Date()
  const dateStr = now.toLocaleDateString('da-DK', { day: '2-digit', month: 'long', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })

  function handlePasswordSign() {
    if (!password) { setError('Indtast din adgangskode'); return }
    setLoading(true)
    setError('')
    setTimeout(() => {
      const ok = login(activeUser?.email ?? '', password)
      if (!ok) {
        setError('Forkert adgangskode. Prøv igen.')
        setLoading(false)
        return
      }
      onConfirm(`${reason}${comment ? ' — ' + comment : ''}`)
    }, 500)
  }

  function handleEntraSign() {
    setEntraLoading(true)
    setTimeout(() => {
      onConfirm(`${reason}${comment ? ' — ' + comment : ''} [Microsoft Entra]`)
    }, 1000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 bg-blue-600 text-white">
          <ShieldCheck size={20} />
          <div className="flex-1">
            <p className="font-semibold text-sm">Elektronisk underskrift krævet</p>
            <p className="text-xs text-blue-200">21 CFR Part 11 · GMP Compliance</p>
          </div>
          <button onClick={onCancel} className="text-blue-200 hover:text-white"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Action context */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
            <p className="text-[11px] text-slate-400 mb-1 font-medium uppercase tracking-wide">Handling</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{actionLabel}</p>
            <p className="text-xs text-slate-500 mt-0.5">{entityName}</p>
          </div>

          {/* Signer info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-slate-400 mb-0.5">Underskriver</p>
              <p className="font-medium text-slate-800 dark:text-slate-200">{activeUser?.name ?? '—'}</p>
              <p className="text-slate-400">{activeUser?.title}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-0.5">Tidspunkt</p>
              <p className="font-medium text-slate-800 dark:text-slate-200">{dateStr}</p>
              <p className="text-slate-400">{timeStr}</p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Årsag *</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Kommentar (valgfrit)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={2}
              className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Yderligere bemærkninger..."
            />
          </div>

          {/* Statement */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded p-2.5 leading-relaxed border border-slate-200 dark:border-slate-700">
            Jeg bekræfter hermed, at ovenstående handling er udført i overensstemmelse med gældende procedurer (SOP) og GMP-krav, og at oplysningerne i dette system er korrekte og fuldstændige.
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              <AlertCircle size={13} className="shrink-0" />
              <p className="text-xs">{error}</p>
            </div>
          )}

          {/* Sign methods */}
          <div className="space-y-2">
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePasswordSign()}
                placeholder="Bekræft med adgangskode"
                className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 pr-10 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <button
              onClick={handlePasswordSign}
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? 'Verificerer...' : 'Underskriv med adgangskode'}
            </button>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-[11px] text-slate-400">eller</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>
            <button
              onClick={handleEntraSign}
              disabled={entraLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-60"
            >
              <MicrosoftLogo />
              {entraLoading ? 'Forbinder...' : 'Underskriv med Microsoft Entra'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
