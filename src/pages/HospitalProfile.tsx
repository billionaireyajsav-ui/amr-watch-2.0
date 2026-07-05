import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, BedDouble, Users, FlaskConical, FileDown, Sparkles, Loader2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from 'recharts';
import { Card, Badge, Button, Skeleton, EmptyState } from '@/components/ui/Primitives';
import { ResistancePulse } from '@/components/ui/ResistancePulse';
import * as dataService from '@/services/dataService';
import * as aiService from '@/services/aiService';
import { generateHospitalReportPDF } from '@/services/pdfService';
import type { Hospital, Patient, AIInsight } from '@/types';
import { riskColor, riskLabel } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

export default function HospitalProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const [h, allPatients] = await Promise.all([dataService.getHospital(id), dataService.listPatients()]);
      if (!h) { setLoading(false); return; }
      setHospital(h);
      setPatients(allPatients.filter((p) => p.hospitalId === id));
      setLoading(false);
    })();
  }, [id]);

  async function handleGenerateInsight() {
    if (!hospital) return;
    setInsightLoading(true);
    const result = await aiService.generateRiskExplanation(hospital);
    setInsight(result);
    setInsightLoading(false);
  }

  async function handleExport() {
    if (!hospital) return;
    let aiText = insight?.content;
    if (!aiText) {
      const rec = await aiService.generateRecommendation(hospital);
      aiText = rec.content;
    }
    generateHospitalReportPDF(hospital, aiText);
    show('Hospital report PDF downloaded.', 'success');
  }

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-40" /><Skeleton className="h-64" /></div>;
  }

  if (!hospital) {
    return (
      <EmptyState
        title="Hospital not found"
        description="This hospital may have been removed."
        action={<Button onClick={() => navigate('/hospitals')} variant="secondary">Back to hospitals</Button>}
      />
    );
  }

  const hospitalPatients = patients;
  const switched = hospitalPatients.filter((p) => p.treatmentChanged).length;
  const switchPct = hospitalPatients.length ? Math.round((switched / hospitalPatients.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
        <ArrowLeft size={15} /> Back
      </button>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <ResistancePulse score={hospital.amrScore} risk={hospital.riskLevel} size={92} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-xl font-bold">{hospital.name}</h2>
                <Badge color={riskColor[hospital.riskLevel]}>{riskLabel[hospital.riskLevel]}</Badge>
              </div>
              <p className="text-sm text-[var(--color-text-muted)] font-mono mt-0.5">{hospital.hospitalId}</p>
              <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] mt-2">
                <MapPin size={14} /> {hospital.address}
              </div>
            </div>
          </div>
          <Button onClick={handleExport} icon={<FileDown size={16} />} variant="secondary">Download Report (PDF)</Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3"><Users size={18} className="text-[var(--color-info)]" /><div><p className="font-display font-bold">{hospital.patients}</p><p className="text-xs text-[var(--color-text-muted)]">Patients</p></div></Card>
        <Card className="flex items-center gap-3"><BedDouble size={18} className="text-[var(--color-culture)]" /><div><p className="font-display font-bold">{hospital.bedCount}</p><p className="text-xs text-[var(--color-text-muted)]">Beds</p></div></Card>
        <Card className="flex items-center gap-3"><FlaskConical size={18} className="text-[var(--color-caution)]" /><div><p className="font-display font-bold">{hospital.labConfirmationRate}%</p><p className="text-xs text-[var(--color-text-muted)]">Lab confirmation</p></div></Card>
        <Card className="flex items-center gap-3"><Sparkles size={18} className="text-[var(--color-hazard)]" /><div><p className="font-display font-bold">{switchPct}%</p><p className="text-xs text-[var(--color-text-muted)]">Antibiotic switch rate</p></div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-display font-semibold mb-4">AMR Score History</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={hospital.monthlyTrend} margin={{ left: -20 }}>
              <CartesianGrid stroke="rgba(148,178,224,0.08)" vertical={false} />
              <XAxis dataKey="month" stroke="#5C6786" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#5C6786" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#0F1830', border: '1px solid rgba(148,178,224,0.2)', borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="amrScore" stroke="#2AD9C2" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 className="font-display font-semibold mb-4">Monthly Antibiotic Usage</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hospital.monthlyTrend} margin={{ left: -20 }}>
              <CartesianGrid stroke="rgba(148,178,224,0.08)" vertical={false} />
              <XAxis dataKey="month" stroke="#5C6786" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#5C6786" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#0F1830', border: '1px solid rgba(148,178,224,0.2)', borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="broad" name="Broad %" fill="#F0475A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="narrow" name="Narrow %" fill="#2AD9C2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={17} className="text-[var(--color-culture)]" />
            <h3 className="font-display font-semibold">AI Risk Explanation</h3>
          </div>
          <Button variant="secondary" onClick={handleGenerateInsight} loading={insightLoading} icon={<Sparkles size={14} />}>
            {insight ? 'Regenerate' : 'Generate insight'}
          </Button>
        </div>
        {insightLoading ? (
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] py-4"><Loader2 size={16} className="animate-spin" /> Analyzing hospital data…</div>
        ) : insight ? (
          <div>
            <p className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-line">{insight.content}</p>
            <p className="text-[11px] text-[var(--color-text-faint)] mt-3">Generated from this hospital's live dashboard data.</p>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">Generate an explanation of this hospital's AMR risk level, grounded entirely in its current data.</p>
        )}
      </Card>
    </div>
  );
}
