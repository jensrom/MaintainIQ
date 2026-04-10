export type TimeCategory =
  | 'Salgsmøde'
  | 'Support'
  | 'Grønne timer'
  | 'Intern timer'
  | 'Site Manager';

export type CaseStatus = 'Aktiv' | 'På pause' | 'Lukket' | 'Faktureret';

export type OnSiteType = 'Undervisning' | 'Installation' | 'Salgsmøde';

export interface Client {
  id: string;
  name: string;
  cvr?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
}

export interface Case {
  id: string;
  clientId: string;
  title: string;
  description: string;
  status: CaseStatus;
  estimatedHours?: number;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  caseId: string;
  date: string; // ISO date YYYY-MM-DD
  hours: number;
  category: TimeCategory;
  description: string;
  onSite: boolean;
  onSiteType?: OnSiteType;
  invoiced: boolean;
  createdAt: string;
}

export interface CategorySettings {
  salgsmøde: string;
  support: string;
  grønne: string;
  intern: string;
  sitemanager: string;
}

export interface AppSettings {
  weeklyHours: number;
  darkMode: boolean;
  databasePath: string;
  categoryNames: CategorySettings;
}

export const CATEGORY_KEYS: Record<TimeCategory, keyof CategorySettings> = {
  'Salgsmøde': 'salgsmøde',
  'Support': 'support',
  'Grønne timer': 'grønne',
  'Intern timer': 'intern',
  'Site Manager': 'sitemanager',
};

export const CATEGORY_COLORS: Record<TimeCategory, string> = {
  'Salgsmøde': '#3B82F6',
  'Support': '#F97316',
  'Grønne timer': '#22C55E',
  'Intern timer': '#A855F7',
  'Site Manager': '#6366F1',
};

export const CATEGORY_BG: Record<TimeCategory, string> = {
  'Salgsmøde': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'Support': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  'Grønne timer': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'Intern timer': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Site Manager': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
};

export const DEFAULT_CATEGORIES: TimeCategory[] = [
  'Salgsmøde',
  'Support',
  'Grønne timer',
  'Intern timer',
  'Site Manager',
];

export type PeriodKey = '1uge' | '1måned' | '3måneder' | '6måneder' | '12måneder' | 'brugerdefineret';

export interface DateRange {
  from: string;
  to: string;
}
