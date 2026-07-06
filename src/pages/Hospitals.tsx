import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { Card, Button, Input, Select, Badge, EmptyState, Skeleton } from '@/components/ui/Primitives';
import { Modal } from '@/components/ui/Modal';
import * as dataService from '@/services/dataService';
import type { Hospital, Patient, RiskLevel } from '@/types';
import { riskColor, riskLabel } from '@/lib/utils';
import { computeAllStewardshipMetrics, stewardshipRiskLevel } from '@/lib/stewardship';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const PAGE_SIZE = 8;

const emptyForm: Omit<Hospital, 'id' | 'riskLevel' | 'monthlyTrend'> = {
  hospitalId: '', name: '', district: '', address: '', lat: 28.6139, lng: 77.209,
  amrScore: 30, patients: 100, broadSpectrumPct: 40, narrowSpectrumPct: 60,
  labConfirmationRate: 80, bedCount: 200, type: 'Government',
};

export default function Hospitals() {
  const { hasAccess } = useAuth();
  const { show } = useToast();
  const canEdit = hasAccess(['administrator']);

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Hospital | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Hospital | null>(null);

  async function load() {
    setLoading(true);
    const [hospitalData, patientData] = await Promise.all([dataService.listHospitals(), dataService.listPatients()]);
    setHospitals(hospitalData);
    setPatients(patientData);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const stewardshipByHospital = useMemo(
    () => computeAllStewardshipMetrics(hospitals.map((h) => h.id), patients),
    [hospitals, patients]
  );

  const districts = useMemo(() => Array.from(new Set(hospitals.map((h) => h.district))).sort(), [hospitals]);

  const filtered = useMemo(() => {
    return hospitals.filter((h) => {
      const matchesQuery = `${h.name} ${h.hospitalId} ${h.district}`.toLowerCase().includes(query.toLowerCase());
      const matchesRisk = riskFilter === 'all' || h.riskLevel === riskFilter;
      const matchesDistrict = districtFilter === 'all' || h.district === districtFilter;
      return matchesQuery && matchesRisk && matchesDistrict;
    });
  }, [hospitals, query, riskFilter, districtFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(h: Hospital) {
    setEditing(h);
    setForm({
      hospitalId: h.hospitalId, name: h.name, district: h.district, address: h.address, lat: h.lat, lng: h.lng,
      amrScore: h.amrScore, patients: h.patients, broadSpectrumPct: h.broadSpectrumPct, narrowSpectrumPct: h.narrowSpectrumPct,
      labConfirmationRate: h.labConfirmationRate, bedCount: h.bedCount, type: h.type,
    });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const narrow = 100 - form.broadSpectrumPct;
      const payload = { ...form, narrowSpectrumPct: narrow };
      if (editing) {
        await dataService.updateHospital(editing.id, payload);
        show('Hospital updated successfully.', 'success');
      } else {
        await dataService.createHospital(payload);
        show('Hospital added successfully.', 'success');
      }
      setModalOpen(false);
      await load();
    } catch {
      show('Something went wrong while saving. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await dataService.deleteHospital(deleteTarget.id);
    show(`${deleteTarget.name} removed.`, 'success');
    setDeleteTarget(null);
    await load();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
            <Input placeholder="Search hospital, ID, or district…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} className="pl-10" />
          </div>
          <Select value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value as any); setPage(1); }} className="sm:w-44">
            <option value="all">All risk levels</option>
            <option value="low">Low risk</option>
            <option value="moderate">Moderate risk</option>
            <option value="high">High risk</option>
          </Select>
          <Select value={districtFilter} onChange={(e) => { setDistrictFilter(e.target.value); setPage(1); }} className="sm:w-44">
            <option value="all">All districts</option>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </div>
        {canEdit && (
          <Button onClick={openAdd} icon={<Plus size={16} />} className="shrink-0">Add Hospital</Button>
        )}
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Building2 size={28} />} title="No hospitals match your filters" description="Try adjusting your search term or filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-faint)] uppercase tracking-wide">
                    <th className="px-5 py-3 font-medium">Hospital</th>
                    <th className="px-5 py-3 font-medium">District</th>
                    <th className="px-5 py-3 font-medium">AMR Score</th>
                    <th className="px-5 py-3 font-medium">Risk</th>
                    <th className="px-5 py-3 font-medium">Patients</th>
                    <th className="px-5 py-3 font-medium">Stewardship Failures</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((h) => (
                    <tr key={h.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5">
                        <p className="font-medium">{h.name}</p>
                        <p className="text-xs text-[var(--color-text-faint)] font-mono">{h.hospitalId}</p>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--color-text-muted)]">{h.district}</td>
                      <td className="px-5 py-3.5 font-mono tabular-nums">{h.amrScore}</td>
                      <td className="px-5 py-3.5"><Badge color={riskColor[h.riskLevel]}>{riskLabel[h.riskLevel]}</Badge></td>
                      <td className="px-5 py-3.5 tabular-nums">{h.patients}</td>
                      <td className="px-5 py-3.5">
                        {(() => {
                          const m = stewardshipByHospital.get(h.id);
                          if (!m || m.identifiedCases === 0) {
                            return <span className="text-xs text-[var(--color-text-faint)]">No identified cases</span>;
                          }
                          const risk = stewardshipRiskLevel(m.failureRate);
                          return (
                            <div className="flex items-center gap-2">
                              <Badge color={riskColor[risk]}>{m.failureRate}%</Badge>
                              <span className="text-xs text-[var(--color-text-faint)]">{m.failures}/{m.identifiedCases} cases</span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/hospitals/${h.id}`} className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-culture)] hover:bg-white/5" aria-label={`View ${h.name}`}>
                            <Eye size={15} />
                          </Link>
                          {canEdit && (
                            <>
                              <button onClick={() => openEdit(h)} className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-info)] hover:bg-white/5" aria-label={`Edit ${h.name}`}>
                                <Pencil size={15} />
                              </button>
                              <button onClick={() => setDeleteTarget(h)} className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-hazard)] hover:bg-white/5" aria-label={`Delete ${h.name}`}>
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-faint)]">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1.5">
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-white/5"><ChevronLeft size={16} /></button>
                <span className="text-xs px-2">{page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-white/5"><ChevronRight size={16} /></button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Hospital' : 'Add Hospital'} size="lg">
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Hospital Name</label>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Hospital ID</label>
            <Input required value={form.hospitalId} onChange={(e) => setForm({ ...form, hospitalId: e.target.value })} placeholder="HOS-DL-013" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">District</label>
            <Input required value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Type</label>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Hospital['type'] })}>
              <option>Government</option><option>Private</option><option>Trust</option>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Address</label>
            <Input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">AMR Score (0-100)</label>
            <Input required type="number" min={0} max={100} value={form.amrScore} onChange={(e) => setForm({ ...form, amrScore: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Patients</label>
            <Input required type="number" min={0} value={form.patients} onChange={(e) => setForm({ ...form, patients: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Broad-spectrum use (%)</label>
            <Input required type="number" min={0} max={100} value={form.broadSpectrumPct} onChange={(e) => setForm({ ...form, broadSpectrumPct: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Lab Confirmation Rate (%)</label>
            <Input required type="number" min={0} max={100} value={form.labConfirmationRate} onChange={(e) => setForm({ ...form, labConfirmationRate: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Bed Count</label>
            <Input required type="number" min={0} value={form.bedCount} onChange={(e) => setForm({ ...form, bedCount: Number(e.target.value) })} />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Add hospital'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete hospital" size="sm">
        <p className="text-sm text-[var(--color-text-muted)] mb-5">
          This will permanently remove <span className="text-[var(--color-text-primary)] font-medium">{deleteTarget?.name}</span> and all associated patient records. This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}