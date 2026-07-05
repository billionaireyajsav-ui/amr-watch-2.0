import { useEffect, useState } from 'react';
import { FileBarChart, FileDown, FileSpreadsheet, FileText, Plus } from 'lucide-react';
import { Card, Button, Select, EmptyState, Skeleton, Badge } from '@/components/ui/Primitives';
import * as dataService from '@/services/dataService';
import { exportHospitalsCSV, exportHospitalsExcel, exportPatientsCSV, exportPatientsExcel } from '@/services/exportService';
import { generateHospitalReportPDF } from '@/services/pdfService';
import type { Hospital, Patient, ReportRecord, ReportPeriod, ReportFormat } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

const formatIcon: Record<ReportFormat, typeof FileText> = { PDF: FileText, CSV: FileSpreadsheet, Excel: FileSpreadsheet };

export default function Reports() {
  const { show } = useToast();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<ReportPeriod>('Monthly');
  const [format, setFormat] = useState<ReportFormat>('PDF');
  const [scope, setScope] = useState('all');
  const [generating, setGenerating] = useState(false);

  async function load() {
    setLoading(true);
    const [h, p, r] = await Promise.all([dataService.listHospitals(), dataService.listPatients(), dataService.listReports()]);
    setHospitals(h);
    setPatients(p);
    setReports(r);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleGenerate() {
    setGenerating(true);
    const hospitalId = scope === 'all' ? undefined : scope;
    await dataService.createReport(period, format, hospitalId);

    if (format === 'CSV') {
      hospitalId ? exportPatientsCSV(patients.filter((p) => p.hospitalId === hospitalId)) : exportHospitalsCSV(hospitals);
    } else if (format === 'Excel') {
      hospitalId ? exportPatientsExcel(patients.filter((p) => p.hospitalId === hospitalId)) : exportHospitalsExcel(hospitals);
    } else {
      const hospital = hospitalId ? hospitals.find((h) => h.id === hospitalId) : hospitals[0];
      if (hospital) generateHospitalReportPDF(hospital);
    }

    show(`${period} report generated and downloaded.`, 'success');
    await load();
    setGenerating(false);
  }

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <FileBarChart size={18} className="text-[var(--color-culture)]" />
          <h2 className="font-display font-semibold">Generate a Report</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Period</label>
            <Select value={period} onChange={(e) => setPeriod(e.target.value as ReportPeriod)}>
              <option>Daily</option><option>Weekly</option><option>Monthly</option><option>Annual</option>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Scope</label>
            <Select value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="all">All facilities</option>
              {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Format</label>
            <Select value={format} onChange={(e) => setFormat(e.target.value as ReportFormat)}>
              <option>PDF</option><option>CSV</option><option>Excel</option>
            </Select>
          </div>
        </div>
        <Button onClick={handleGenerate} loading={generating} icon={<Plus size={16} />}>Generate & download</Button>
      </Card>

      <Card>
        <h3 className="font-display font-semibold mb-3">Report History</h3>
        {reports.length === 0 ? (
          <EmptyState icon={<FileBarChart size={28} />} title="No reports generated yet" description="Reports you generate will be listed here for quick re-reference." />
        ) : (
          <div className="space-y-2">
            {reports.map((r) => {
              const Icon = formatIcon[r.format];
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-xl px-3.5 py-3 hover:bg-white/[0.03]">
                  <div className="w-9 h-9 rounded-lg bg-[var(--color-culture)]/12 flex items-center justify-center text-[var(--color-culture)] shrink-0">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-xs text-[var(--color-text-faint)]">{r.summary}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge color="var(--color-info)">{r.period}</Badge>
                    <span className="text-xs text-[var(--color-text-faint)] hidden sm:block">{formatDateTime(r.generatedAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
