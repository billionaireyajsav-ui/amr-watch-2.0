import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, Users, X } from 'lucide-react';
import { Card, Button, Input, Select, Badge, EmptyState, Skeleton, Label } from '@/components/ui/Primitives';
import { Modal } from '@/components/ui/Modal';
import * as dataService from '@/services/dataService';
import type { Patient, Hospital, AntibioticType, RecoveryStatus } from '@/types';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const PAGE_SIZE = 8;

const recoveryColor: Record<RecoveryStatus, string> = {
  Recovered: 'var(--color-culture)',
  'Ongoing Treatment': 'var(--color-info)',
  Deteriorating: 'var(--color-hazard)',
  Referred: 'var(--color-caution)',
};

type FormState = Omit<Patient, 'id' | 'patientNumber' | 'hospitalName' | 'district'>;

function makeEmptyForm(hospitals: Hospital[], fixedHospitalId?: string): FormState {
  const h = hospitals.find((x) => x.id === fixedHospitalId) ?? hospitals[0];
  return {
    name: '', age: 30, gender: 'Male', hospitalId: h?.id ?? '', symptoms: [], initialAntibiotic: '',
    initialAntibioticType: 'Narrow-spectrum', labIdentifiedBacteria: null, finalAntibiotic: '',
    finalAntibioticType: 'Narrow-spectrum', treatmentChanged: false, recoveryStatus: 'Ongoing Treatment',
    date: new Date().toISOString().slice(0, 10), doctorNotes: '',
  };
}

export default function Patients() {
  const { user, hasAccess } = useAuth();
  const { show } = useToast();
  const isHospitalRole = hasAccess(['hospital']);
  const canCreate = hasAccess(['administrator', 'hospital']);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [recoveryFilter, setRecoveryFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState<FormState>(makeEmptyForm([]));
  const [symptomInput, setSymptomInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);

  async function load() {
    setLoading(true);
    const [p, h] = await Promise.all([dataService.listPatients(), dataService.listHospitals()]);
    setPatients(isHospitalRole && user?.hospitalId ? p.filter((x) => x.hospitalId === user.hospitalId) : p);
    setHospitals(h);
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const matchesQuery = `${p.name} ${p.patientNumber} ${p.hospitalName} ${p.district}`.toLowerCase().includes(query.toLowerCase());
      const matchesRecovery = recoveryFilter === 'all' || p.recoveryStatus === recoveryFilter;
      return matchesQuery && matchesRecovery;
    });
  }, [patients, query, recoveryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openAdd() {
    setEditing(null);
    setForm(makeEmptyForm(hospitals, isHospitalRole ? user?.hospitalId : undefined));
    setModalOpen(true);
  }

  function openEdit(p: Patient) {
    setEditing(p);
    const { id, patientNumber, hospitalName, district, ...rest } = p;
    setForm(rest);
    setModalOpen(true);
  }

  function addSymptom() {
    if (symptomInput.trim()) {
      setForm((f) => ({ ...f, symptoms: [...f.symptoms, symptomInput.trim()] }));
      setSymptomInput('');
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const hospital = hospitals.find((h) => h.id === form.hospitalId);
      const payload = { ...form, hospitalName: hospital?.name ?? '', district: hospital?.district ?? '' };
      if (editing) {
        await dataService.updatePatient(editing.id, payload);
        show('Patient record updated.', 'success');
      } else {
        await dataService.createPatient(payload);
        show('Patient record added.', 'success');
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
    await dataService.deletePatient(deleteTarget.id);
    show(`Record for ${deleteTarget.name} removed.`, 'success');
    setDeleteTarget(null);
    await load();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
            <Input placeholder="Search name, number, hospital…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} className="pl-10" />
          </div>
          <Select value={recoveryFilter} onChange={(e) => { setRecoveryFilter(e.target.value); setPage(1); }} className="sm:w-48">
            <option value="all">All recovery statuses</option>
            <option>Recovered</option><option>Ongoing Treatment</option><option>Deteriorating</option><option>Referred</option>
          </Select>
        </div>
        {canCreate && <Button onClick={openAdd} icon={<Plus size={16} />} className="shrink-0">Add Patient</Button>}
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Users size={28} />} title="No patient records found" description="Try a different search term or filter." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-faint)] uppercase tracking-wide">
                    <th className="px-5 py-3 font-medium">Patient</th>
                    <th className="px-5 py-3 font-medium">Hospital</th>
                    <th className="px-5 py-3 font-medium">Final Antibiotic</th>
                    <th className="px-5 py-3 font-medium">Recovery</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((p) => (
                    <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-[var(--color-text-faint)] font-mono">{p.patientNumber}</p>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--color-text-muted)]">{p.hospitalName}</td>
                      <td className="px-5 py-3.5">
                        <p>{p.finalAntibiotic}</p>
                        <p className="text-xs text-[var(--color-text-faint)]">{p.finalAntibioticType}</p>
                      </td>
                      <td className="px-5 py-3.5"><Badge color={recoveryColor[p.recoveryStatus]}>{p.recoveryStatus}</Badge></td>
                      <td className="px-5 py-3.5 text-[var(--color-text-muted)]">{formatDate(p.date)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/patients/${p.id}/report`} className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-culture)] hover:bg-white/5" aria-label={`View report for ${p.name}`}>
                            <Eye size={15} />
                          </Link>
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-info)] hover:bg-white/5" aria-label={`Edit ${p.name}`}>
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-hazard)] hover:bg-white/5" aria-label={`Delete ${p.name}`}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-faint)]">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
              <div className="flex items-center gap-1.5">
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-white/5"><ChevronLeft size={16} /></button>
                <span className="text-xs px-2">{page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-white/5"><ChevronRight size={16} /></button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Patient' : 'Add Patient'} size="lg">
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Full name</Label>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Hospital</Label>
            <Select value={form.hospitalId} disabled={isHospitalRole} onChange={(e) => setForm({ ...form, hospitalId: e.target.value })}>
              {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Age</Label>
            <Input required type="number" min={0} max={120} value={form.age} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Gender</Label>
            <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Patient['gender'] })}>
              <option>Male</option><option>Female</option><option>Other</option>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Symptoms</Label>
            <div className="flex gap-2 mb-2">
              <Input value={symptomInput} onChange={(e) => setSymptomInput(e.target.value)} placeholder="e.g. Fever" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSymptom(); } }} />
              <Button type="button" variant="secondary" onClick={addSymptom}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.symptoms.map((s, i) => (
                <Badge key={i} color="var(--color-info)">
                  {s}
                  <button type="button" onClick={() => setForm((f) => ({ ...f, symptoms: f.symptoms.filter((_, idx) => idx !== i) }))}><X size={11} /></button>
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <Label>Initial Antibiotic</Label>
            <Input required value={form.initialAntibiotic} onChange={(e) => setForm({ ...form, initialAntibiotic: e.target.value })} />
          </div>
          <div>
            <Label>Initial Antibiotic Type</Label>
            <Select value={form.initialAntibioticType} onChange={(e) => setForm({ ...form, initialAntibioticType: e.target.value as AntibioticType })}>
              <option>Narrow-spectrum</option><option>Broad-spectrum</option>
            </Select>
          </div>
          <div>
            <Label>Lab-identified Bacteria</Label>
            <Input value={form.labIdentifiedBacteria ?? ''} onChange={(e) => setForm({ ...form, labIdentifiedBacteria: e.target.value || null })} placeholder="Leave blank if not confirmed" />
          </div>
          <div>
            <Label>Final Antibiotic</Label>
            <Input required value={form.finalAntibiotic} onChange={(e) => setForm({ ...form, finalAntibiotic: e.target.value })} />
          </div>
          <div>
            <Label>Final Antibiotic Type</Label>
            <Select value={form.finalAntibioticType} onChange={(e) => setForm({ ...form, finalAntibioticType: e.target.value as AntibioticType })}>
              <option>Narrow-spectrum</option><option>Broad-spectrum</option>
            </Select>
          </div>
          <div>
            <Label>Recovery Status</Label>
            <Select value={form.recoveryStatus} onChange={(e) => setForm({ ...form, recoveryStatus: e.target.value as RecoveryStatus })}>
              <option>Recovered</option><option>Ongoing Treatment</option><option>Deteriorating</option><option>Referred</option>
            </Select>
          </div>
          <div>
            <Label>Admission Date</Label>
            <Input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] cursor-pointer">
            <input type="checkbox" checked={form.treatmentChanged} onChange={(e) => setForm({ ...form, treatmentChanged: e.target.checked })} className="accent-[var(--color-culture)] w-4 h-4 rounded" />
            Treatment was changed after lab results
          </label>
          <div className="sm:col-span-2">
            <Label>Doctor Notes</Label>
            <textarea
              className="w-full rounded-xl bg-white/[0.04] border border-[var(--color-border)] px-3.5 py-2.5 text-sm focus:border-[var(--color-culture)] focus:outline-none"
              rows={3}
              value={form.doctorNotes}
              onChange={(e) => setForm({ ...form, doctorNotes: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Add patient'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete patient record" size="sm">
        <p className="text-sm text-[var(--color-text-muted)] mb-5">
          This will permanently remove the record for <span className="text-[var(--color-text-primary)] font-medium">{deleteTarget?.name}</span>. This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
