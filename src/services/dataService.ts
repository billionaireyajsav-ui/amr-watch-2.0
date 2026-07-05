import type { Hospital, Patient, AlertItem, ReportRecord, ReportPeriod, ReportFormat, RiskLevel } from '@/types';
import { generateHospitals, generatePatients, generateAlerts } from '@/data/mockData';

// ---------------------------------------------------------------------------
// Mock Firestore-shaped data layer. Collections: hospitals, patients, alerts,
// reports. Persisted to localStorage so CRUD changes survive reloads.
// Swap internals for `firebase/firestore` calls to go live (see README).
// ---------------------------------------------------------------------------

const STORE_KEY = 'amr.store.v2';

interface Store {
  hospitals: Hospital[];
  patients: Patient[];
  alerts: AlertItem[];
  reports: ReportRecord[];
}

function seedStore(): Store {
  const hospitals = generateHospitals();
  const patients = generatePatients(hospitals);
  const alerts = generateAlerts(hospitals);
  return { hospitals, patients, alerts, reports: [] };
}

function loadStore(): Store {
  const raw = localStorage.getItem(STORE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as Store;
    } catch {
      /* fall through to reseed */
    }
  }
  const seeded = seedStore();
  localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
  return seeded;
}

let store: Store = loadStore();

function persist() {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function recomputeRisk(score: number): RiskLevel {
  if (score >= 65) return 'high';
  if (score >= 40) return 'moderate';
  return 'low';
}

// ---- Hospitals -------------------------------------------------------------

export async function listHospitals(): Promise<Hospital[]> {
  return delay([...store.hospitals]);
}

export async function getHospital(id: string): Promise<Hospital | undefined> {
  return delay(store.hospitals.find((h) => h.id === id));
}

export async function createHospital(input: Omit<Hospital, 'id' | 'riskLevel' | 'monthlyTrend'>): Promise<Hospital> {
  const hospital: Hospital = {
    ...input,
    id: `hosp_${Date.now()}`,
    riskLevel: recomputeRisk(input.amrScore),
    monthlyTrend: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month) => ({
      month,
      amrScore: input.amrScore,
      broad: input.broadSpectrumPct,
      narrow: input.narrowSpectrumPct,
    })),
  };
  store.hospitals.push(hospital);
  persist();
  return delay(hospital);
}

export async function updateHospital(id: string, patch: Partial<Hospital>): Promise<Hospital> {
  const idx = store.hospitals.findIndex((h) => h.id === id);
  if (idx === -1) throw new Error('Hospital not found');
  const updated = { ...store.hospitals[idx], ...patch };
  if (patch.amrScore !== undefined) updated.riskLevel = recomputeRisk(patch.amrScore);
  store.hospitals[idx] = updated;
  persist();
  return delay(updated);
}

export async function deleteHospital(id: string): Promise<void> {
  store.hospitals = store.hospitals.filter((h) => h.id !== id);
  store.patients = store.patients.filter((p) => p.hospitalId !== id);
  persist();
  return delay(undefined);
}

// ---- Patients ---------------------------------------------------------------

export async function listPatients(): Promise<Patient[]> {
  return delay([...store.patients]);
}

export async function getPatient(id: string): Promise<Patient | undefined> {
  return delay(store.patients.find((p) => p.id === id));
}

export async function createPatient(input: Omit<Patient, 'id' | 'patientNumber'>): Promise<Patient> {
  const patient: Patient = {
    ...input,
    id: `pt_${Date.now()}`,
    patientNumber: `PT-2026-${String(10000 + store.patients.length + 1).slice(1)}`,
  };
  store.patients.unshift(patient);
  persist();
  return delay(patient);
}

export async function updatePatient(id: string, patch: Partial<Patient>): Promise<Patient> {
  const idx = store.patients.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Patient not found');
  const updated = { ...store.patients[idx], ...patch };
  store.patients[idx] = updated;
  persist();
  return delay(updated);
}

export async function deletePatient(id: string): Promise<void> {
  store.patients = store.patients.filter((p) => p.id !== id);
  persist();
  return delay(undefined);
}

// ---- Alerts -------------------------------------------------------------

export async function listAlerts(): Promise<AlertItem[]> {
  return delay([...store.alerts].sort((a, b) => (a.acknowledged === b.acknowledged ? 0 : a.acknowledged ? 1 : -1)));
}

export async function acknowledgeAlert(id: string): Promise<void> {
  const alert = store.alerts.find((a) => a.id === id);
  if (alert) alert.acknowledged = true;
  persist();
  return delay(undefined);
}

// ---- Reports -------------------------------------------------------------

export async function listReports(): Promise<ReportRecord[]> {
  return delay([...store.reports].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt)));
}

export async function createReport(
  period: ReportPeriod,
  format: ReportFormat,
  hospitalId?: string
): Promise<ReportRecord> {
  const hospital = hospitalId ? store.hospitals.find((h) => h.id === hospitalId) : undefined;
  const record: ReportRecord = {
    id: `rep_${Date.now()}`,
    title: `${period} AMR Surveillance Report${hospital ? ` — ${hospital.name}` : ' — All Facilities'}`,
    period,
    format,
    generatedAt: new Date().toISOString(),
    hospitalId,
    summary: hospital
      ? `Covers ${hospital.name} (${hospital.district}): AMR score ${hospital.amrScore}, ${hospital.broadSpectrumPct}% broad-spectrum use, ${hospital.patients} patients tracked.`
      : `Network-wide summary across ${store.hospitals.length} facilities and ${store.patients.length} patient records.`,
  };
  store.reports.unshift(record);
  persist();
  return delay(record);
}

// ---- Aggregates -------------------------------------------------------------

export async function getDashboardStats() {
  const hospitals = store.hospitals;
  const patients = store.patients;
  const totalPatients = hospitals.reduce((sum, h) => sum + h.patients, 0);
  const avgBroad = Math.round(hospitals.reduce((s, h) => s + h.broadSpectrumPct, 0) / hospitals.length);
  const avgNarrow = 100 - avgBroad;
  const avgAmr = Math.round(hospitals.reduce((s, h) => s + h.amrScore, 0) / hospitals.length);
  const highRisk = hospitals.filter((h) => h.riskLevel === 'high').length;
  const activeAlerts = store.alerts.filter((a) => !a.acknowledged).length;

  return delay({
    totalHospitals: hospitals.length,
    totalPatients,
    avgBroad,
    avgNarrow,
    avgAmr,
    highRisk,
    activeAlerts,
    recentPatients: patients.length,
  });
}

export function resetMockStore(): void {
  store = seedStore();
  persist();
}
