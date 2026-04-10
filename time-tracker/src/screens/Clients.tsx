import { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Phone, Mail, Users } from 'lucide-react';
import { useStore } from '../store';
import type { Client } from '../types';

const emptyForm = {
  name: '',
  cvr: '',
  contactPerson: '',
  contactEmail: '',
  contactPhone: '',
};

export function Clients() {
  const { clients, cases, timeEntries, addClient, updateClient, deleteClient } = useStore();

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.cvr?.includes(search) ||
      c.contactPerson?.toLowerCase().includes(search.toLowerCase())
  );

  function startCreate() {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(true);
  }

  function startEdit(client: Client) {
    setForm({
      name: client.name,
      cvr: client.cvr ?? '',
      contactPerson: client.contactPerson ?? '',
      contactEmail: client.contactEmail ?? '',
      contactPhone: client.contactPhone ?? '',
    });
    setEditId(client.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (editId) {
      updateClient(editId, form);
    } else {
      addClient(form);
    }
    setShowForm(false);
    setEditId(null);
  }

  function handleDelete(id: string) {
    deleteClient(id);
    setConfirmDelete(null);
  }

  function getClientStats(clientId: string) {
    const clientCases = cases.filter((c) => c.clientId === clientId);
    const caseIds = clientCases.map((c) => c.id);
    const entries = timeEntries.filter((te) => caseIds.includes(te.caseId));
    const totalHours = entries.reduce((s, te) => s + te.hours, 0);
    const activeCases = clientCases.filter((c) => c.status === 'Aktiv').length;
    return { totalHours, activeCases, totalCases: clientCases.length };
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Kunder</h1>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Ny kunde
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Søg på navn, CVR eller kontaktperson…"
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Create/Edit form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            {editId ? 'Rediger kunde' : 'Opret ny kunde'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Virksomhedsnavn *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="f.eks. Acme A/S"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CVR-nummer</label>
              <input
                type="text"
                value={form.cvr}
                onChange={(e) => setForm({ ...form, cvr: e.target.value })}
                placeholder="12345678"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kontaktperson</label>
              <input
                type="text"
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                placeholder="Navn"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                placeholder="kontakt@firma.dk"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefon</label>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                placeholder="40 12 34 56"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {editId ? 'Gem ændringer' : 'Opret kunde'}
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

      {/* Client list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          {clients.length === 0 ? 'Ingen kunder endnu. Opret din første kunde.' : 'Ingen kunder matcher søgningen.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((client) => {
            const stats = getClientStats(client.id);
            const isExpanded = expandedId === client.id;
            const clientCases = cases.filter((c) => c.clientId === client.id);

            return (
              <div
                key={client.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div
                  className="flex items-center gap-4 p-5 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : client.id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <Users size={18} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{client.name}</h3>
                      {client.cvr && (
                        <span className="text-xs text-gray-400">CVR {client.cvr}</span>
                      )}
                    </div>
                    {client.contactPerson && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{client.contactPerson}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-gray-400 uppercase tracking-wide">Aktive sager</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{stats.activeCases}</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-gray-400 uppercase tracking-wide">Totale timer</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalHours.toFixed(1)}t</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); startEdit(client); }}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(client.id); }}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                      {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 px-5 pb-5 pt-4 space-y-4">
                    {/* Contact details */}
                    {(client.contactEmail || client.contactPhone) && (
                      <div className="flex flex-wrap gap-4">
                        {client.contactEmail && (
                          <a
                            href={`mailto:${client.contactEmail}`}
                            className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            <Mail size={13} />
                            {client.contactEmail}
                          </a>
                        )}
                        {client.contactPhone && (
                          <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                            <Phone size={13} />
                            {client.contactPhone}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Cases */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Sager</h4>
                      {clientCases.length === 0 ? (
                        <p className="text-sm text-gray-400">Ingen sager</p>
                      ) : (
                        <div className="space-y-1.5">
                          {clientCases.map((c) => {
                            const caseHours = timeEntries
                              .filter((te) => te.caseId === c.id)
                              .reduce((s, te) => s + te.hours, 0);
                            return (
                              <div key={c.id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      c.status === 'Aktiv' ? 'bg-green-500' :
                                      c.status === 'På pause' ? 'bg-amber-500' :
                                      c.status === 'Faktureret' ? 'bg-blue-500' : 'bg-gray-400'
                                    }`}
                                  />
                                  <span className="text-gray-700 dark:text-gray-300">{c.title}</span>
                                  <span className="text-xs text-gray-400">{c.status}</span>
                                </div>
                                <span className="text-gray-500 dark:text-gray-400 font-medium">{caseHours.toFixed(1)}t</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Delete confirmation */}
                {confirmDelete === client.id && (
                  <div className="border-t border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-b-2xl px-5 py-4">
                    <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                      Er du sikker? Dette sletter kunden, alle dens sager og tidsregistreringer.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(client.id)}
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
