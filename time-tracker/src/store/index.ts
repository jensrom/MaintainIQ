import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Client,
  Case,
  TimeEntry,
  AppSettings,
  TimeCategory,
} from '../types';
import { today } from '../utils/dates';

function uuid(): string {
  return crypto.randomUUID();
}

interface Store {
  // Data
  clients: Client[];
  cases: Case[];
  timeEntries: TimeEntry[];
  settings: AppSettings;

  // Client actions
  addClient: (data: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (id: string, data: Partial<Omit<Client, 'id' | 'createdAt'>>) => void;
  deleteClient: (id: string) => void;

  // Case actions
  addCase: (data: Omit<Case, 'id' | 'createdAt'>) => void;
  updateCase: (id: string, data: Partial<Omit<Case, 'id' | 'createdAt'>>) => void;
  deleteCase: (id: string) => void;

  // TimeEntry actions
  addTimeEntry: (data: Omit<TimeEntry, 'id' | 'createdAt'>) => void;
  updateTimeEntry: (id: string, data: Partial<Omit<TimeEntry, 'id' | 'createdAt'>>) => void;
  deleteTimeEntry: (id: string) => void;

  // Settings actions
  updateSettings: (data: Partial<AppSettings>) => void;
}

const defaultSettings: AppSettings = {
  weeklyHours: 37,
  darkMode: false,
  databasePath: '',
  categoryNames: {
    salgsmøde: 'Salgsmøde',
    support: 'Support',
    grønne: 'Grønne timer',
    intern: 'Intern timer',
    sitemanager: 'Site Manager',
  },
};

// Sample data to start with
const sampleClients: Client[] = [
  {
    id: 'client-1',
    name: 'Acme A/S',
    cvr: '12345678',
    contactPerson: 'Lars Nielsen',
    contactEmail: 'lars@acme.dk',
    contactPhone: '40 12 34 56',
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'client-2',
    name: 'TechCorp ApS',
    cvr: '87654321',
    contactPerson: 'Maria Christensen',
    contactEmail: 'maria@techcorp.dk',
    contactPhone: '61 98 76 54',
    createdAt: '2026-02-01T08:00:00Z',
  },
];

const sampleCases: Case[] = [
  {
    id: 'case-1',
    clientId: 'client-1',
    title: 'IT-support kontrakt 2026',
    description: 'Løbende IT-support og vedligeholdelse for Acme A/S inkl. helpdesk og on-site besøg.',
    status: 'Aktiv',
    estimatedHours: 100,
    createdAt: '2026-01-20T08:00:00Z',
  },
  {
    id: 'case-2',
    clientId: 'client-1',
    title: 'Microsoft 365 migration',
    description: 'Komplet migration fra on-premise til Microsoft 365 inkl. Exchange, SharePoint og Teams.',
    status: 'Aktiv',
    estimatedHours: 40,
    createdAt: '2026-02-10T08:00:00Z',
  },
  {
    id: 'case-3',
    clientId: 'client-2',
    title: 'Netværksopgradering',
    description: 'Opgradering af netværksinfrastruktur med ny switch og Wi-Fi 6 access points.',
    status: 'På pause',
    estimatedHours: 20,
    createdAt: '2026-03-01T08:00:00Z',
  },
];

const sampleTimeEntries: TimeEntry[] = [
  {
    id: 'te-1',
    caseId: 'case-1',
    date: today(),
    hours: 2,
    category: 'Support',
    description: 'Helpdesk opkald - mailproblem hos bruger',
    onSite: false,
    invoiced: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'te-2',
    caseId: 'case-2',
    date: today(),
    hours: 3.5,
    category: 'Grønne timer',
    description: 'Opsætning af Exchange Online konti og datamigrering',
    onSite: false,
    invoiced: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'te-3',
    caseId: 'case-1',
    date: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0, 10);
    })(),
    hours: 4,
    category: 'Salgsmøde',
    description: 'Salgsmøde om ny supportkontrakt for 2027',
    onSite: true,
    onSiteType: 'Salgsmøde',
    invoiced: false,
    createdAt: new Date().toISOString(),
  },
];

const categories: TimeCategory[] = [
  'Salgsmøde',
  'Support',
  'Grønne timer',
  'Intern timer',
  'Site Manager',
];

export { categories };

export const useStore = create<Store>()(
  persist(
    (set) => ({
      clients: sampleClients,
      cases: sampleCases,
      timeEntries: sampleTimeEntries,
      settings: defaultSettings,

      addClient: (data) =>
        set((state) => ({
          clients: [
            ...state.clients,
            { ...data, id: uuid(), createdAt: new Date().toISOString() },
          ],
        })),

      updateClient: (id, data) =>
        set((state) => ({
          clients: state.clients.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),

      deleteClient: (id) =>
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
          cases: state.cases.filter((c) => c.clientId !== id),
          timeEntries: state.timeEntries.filter(
            (te) => !state.cases.filter((c) => c.clientId === id).map((c) => c.id).includes(te.caseId)
          ),
        })),

      addCase: (data) =>
        set((state) => ({
          cases: [
            ...state.cases,
            { ...data, id: uuid(), createdAt: new Date().toISOString() },
          ],
        })),

      updateCase: (id, data) =>
        set((state) => ({
          cases: state.cases.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),

      deleteCase: (id) =>
        set((state) => ({
          cases: state.cases.filter((c) => c.id !== id),
          timeEntries: state.timeEntries.filter((te) => te.caseId !== id),
        })),

      addTimeEntry: (data) =>
        set((state) => ({
          timeEntries: [
            { ...data, id: uuid(), createdAt: new Date().toISOString() },
            ...state.timeEntries,
          ],
        })),

      updateTimeEntry: (id, data) =>
        set((state) => ({
          timeEntries: state.timeEntries.map((te) =>
            te.id === id ? { ...te, ...data } : te
          ),
        })),

      deleteTimeEntry: (id) =>
        set((state) => ({
          timeEntries: state.timeEntries.filter((te) => te.id !== id),
        })),

      updateSettings: (data) =>
        set((state) => ({
          settings: { ...state.settings, ...data },
        })),
    }),
    {
      name: 'time-tracker-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Selectors
export const selectClientById = (id: string) => (state: Store) =>
  state.clients.find((c) => c.id === id);

export const selectCasesByClient = (clientId: string) => (state: Store) =>
  state.cases.filter((c) => c.clientId === clientId);

export const selectEntriesByCase = (caseId: string) => (state: Store) =>
  state.timeEntries.filter((te) => te.caseId === caseId);

export const selectEntriesInRange = (from: string, to: string) => (state: Store) =>
  state.timeEntries.filter((te) => te.date >= from && te.date <= to);

export const selectTotalHoursByCase = (caseId: string) => (state: Store) =>
  state.timeEntries
    .filter((te) => te.caseId === caseId)
    .reduce((sum, te) => sum + te.hours, 0);
