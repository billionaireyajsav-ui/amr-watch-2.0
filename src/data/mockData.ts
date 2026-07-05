import type { Hospital, Patient, AlertItem, RiskLevel, AntibioticType, RecoveryStatus } from '@/types';

// ---------------------------------------------------------------------------
// Deterministic mock dataset used when live Firebase/OpenAI credentials are
// not configured. See src/services/README for how to swap in live backends.
// ---------------------------------------------------------------------------

function riskFromScore(score: number): RiskLevel {
  if (score >= 65) return 'high';
  if (score >= 40) return 'moderate';
  return 'low';
}

const districts = [
  'Central Delhi', 'South Delhi', 'North Delhi', 'East Delhi', 'West Delhi',
  'Gurugram', 'Noida', 'Ghaziabad', 'Faridabad', 'Rohini', 'Dwarka', 'Shahdara',
];

const hospitalNames = [
  'All India Institute of Medical Sciences',
  'Safdarjung Hospital',
  'Ram Manohar Lohia Hospital',
  'Lok Nayak Hospital',
  'Fortis Escorts Heart Institute',
  'Max Super Speciality Hospital',
  'Medanta – The Medicity',
  'Sir Ganga Ram Hospital',
  'Batra Hospital & Medical Research Centre',
  'Apollo Hospital Indraprastha',
  'Jaipur Golden Hospital',
  'Kailash Deepak Hospital',
];

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

// simple seeded PRNG for reproducible "random" numbers across reloads
let seed = 42;
function rand(): number {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}
function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

export function generateHospitals(): Hospital[] {
  const coordCenters: [number, number][] = [
    [28.6129, 77.2295], [28.5678, 77.2100], [28.6353, 77.2135], [28.6386, 77.2830],
    [28.6469, 77.3627], [28.5921, 77.2492], [28.4419, 77.0417], [28.5921, 77.0460],
    [28.4595, 77.0266], [28.6692, 77.4538], [28.6935, 77.1085], [28.7041, 77.1025],
  ];

  return hospitalNames.map((name, idx) => {
    const amrScore = randInt(18, 88);
    const broad = randInt(25, 78);
    const narrow = 100 - broad;
    const monthlyTrend = monthLabels.map((month, mIdx) => {
      const drift = randInt(-6, 6);
      const scoreAtMonth = Math.min(95, Math.max(8, amrScore - (5 - mIdx) * 2 + drift));
      return {
        month,
        amrScore: scoreAtMonth,
        broad: Math.min(95, Math.max(10, broad + drift)),
        narrow: Math.max(5, 100 - Math.min(95, Math.max(10, broad + drift))),
      };
    });

    return {
      id: `hosp_${idx + 1}`,
      hospitalId: `HOS-DL-${String(idx + 1).padStart(3, '0')}`,
      name,
      district: districts[idx % districts.length],
      address: `${randInt(1, 90)} Sector ${randInt(1, 40)}, ${districts[idx % districts.length]}, Delhi NCR`,
      lat: coordCenters[idx][0] + (rand() - 0.5) * 0.01,
      lng: coordCenters[idx][1] + (rand() - 0.5) * 0.01,
      amrScore,
      riskLevel: riskFromScore(amrScore),
      patients: randInt(80, 420),
      broadSpectrumPct: broad,
      narrowSpectrumPct: narrow,
      monthlyTrend,
      labConfirmationRate: randInt(48, 97),
      bedCount: randInt(120, 1400),
      type: pick(['Government', 'Private', 'Trust']),
    };
  });
}

const firstNames = ['Aarav', 'Vivaan', 'Aditi', 'Diya', 'Ishaan', 'Kabir', 'Meera', 'Neha', 'Om', 'Priya',
  'Rohan', 'Sanya', 'Tara', 'Vihaan', 'Zara', 'Ananya', 'Dev', 'Kiara', 'Manav', 'Riya',
  'Aryan', 'Fatima', 'Gaurav', 'Heena', 'Imran', 'Jyoti', 'Karan', 'Lavanya', 'Mohit', 'Nisha',
  'Omkar', 'Pooja', 'Qasim', 'Ritu', 'Sameer', 'Tanya', 'Uday', 'Varsha', 'Yash', 'Zoya',
  'Abhishek', 'Bhavna', 'Chirag', 'Deepika', 'Eshan', 'Farhan', 'Gitanjali', 'Harsh'];
const lastNames = ['Sharma', 'Verma', 'Gupta', 'Khan', 'Singh', 'Reddy', 'Iyer', 'Nair', 'Das', 'Mehta',
  'Kapoor', 'Chatterjee', 'Joshi', 'Malhotra', 'Bhatt', 'Rao'];

const symptomPool = ['Fever', 'Cough', 'Dyspnea', 'Chills', 'Abdominal pain', 'Dysuria', 'Wound discharge',
  'Sepsis signs', 'Diarrhea', 'Confusion', 'Tachycardia', 'Localized swelling'];

const broadSpectrumDrugs = ['Meropenem', 'Piperacillin-Tazobactam', 'Vancomycin', 'Ceftriaxone', 'Imipenem'];
const narrowSpectrumDrugs = ['Amoxicillin', 'Penicillin V', 'Cephalexin', 'Doxycycline', 'Macrolide (Azithromycin)'];
const bacteriaPool = ['E. coli (ESBL+)', 'Klebsiella pneumoniae (CRE)', 'Staphylococcus aureus (MRSA)',
  'Pseudomonas aeruginosa', 'Acinetobacter baumannii', 'Enterococcus faecium (VRE)', null, null];

export function generatePatients(hospitals: Hospital[]): Patient[] {
  const patients: Patient[] = [];
  let counter = 1;
  for (let i = 0; i < 48; i++) {
    const hospital = hospitals[i % hospitals.length];
    const initialType: AntibioticType = rand() > 0.45 ? 'Broad-spectrum' : 'Narrow-spectrum';
    const bacteria = pick(bacteriaPool);
    const changed = bacteria !== null && rand() > 0.4;
    const finalType: AntibioticType = changed ? (initialType === 'Broad-spectrum' ? 'Narrow-spectrum' : 'Broad-spectrum') : initialType;
    const recovery: RecoveryStatus = pick(['Recovered', 'Recovered', 'Ongoing Treatment', 'Deteriorating', 'Referred']);
    const year = 2026;
    const month = randInt(1, 6);
    const day = randInt(1, 27);

    patients.push({
      id: `pt_${counter}`,
      patientNumber: `PT-${year}-${String(10000 + counter).slice(1)}`,
      name: `${pick(firstNames)} ${pick(lastNames)}`,
      age: randInt(2, 88),
      gender: pick(['Male', 'Female', 'Other']),
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      district: hospital.district,
      symptoms: Array.from(new Set([pick(symptomPool), pick(symptomPool), pick(symptomPool)])),
      initialAntibiotic: initialType === 'Broad-spectrum' ? pick(broadSpectrumDrugs) : pick(narrowSpectrumDrugs),
      initialAntibioticType: initialType,
      labIdentifiedBacteria: bacteria,
      finalAntibiotic: finalType === 'Broad-spectrum' ? pick(broadSpectrumDrugs) : pick(narrowSpectrumDrugs),
      finalAntibioticType: finalType,
      treatmentChanged: changed,
      recoveryStatus: recovery,
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      doctorNotes: changed
        ? 'Therapy escalated following culture sensitivity results. Patient monitored for renal function and clinical response.'
        : 'Empirical therapy continued; patient responded within expected clinical window.',
    });
    counter++;
  }
  return patients;
}

export function generateAlerts(hospitals: Hospital[]): AlertItem[] {
  const alerts: AlertItem[] = [];
  let id = 1;
  hospitals.forEach((h) => {
    if (h.broadSpectrumPct > 60) {
      alerts.push({
        id: `alert_${id++}`,
        type: 'Excessive broad-spectrum use',
        severity: h.broadSpectrumPct > 72 ? 'critical' : 'warning',
        hospitalId: h.id,
        hospitalName: h.name,
        message: `Broad-spectrum prescriptions account for ${h.broadSpectrumPct}% of cases, exceeding the 60% stewardship threshold.`,
        createdAt: '2026-06-28T09:12:00Z',
        acknowledged: false,
      });
    }
    if (h.monthlyTrend[h.monthlyTrend.length - 1].amrScore > h.monthlyTrend[0].amrScore + 4) {
      alerts.push({
        id: `alert_${id++}`,
        type: 'Declining AMR score',
        severity: 'warning',
        hospitalId: h.id,
        hospitalName: h.name,
        message: `AMR score has worsened from ${h.monthlyTrend[0].amrScore} to ${h.monthlyTrend[h.monthlyTrend.length - 1].amrScore} over the last 6 months.`,
        createdAt: '2026-06-30T14:40:00Z',
        acknowledged: false,
      });
    }
    if (h.riskLevel === 'high') {
      alerts.push({
        id: `alert_${id++}`,
        type: 'High-risk hospital',
        severity: 'critical',
        hospitalId: h.id,
        hospitalName: h.name,
        message: `Overall AMR score of ${h.amrScore} places this facility in the high-risk band. Immediate stewardship review recommended.`,
        createdAt: '2026-07-01T08:05:00Z',
        acknowledged: false,
      });
    }
    if (h.labConfirmationRate < 65) {
      alerts.push({
        id: `alert_${id++}`,
        type: 'Missing lab confirmation',
        severity: 'info',
        hospitalId: h.id,
        hospitalName: h.name,
        message: `Only ${h.labConfirmationRate}% of cases have lab-confirmed bacterial identification before final antibiotic selection.`,
        createdAt: '2026-07-02T11:22:00Z',
        acknowledged: false,
      });
    }
  });
  return alerts;
}
