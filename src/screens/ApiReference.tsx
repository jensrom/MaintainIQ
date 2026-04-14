import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  description: string
  requestBody?: object
  response: object
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  PATCH: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const ENDPOINTS: { group: string; endpoints: ApiEndpoint[] }[] = [
  {
    group: 'Arbejdsordrer',
    endpoints: [
      {
        method: 'GET', path: '/api/v1/work-orders',
        description: 'Hent liste over alle arbejdsordrer. Understøtter filtrering via query-parametre.',
        response: { data: [{ id: 'AO-2401', title: 'Udskiftning af tætningsring', status: 'I gang', priority: 'Kritisk', assetId: 'e1', dueDate: '2026-04-06' }], total: 13 },
      },
      {
        method: 'GET', path: '/api/v1/work-orders/:id',
        description: 'Hent en enkelt arbejdsordre med alle detaljer, opgaver, timer og reservedele.',
        response: { id: 'AO-2401', title: 'Udskiftning af tætningsring', status: 'I gang', priority: 'Kritisk', isPharma: true, tasks: [], timeLog: [], spareParts: [] },
      },
      {
        method: 'POST', path: '/api/v1/work-orders',
        description: 'Opret en ny arbejdsordre.',
        requestBody: { title: 'Ny opgave', assetId: 'e1', priority: 'Normal', category: 'Afhjælpende', dueDate: '2026-05-01', isPharma: false },
        response: { id: 'AO-2414', title: 'Ny opgave', status: 'Åben', createdAt: '2026-04-08' },
      },
      {
        method: 'PATCH', path: '/api/v1/work-orders/:id',
        description: 'Opdatér status, prioritet, forfaldsdato eller tildelt medarbejder på en arbejdsordre.',
        requestBody: { status: 'Afsluttet', assigneeId: 'u2' },
        response: { id: 'AO-2401', status: 'Afsluttet', updatedAt: '2026-04-08' },
      },
      {
        method: 'POST', path: '/api/v1/work-orders/:id/comments',
        description: 'Tilføj en kommentar til en arbejdsordre.',
        requestBody: { text: 'Tætningsringen er monteret og testet.' },
        response: { id: 'c5', text: 'Tætningsringen er monteret og testet.', userId: 'u1', createdAt: '2026-04-08' },
      },
      {
        method: 'POST', path: '/api/v1/work-orders/:id/time-log',
        description: 'Registrér timer brugt på en arbejdsordre.',
        requestBody: { hours: 2.5, note: 'Diagnostik og reparation', date: '2026-04-08', userId: 'u1' },
        response: { id: 'tl5', hours: 2.5, cost: 875, userId: 'u1', date: '2026-04-08' },
      },
    ],
  },
  {
    group: 'Aktiver',
    endpoints: [
      {
        method: 'GET', path: '/api/v1/assets',
        description: 'Hent alle aktiver i hierarkisk struktur (Site → Lokation → Enhed → Værktøj).',
        response: { data: [{ id: 'a0', name: 'Horsens Produktionssite', type: 'Site', parentId: null, criticality: 'Kritisk' }], total: 24 },
      },
      {
        method: 'GET', path: '/api/v1/assets/:id/work-orders',
        description: 'Hent alle aktive arbejdsordrer tilknyttet et specifikt aktiv.',
        response: { assetId: 'e1', activeWorkOrders: 2, data: [{ id: 'AO-2401', status: 'I gang' }] },
      },
    ],
  },
  {
    group: 'Planlagt vedligehold',
    endpoints: [
      {
        method: 'GET', path: '/api/v1/pm-tasks',
        description: 'Hent liste over alle planlagte vedligeholdelsesopgaver.',
        response: { data: [{ id: 'pm1', title: 'Kvartalvist HVAC-eftersyn', status: 'Kommende', nextDue: '2026-04-13', compliance: 57 }], total: 7 },
      },
      {
        method: 'POST', path: '/api/v1/pm-tasks/:id/complete',
        description: 'Markér en PM-opgave som udført. Systemet beregner automatisk næste forfaldsdato.',
        requestBody: { completedAt: '2026-04-08', notes: 'Gennemført uden afvigelser.' },
        response: { id: 'pm2', status: 'Udført', lastDone: '2026-04-08', nextDue: '2026-05-08' },
      },
    ],
  },
  {
    group: 'Reservedele',
    endpoints: [
      {
        method: 'GET', path: '/api/v1/spare-parts',
        description: 'Hent liste over alle reservedele med lagerstatus.',
        response: { data: [{ id: 's1', name: 'Tætningsring 45mm (NBR)', quantity: 2, minQuantity: 5, status: 'Lav' }], total: 10 },
      },
      {
        method: 'PATCH', path: '/api/v1/spare-parts/:id/stock',
        description: 'Regulér lagerbeholdning for en reservedel (positiv = tilføj, negativ = fradrag).',
        requestBody: { delta: 10, note: 'Genopfyldning fra leverandør' },
        response: { id: 's3', quantity: 10, previousQuantity: 0, status: 'OK' },
      },
    ],
  },
  {
    group: 'Leverandører',
    endpoints: [
      {
        method: 'GET', path: '/api/v1/suppliers',
        description: 'Hent liste over alle leverandører.',
        response: { data: [{ id: 'sup1', name: 'Pneumatik Danmark A/S', category: 'Kompressorer & Pneumatik', email: 'henrik@pneumatik-dk.dk' }], total: 5 },
      },
    ],
  },
  {
    group: 'Notifikationer',
    endpoints: [
      {
        method: 'GET', path: '/api/v1/notifications',
        description: 'Hent alle aktive systemnotifikationer baseret på aktuelt systemtilstand.',
        response: { data: [{ id: 'n_ow_AO-2401', type: 'overdue_wo', message: 'Forfaldne: Udskiftning af tætningsring', target: '/arbejdsordrer' }], count: 8 },
      },
    ],
  },
]

function EndpointCard({ endpoint }: { endpoint: ApiEndpoint }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
      >
        <span className={clsx('text-[11px] font-bold px-2 py-0.5 rounded shrink-0 w-16 text-center', METHOD_COLORS[endpoint.method])}>
          {endpoint.method}
        </span>
        <code className="text-sm font-mono text-gray-700 dark:text-gray-300 flex-1">{endpoint.path}</code>
        <span className="text-xs text-gray-400 hidden sm:block flex-1 text-right truncate">{endpoint.description}</span>
        {expanded ? <ChevronDown size={14} className="text-gray-400 shrink-0" /> : <ChevronRight size={14} className="text-gray-400 shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">{endpoint.description}</p>

          {endpoint.requestBody && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Request Body</p>
              <pre className="text-xs bg-gray-900 dark:bg-black text-green-400 rounded-lg p-3 overflow-x-auto">
                {JSON.stringify(endpoint.requestBody, null, 2)}
              </pre>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Response</p>
            <pre className="text-xs bg-gray-900 dark:bg-black text-green-400 rounded-lg p-3 overflow-x-auto">
              {JSON.stringify(endpoint.response, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ApiReference() {
  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">API Reference</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">MaintainIQ REST API — v1.0</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6 text-sm text-gray-600 dark:text-gray-400">
        <strong className="text-gray-800 dark:text-gray-200">Base URL:</strong>{' '}
        <code className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">https://api.maintainiq.dk/api/v1</code>
        <span className="mx-3 text-gray-300 dark:text-gray-600">·</span>
        <strong className="text-gray-800 dark:text-gray-200">Auth:</strong>{' '}
        <code className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">Bearer &lt;token&gt;</code>
        <span className="mx-3 text-gray-300 dark:text-gray-600">·</span>
        <strong className="text-gray-800 dark:text-gray-200">Format:</strong> JSON
      </div>

      <div className="space-y-6">
        {ENDPOINTS.map(group => (
          <div key={group.group}>
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded" />
              {group.group}
            </h2>
            <div className="space-y-2">
              {group.endpoints.map((ep, i) => (
                <EndpointCard key={i} endpoint={ep} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
