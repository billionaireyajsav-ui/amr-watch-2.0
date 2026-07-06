import type { Hospital, Patient, AlertItem } from '@/types';

// ---------------------------------------------------------------------------
// Stewardship Failure Rate
//
// This is the core AMR-stewardship metric described in the problem brief:
// "identify hospitals that frequently continue using broad-spectrum
// antibiotics when a narrower, more targeted antibiotic could have been used."
//
// Unlike a hospital's headline AMR score (which is a broader composite),
// this metric is computed ONLY from cases where the causative bacterium was
// actually lab-identified — i.e. cases where the doctor had the information
// needed to switch to a narrow-spectrum drug. If the hospital kept the
// patient on a broad-spectrum antibiotic anyway, that counts as a
// "stewardship failure" for this metric.
//
// It is always derived live from the current patient list — add, edit, or
// delete a patient record and this number recalculates immediately.
// ---------------------------------------------------------------------------

export interface StewardshipMetrics {
  hospitalId: string;
  /** Cases where a bacterium was lab-identified (a switch decision was possible). */
  identifiedCases: number;
  /** Of those, how many stayed on a broad-spectrum antibiotic anyway. */
  failures: number;
  /** failures / identifiedCases as a 0-100 percentage. 0 when no identified cases exist. */
  failureRate: number;
}

export function computeStewardshipMetrics(hospitalId: string, patients: Patient[]): StewardshipMetrics {
  const hospitalPatients = patients.filter((p) => p.hospitalId === hospitalId);
  const identified = hospitalPatients.filter((p) => p.labIdentifiedBacteria !== null);
  const failures = identified.filter((p) => p.finalAntibioticType === 'Broad-spectrum');
  const failureRate = identified.length > 0 ? Math.round((failures.length / identified.length) * 100) : 0;

  return {
    hospitalId,
    identifiedCases: identified.length,
    failures: failures.length,
    failureRate,
  };
}

export function computeAllStewardshipMetrics(
  hospitalIds: string[],
  patients: Patient[]
): Map<string, StewardshipMetrics> {
  const map = new Map<string, StewardshipMetrics>();
  for (const id of hospitalIds) {
    map.set(id, computeStewardshipMetrics(id, patients));
  }
  return map;
}

export function stewardshipRiskLevel(failureRate: number): 'low' | 'moderate' | 'high' {
  if (failureRate >= 50) return 'high';
  if (failureRate >= 25) return 'moderate';
  return 'low';
}

/**
 * Generates live alerts (not persisted — recomputed on every load) for any
 * hospital whose stewardship failure rate crosses a meaningful threshold.
 * Requires at least 3 identified cases so a single record doesn't skew it.
 */
export function generateStewardshipAlerts(hospitals: Hospital[], patients: Patient[]): AlertItem[] {
  const alerts: AlertItem[] = [];
  for (const hospital of hospitals) {
    const metrics = computeStewardshipMetrics(hospital.id, patients);
    if (metrics.identifiedCases < 3) continue;

    if (metrics.failureRate >= 50) {
      alerts.push({
        id: `live_stewardship_${hospital.id}`,
        type: 'Stewardship failure after diagnosis',
        severity: 'critical',
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        message: `${metrics.failures} of ${metrics.identifiedCases} patients with a lab-identified bacterium (${metrics.failureRate}%) were kept on broad-spectrum antibiotics instead of switching to a targeted drug.`,
        createdAt: new Date().toISOString(),
        acknowledged: false,
      });
    } else if (metrics.failureRate >= 25) {
      alerts.push({
        id: `live_stewardship_${hospital.id}`,
        type: 'Stewardship failure after diagnosis',
        severity: 'warning',
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        message: `${metrics.failures} of ${metrics.identifiedCases} patients with a lab-identified bacterium (${metrics.failureRate}%) remained on broad-spectrum antibiotics after diagnosis.`,
        createdAt: new Date().toISOString(),
        acknowledged: false,
      });
    }
  }
  return alerts;
}
