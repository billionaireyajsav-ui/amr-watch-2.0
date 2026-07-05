import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, User, Building2, MapPin, ArrowRight } from 'lucide-react';
import { Card, Input, EmptyState, Skeleton } from '@/components/ui/Primitives';
import * as dataService from '@/services/dataService';
import type { Patient } from '@/types';
import { formatDate } from '@/lib/utils';

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const p = await dataService.listPatients();
      setPatients(p);
      setLoading(false);
    })();
  }, []);

  const results = query.trim()
    ? patients.filter((p) =>
        `${p.name} ${p.patientNumber} ${p.hospitalName} ${p.district}`.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 25)
    : [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center pt-4">
        <h2 className="font-display text-2xl font-bold mb-2">Smart Search</h2>
        <p className="text-sm text-[var(--color-text-muted)]">Search by patient name, patient number, hospital, or district</p>
      </div>

      <div className="relative">
        <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try “Meera Sharma”, “PT-2026-00012”, “AIIMS”, or “Gurugram”…"
          className="pl-12 py-3.5 text-base"
        />
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : query.trim() === '' ? (
        <Card>
          <EmptyState icon={<SearchIcon size={28} />} title="Start typing to search" description="Results update instantly as you type. Selecting a result opens its full patient report." />
        </Card>
      ) : results.length === 0 ? (
        <Card>
          <EmptyState title="No matching records" description={`Nothing matched "${query}". Try a different name, patient number, hospital, or district.`} />
        </Card>
      ) : (
        <div className="space-y-2">
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/patients/${p.id}/report`)}
              className="w-full text-left glass rounded-xl px-4 py-3.5 flex items-center gap-4 hover:border-[var(--color-culture)]/40 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--color-culture)]/12 flex items-center justify-center text-[var(--color-culture)] shrink-0">
                <User size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{p.name} <span className="text-xs text-[var(--color-text-faint)] font-mono ml-1">{p.patientNumber}</span></p>
                <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mt-0.5">
                  <span className="flex items-center gap-1"><Building2 size={11} /> {p.hospitalName}</span>
                  <span className="flex items-center gap-1"><MapPin size={11} /> {p.district}</span>
                  <span>{formatDate(p.date)}</span>
                </div>
              </div>
              <ArrowRight size={16} className="text-[var(--color-text-faint)] group-hover:text-[var(--color-culture)] group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
