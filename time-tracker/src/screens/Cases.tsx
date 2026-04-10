import { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, MapPin, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store';
import type { Case, CaseStatus, TimeEntry } from '../types';
import { CategoryBadge } from '../components/CategoryBadge';
import { formatDisplay } from '../utils/dates';
import clsx from 'clsx';

const STATUS_OPTIONS: CaseStatus[] = ['Aktiv', 'På pause', 'Lukket', 'Faktureret'];

const STATUS_COLORS: Record<CaseStatus, string> = {
  'Aktiv': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'På pause': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'Lukket': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  'Faktureret': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

const emptyForm = {
  clientId: '',
  title: '',
  description: '',
  status: 'Aktiv' as CaseStatus,
  estimatedHours: '',
};

export function Cases() {
  const { clients, cases, timeEntries, addCase, updateCase, deleteCase } = useStore();

  const [search, setSearch] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterStatus, setFilterStatus] = useState<CaseStatus | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = cases.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchClient = !filterClient || c.clientId === filterClient;
    const matchStatus = !filterStatus || c.status === filterStatus;
    return matchSearch && matchClient && matchStatus;
  });

  function startCreate() {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(true);
  }

  function startEdit(c: Case) {
    setForm({
      clientId: c.clientId,
      title: c.title,
      description: c.description,
      status: c.status,
      estimatedHours: c.estimatedHours?.toString() ?? '',
    });
    setEditId(c.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.clientId || !form.title.trim()) return;
    const data = {
      clientId: form.clientId,
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : undefined,
    };
    if (editId) {
      updateCase(editId, data);
    } else {
      addCase(data);
    }
    setShowForm(false);
    setEditId(null);
  }

  function getCaseHours(caseId: string): number {
    return timeEntries.filter((te) => te.caseId === caseId).reduce((s, te) => s + te.hours, 0);
  }

  function getCaseEntries(caseId: string): TimeEntry[] {
    return timeEntries.filter((te) => te.caseId === caseId).sort((a, b) => b.date.localeCompare(a.date));
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Sager</h1>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Ny sag
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Søg på titel eller beskrivelse…"
          className="flex-1 min-w-48 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Alle kunder</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as CaseStatus | '')}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Alle statusser</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            {editId ? 'Rediger sag' : 'Opret ny sag'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kunde *</label>
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Vælg kunde…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as CaseStatus })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sagtitel *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="f.eks. IT-support kontrakt 2026"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Beskrivelse</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Beskriv sagen kort…"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estimerede timer (budget)</label>
              <input
                type="number"
                value={form.estimatedHours}
                onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
                min="0"
                step="0.5"
                placeholder="f.eks. 40"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              onClick={handleSave}
              disabled={!form.clientId || !form.title.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {editId ? 'Gem ændringer' : 'Opret sag'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditId(null); }}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
            >
              Annuller
            </button>
          </div>
        </div>
      )}

      {/* Cases list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          {cases.length === 0 ? 'Ingen sager endnu. Opret din første sag.' : 'Ingen sager matcher filteret.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const client = clients.find((cl) => cl.id === c.clientId);
            const actualHours = getCaseHours(c.id);
            const pct = c.estimatedHours ? Math.min(100, (actualHours / c.estimatedHours) * 100) : null;
            const isExpanded = expandedId === c.id;
            const entries = getCaseEntries(c.id);
            const onSiteEntries = entries.filter((te) => te.onSite);

            return (
              <div
                key={c.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div
                  className="flex items-start gap-4 p-5 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{c.title}</h3>
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[c.status])}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{client?.name}</p>
                    {c.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{c.description}</p>
                    )}

                    {/* Progress bar */}
                    {pct !== null && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span>{actualHours.toFixed(1)}t forbrugt</span>
                          <span>{c.estimatedHours}t estimeret</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={clsx(
                              'h-full rounded-full transition-all',
                              pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-green-500'
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {pct === null && (
                      <p className="text-sm font-medium text-gray-900 dark:text-white mt-2">{actualHours.toFixed(1)}t registreret</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(c); }}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(c.id); }}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 px-5 pb-5 pt-4 space-y-4">
                    {onSiteEntries.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <MapPin size={12} />
                          On-site besøg ({onSiteEntries.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {onSiteEntries.map((te) => (
                            <span
                              key={te.id}
                              className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-lg"
                            >
                              {formatDisplay(te.date)} · {te.onSiteType}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Tidsregistreringer ({entries.length})
                      </h4>
                      {entries.length === 0 ? (
                        <p className="text-sm text-gray-400">Ingen registreringer på denne sag</p>
                      ) : (
                        <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin">
                          {entries.map((te) => (
                            <div
                              key={te.id}
                              className="flex items-center gap-3 text-sm py-1.5 border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                            >
                              <span className="text-gray-400 shrink-0 w-24">{formatDisplay(te.date)}</span>
                              <CategoryBadge category={te.category} />
                              <span className="flex-1 text-gray-600 dark:text-gray-300 truncate">{te.description}</span>
                              {te.onSite && (
                                <span className="text-blue-500 shrink-0">
                                  <MapPin size={12} />
                                </span>
                              )}
                              {te.invoiced && (
                                <span className="text-green-500 shrink-0">
                                  <CheckCircle2 size={12} />
                                </span>
                              )}
                              <span className="font-semibold text-gray-900 dark:text-white shrink-0">{te.hours}t</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Delete confirmation */}
                {confirmDelete === c.id && (
                  <div className="border-t border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-b-2xl px-5 py-4">
                    <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                      Er du sikker? Dette sletter sagen og alle dens tidsregistreringer.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { deleteCase(c.id); setConfirmDelete(null); }}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Slet permanent
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
                      >
                        Annuller
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
