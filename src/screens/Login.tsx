import { useState } from 'react'
import { Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react'
import { useStore } from '../store'

// Microsoft logo SVG inline
function MicrosoftLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 23 23" fill="none">
      <path d="M1 1h10v10H1z" fill="#F25022"/>
      <path d="M12 1h10v10H12z" fill="#7FBA00"/>
      <path d="M1 12h10v10H1z" fill="#00A4EF"/>
      <path d="M12 12h10v10H12z" fill="#FFB900"/>
    </svg>
  )
}

export default function Login() {
  const { login, loginWithEntra, companySettings } = useStore()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [entraloading, setEntraLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setTimeout(() => {
      const ok = login(identifier.trim(), password)
      if (!ok) setError('Forkert e-mail eller adgangskode. Prøv igen.')
      setLoading(false)
    }, 600)
  }

  function handleEntra() {
    setEntraLoading(true)
    setTimeout(() => {
      loginWithEntra()
      setEntraLoading(false)
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo card */}
        <div className="text-center mb-6">
          {companySettings.logo ? (
            <img src={companySettings.logo} alt={companySettings.name} className="h-12 mx-auto mb-3 object-contain" />
          ) : (
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">MaintainIQ</span>
            </div>
          )}
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck size={12} className="text-green-500" />
            <span className="text-[11px] text-slate-400 font-medium">SOC 2 Type II · GDPR Compliant</span>
          </div>
        </div>

        {/* Login card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-6">
          <h1 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Log ind</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
            {companySettings.name}
          </p>

          {/* Microsoft Entra button */}
          <button
            type="button"
            onClick={handleEntra}
            disabled={entraloading}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors mb-4 disabled:opacity-60"
          >
            <MicrosoftLogo />
            {entraloading ? 'Forbinder til Microsoft...' : 'Fortsæt med Microsoft'}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs text-slate-400">eller</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                E-mail eller brugernavn
              </label>
              <input
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="navn@virksomhed.dk"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Adgangskode
                </label>
                <button type="button" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  Glemt adgangskode?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 pr-10 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                <AlertCircle size={14} className="shrink-0" />
                <p className="text-xs">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Logger ind...' : 'Log ind'}
            </button>
          </form>
        </div>

        {/* Demo hint */}
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Demo: brug e-mail + adgangskode <span className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">Demo1234!</span>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-400 mt-4">
          © {new Date().getFullYear()} MaintainIQ · Alle sessioner logges i overensstemmelse med SOC 2
        </p>
      </div>
    </div>
  )
}
