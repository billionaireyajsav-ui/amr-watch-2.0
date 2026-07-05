import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileDown, User, Building2, Stethoscope, FlaskConical, Pill, ClipboardList, ShieldAlert } from 'lucide-react';
import { Card, Badge, Button, Skeleton, EmptyState } from '@/components/ui/Primitives';
import { ResistancePulse } from '@/components/ui/ResistancePulse';
import * as dataService from '@/services/dataService';
import { generatePatientReportPDF } from '@/services/pdfService';
import type { Patient, Hospital } from '@/types';
import { formatDate, riskColor, riskLabel } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

const recoveryColor: Record<string, string> = {
  Recovered: 'var(--color-culture)',
  'Ongoing Treatment': 'var(--color-info)',
  Deteriorating: 'var(--color-hazard)',
  Referred: 'var(--color-caution)',
};

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-3.5">
        <Icon size={16} className="text-[var(--color-culture)]" />
        <h3 className="font-display font-semibold">{title}</h3>
      </div>
      {children}
    </Card>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-[var(--color-text-faint)] mb-0.5">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

export default function PatientReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [hospital, setHospital] = useState<Hospital | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const p = await dataService.getPatient(id);
      if (!p) { setLoading(false); return; }
      setPatient(p);
      const h = await dataService.getHospital(p.hospitalId);
      setHospital(h);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-40" /><Skeleton className="h-64" /></div>;

  if (!patient) {
    return (
      <EmptyState
        title="Patient record not found"
        description="This record may have been removed."
        action={<Button variant="secondary" onClick={() => navigate('/patients')}>Back to patient records</Button>}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
          <ArrowLeft size={15} /> Back
        </button>
        <Button
          icon={<FileDown size={16} />}
          variant="secondary"
          onClick={() => { generatePatientReportPDF(patient, hospital); show('Patient report PDF downloaded.', 'success'); }}
        >
          Download PDF
        </Button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-culture)]/12 flex items-center justify-center text-[var(--color-culture)]">
              <User size={24} />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">{patient.name}</h2>
              <p className="text-sm text-[var(--color-text-muted)] font-mono">{patient.patientNumber}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge color={recoveryColor[patient.recoveryStatus]}>{patient.recoveryStatus}</Badge>
                {patient.treatmentChanged && <Badge color="var(--color-caution)">Treatment changed</Badge>}
              </div>
            </div>
          </div>
          {hospital && <ResistancePulse score={hospital.amrScore} risk={hospital.riskLevel} size={80} label="Hospital AMR" />}
        </div>
      </Card>

      <Section icon={User} title="Patient Information">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Age" value={patient.age} />
          <Field label="Gender" value={patient.gender} />
          <Field label="Admission Date" value={formatDate(patient.date)} />
          <Field label="District" value={patient.district} />
        </div>
      </Section>

      <Section icon={Building2} title="Hospital Information">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Hospital" value={patient.hospitalName} />
          <Field label="AMR Score" value={hospital ? `${hospital.amrScore}/100` : '—'} />
          <Field label="Risk Level" value={hospital ? <Badge color={riskColor[hospital.riskLevel]}>{riskLabel[hospital.riskLevel]}</Badge> : '—'} />
        </div>
      </Section>

      <Section icon={Stethoscope} title="Symptoms">
        <div className="flex flex-wrap gap-1.5">
          {patient.symptoms.map((s) => <Badge key={s} color="var(--color-info)">{s}</Badge>)}
        </div>
      </Section>

      <Section icon={Pill} title="Antibiotic History">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[var(--color-border)] p-3.5">
            <p className="text-xs text-[var(--color-text-faint)] mb-1.5">Initial Therapy</p>
            <p className="font-medium">{patient.initialAntibiotic}</p>
            <Badge color={patient.initialAntibioticType === 'Broad-spectrum' ? 'var(--color-hazard)' : 'var(--color-culture)'} className="mt-2">{patient.initialAntibioticType}</Badge>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] p-3.5">
            <p className="text-xs text-[var(--color-text-faint)] mb-1.5">Final Therapy</p>
            <p className="font-medium">{patient.finalAntibiotic}</p>
            <Badge color={patient.finalAntibioticType === 'Broad-spectrum' ? 'var(--color-hazard)' : 'var(--color-culture)'} className="mt-2">{patient.finalAntibioticType}</Badge>
          </div>
        </div>
      </Section>

      <Section icon={FlaskConical} title="Laboratory Results">
        {patient.labIdentifiedBacteria ? (
          <p className="text-sm">Lab-confirmed organism: <span className="font-medium">{patient.labIdentifiedBacteria}</span></p>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">No lab-confirmed bacterial identification on file for this case.</p>
        )}
      </Section>

      <Section icon={ShieldAlert} title="Risk Analysis">
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          {patient.treatmentChanged
            ? `Therapy was escalated or de-escalated following ${patient.labIdentifiedBacteria ? 'culture-confirmed' : 'clinical'} findings, which aligns with recommended stewardship practice.`
            : 'Empirical therapy was continued through the course of treatment without a documented switch.'}
          {' '}Current recovery status: <span className="text-[var(--color-text-primary)]">{patient.recoveryStatus}</span>.
        </p>
      </Section>

      <Section icon={ClipboardList} title="Doctor Notes">
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{patient.doctorNotes}</p>
      </Section>
    </div>
  );
}
