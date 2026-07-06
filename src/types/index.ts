// ---------------------------------------------------------------------------
// Core domain types for the AMR Monitoring Dashboard
// ---------------------------------------------------------------------------

export type Role = 'administrator' | 'hospital' | 'health_authority';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: Role;
  hospitalId?: string; // set when role === 'hospital'
  avatarColor: string;
}

export type RiskLevel = 'low' | 'moderate' | 'high';

export interface Hospital {
  id: string;
  hospitalId: string; // human readable code e.g. HOS-DL-014
  name: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  amrScore: number; // 0-100, higher = worse resistance profile
  riskLevel: RiskLevel;
  patients: number;
  broadSpectrumPct: number; // % of prescriptions that are broad spectrum
  narrowSpectrumPct: number;
  monthlyTrend: { month: string; amrScore: number; broad: number; narrow: number }[];
  labConfirmationRate: number; // % of cases with lab-confirmed bacteria before final antibiotic
  bedCount: number;
  type: 'Government' | 'Private' | 'Trust';
}

export type AntibioticType = 'Narrow-spectrum' | 'Broad-spectrum';
export type RecoveryStatus = 'Recovered' | 'Ongoing Treatment' | 'Deteriorating' | 'Referred';

export interface Patient {
  id: string;
  patientNumber: string; // e.g. PT-2026-00931
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  hospitalId: string;
  hospitalName: string;
  district: string;
  symptoms: string[];
  initialAntibiotic: string;
  initialAntibioticType: AntibioticType;
  labIdentifiedBacteria: string | null;
  finalAntibiotic: string;
  finalAntibioticType: AntibioticType;
  treatmentChanged: boolean;
  recoveryStatus: RecoveryStatus;
  date: string; // ISO date of admission
  doctorNotes: string;
}

export type AlertType =
  | 'Excessive broad-spectrum use'
  | 'Declining AMR score'
  | 'High-risk hospital'
  | 'Missing lab confirmation'
  | 'Stewardship failure after diagnosis';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface AlertItem {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  hospitalId: string;
  hospitalName: string;
  message: string;
  createdAt: string;
  acknowledged: boolean;
}

export type ReportPeriod = 'Daily' | 'Weekly' | 'Monthly' | 'Annual';
export type ReportFormat = 'PDF' | 'CSV' | 'Excel';

export interface ReportRecord {
  id: string;
  title: string;
  period: ReportPeriod;
  format: ReportFormat;
  generatedAt: string;
  hospitalId?: string;
  summary: string;
}

export interface AIInsight {
  id: string;
  kind: 'risk_explanation' | 'recommendation' | 'stewardship' | 'trend_summary' | 'public_health';
  title: string;
  content: string;
  basedOnData: boolean;
  createdAt: string;
}