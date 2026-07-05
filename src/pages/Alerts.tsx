import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, CheckCircle2, Filter } from 'lucide-react';
import { Card, Badge, Button, Select, EmptyState, Skeleton } from '@/components/ui/Primitives';
import * as dataService from '@/services/dataService';
import type { AlertItem, AlertSeverity, AlertType } from '@/types';
import { severityColor, formatDateTime } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

const severityLabel: Record<AlertSeverity, string> = { info: 'Info', warning: 'Warning', critical: 'Critical' };

export default function Alerts() {
  const { show } = useToast();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<'all' | AlertSeverity>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | AlertType>('all');
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  async function load() {
    setLoading(true);
    const a = await dataService.listAlerts();
    setAlerts(a);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAck(id: string) {
    await dataService.acknowledgeAlert(id);
    show('Alert acknowledged.', 'success');
    await load();
  }

  const filtered = alerts.filter((a) => {
    if (!showAcknowledged && a.acknowledged) return false;
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    return true;
  });

  const alertTypes: AlertType[] = ['Excessive broad-spectrum use', 'Declining AMR score', 'High-risk hospital', 'Missing lab confirmation'];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as any)} className="sm:w-40">
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </Select>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="sm:w-64">
            <option value="all">All alert types</option>
            {alertTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] cursor-pointer">
          <input type="checkbox" checked={showAcknowledged} onChange={(e) => setShowAcknowledged(e.target.checked)} className="accent-[var(--color-culture)] w-4 h-4 rounded" />
          Show acknowledged
        </label>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<BellRing size={28} />} title="No alerts to show" description="Nothing matches your current filters, or every alert has been acknowledged." />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <Card key={a.id} className={a.acknowledged ? 'opacity-60' : ''}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: severityColor[a.severity] }} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge color={severityColor[a.severity]}>{severityLabel[a.severity]}</Badge>
                      <span className="text-xs text-[var(--color-text-faint)]">{a.type}</span>
                    </div>
                    <p className="text-sm">{a.message}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-[var(--color-text-faint)]">
                      <Link to={`/hospitals/${a.hospitalId}`} className="hover:text-[var(--color-culture)] hover:underline">{a.hospitalName}</Link>
                      <span>·</span>
                      <span>{formatDateTime(a.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {!a.acknowledged && (
                  <Button variant="secondary" onClick={() => handleAck(a.id)} icon={<CheckCircle2 size={14} />} className="shrink-0">
                    Acknowledge
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
