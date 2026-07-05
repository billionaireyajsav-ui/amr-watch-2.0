import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, Pill, FlaskConical, ShieldAlert, BellRing, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import { Card, Skeleton, EmptyState } from '@/components/ui/Primitives';
import { ResistancePulse } from '@/components/ui/ResistancePulse';
import { Badge } from '@/components/ui/Primitives';
import * as dataService from '@/services/dataService';
import type { Hospital, AlertItem } from '@/types';
import { riskColor, riskLabel, severityColor } from '@/lib/utils';
import { Link } from 'react-router-dom';

function StatCard({ icon: Icon, label, value, accent, delay }: { icon: any; label: string; value: string | number; accent: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }}>
      <Card className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}1f`, color: accent }}>
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-display font-bold leading-tight tabular-nums">{value}</p>
          <p className="text-xs text-[var(--color-text-muted)] truncate">{label}</p>
        </div>
      </Card>
    </motion.div>
  );
}

const DISTRICT_COLORS = ['#2AD9C2', '#F2A93B', '#F0475A'];

export default function Dashboard() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof dataService.getDashboardStats>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [h, a, s] = await Promise.all([
        dataService.listHospitals(),
        dataService.listAlerts(),
        dataService.getDashboardStats(),
      ]);
      setHospitals(h);
      setAlerts(a.filter((x) => !x.acknowledged).slice(0, 5));
      setStats(s);
      setLoading(false);
    })();
  }, []);

  const trendData = useMemo(() => {
    if (hospitals.length === 0) return [];
    const months = hospitals[0].monthlyTrend.map((m) => m.month);
    return months.map((month, idx) => {
      const avgScore = Math.round(hospitals.reduce((s, h) => s + h.monthlyTrend[idx].amrScore, 0) / hospitals.length);
      const avgBroad = Math.round(hospitals.reduce((s, h) => s + h.monthlyTrend[idx].broad, 0) / hospitals.length);
      const avgNarrow = 100 - avgBroad;
      return { month, amrScore: avgScore, broad: avgBroad, narrow: avgNarrow };
    });
  }, [hospitals]);

  const usageSplit = stats ? [
    { name: 'Broad-spectrum', value: stats.avgBroad, color: '#F0475A' },
    { name: 'Narrow-spectrum', value: stats.avgNarrow, color: '#2AD9C2' },
  ] : [];

  const highRiskHospitals = hospitals.filter((h) => h.riskLevel === 'high').sort((a, b) => b.amrScore - a.amrScore);

  const districtHeat = useMemo(() => {
    const map = new Map<string, number[]>();
    hospitals.forEach((h) => {
      if (!map.has(h.district)) map.set(h.district, []);
      map.get(h.district)!.push(h.amrScore);
    });
    return Array.from(map.entries()).map(([district, scores]) => ({
      district,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));
  }, [hospitals]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Total Hospitals" value={stats!.totalHospitals} accent="var(--color-info)" delay={0} />
        <StatCard icon={Users} label="Total Patients" value={stats!.totalPatients.toLocaleString('en-IN')} accent="var(--color-culture)" delay={0.05} />
        <StatCard icon={ShieldAlert} label="High-risk Hospitals" value={stats!.highRisk} accent="var(--color-hazard)" delay={0.1} />
        <StatCard icon={BellRing} label="Active Alerts" value={stats!.activeAlerts} accent="var(--color-caution)" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold">Network AMR Score Trend</h3>
              <p className="text-xs text-[var(--color-text-muted)]">6-month average across all facilities</p>
            </div>
            <TrendingUp size={18} className="text-[var(--color-culture)]" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData} margin={{ left: -20, top: 6 }}>
              <defs>
                <linearGradient id="amrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2AD9C2" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#2AD9C2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,178,224,0.08)" vertical={false} />
              <XAxis dataKey="month" stroke="#5C6786" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#5C6786" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#0F1830', border: '1px solid rgba(148,178,224,0.2)', borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="amrScore" name="AMR Score" stroke="#2AD9C2" fill="url(#amrGrad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="flex flex-col items-center justify-center">
          <h3 className="font-display font-semibold self-start mb-1">Overall AMR Score</h3>
          <p className="text-xs text-[var(--color-text-muted)] self-start mb-4">Network average, live</p>
          <ResistancePulse score={stats!.avgAmr} risk={stats!.avgAmr >= 65 ? 'high' : stats!.avgAmr >= 40 ? 'moderate' : 'low'} size={140} label="AMR score" />
          <div className="flex gap-4 mt-6 w-full justify-center">
            <PieChart width={110} height={110}>
              <Pie data={usageSplit} dataKey="value" innerRadius={30} outerRadius={48} paddingAngle={3}>
                {usageSplit.map((entry) => <Cell key={entry.name} fill={entry.color} stroke="none" />)}
              </Pie>
            </PieChart>
            <div className="flex flex-col justify-center gap-2 text-xs">
              <div className="flex items-center gap-1.5"><Pill size={12} className="text-[var(--color-hazard)]" /> Broad: {stats!.avgBroad}%</div>
              <div className="flex items-center gap-1.5"><FlaskConical size={12} className="text-[var(--color-culture)]" /> Narrow: {stats!.avgNarrow}%</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="font-display font-semibold mb-1">District Risk Heatmap</h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">Average AMR score by district</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {districtHeat.map((d) => {
              const risk = d.avg >= 65 ? 'high' : d.avg >= 40 ? 'moderate' : 'low';
              return (
                <div
                  key={d.district}
                  className="rounded-xl p-3 border"
                  style={{ backgroundColor: `${riskColor[risk]}14`, borderColor: `${riskColor[risk]}30` }}
                >
                  <p className="text-xs text-[var(--color-text-muted)] truncate mb-1">{d.district}</p>
                  <p className="text-lg font-display font-bold" style={{ color: riskColor[risk] }}>{d.avg}</p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold">High-risk Hospitals</h3>
            <Link to="/hospitals" className="text-xs text-[var(--color-culture)] hover:underline">View all</Link>
          </div>
          {highRiskHospitals.length === 0 ? (
            <EmptyState title="No high-risk facilities" description="All hospitals are currently within acceptable AMR thresholds." />
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {highRiskHospitals.map((h) => (
                <Link key={h.id} to={`/hospitals/${h.id}`} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 hover:bg-white/[0.04] transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{h.name}</p>
                    <p className="text-xs text-[var(--color-text-faint)]">{h.district}</p>
                  </div>
                  <Badge color={riskColor.high}>{h.amrScore}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold">Recent Active Alerts</h3>
          <Link to="/alerts" className="text-xs text-[var(--color-culture)] hover:underline">View all</Link>
        </div>
        {alerts.length === 0 ? (
          <EmptyState icon={<BellRing size={28} />} title="No active alerts" description="All monitored facilities are within stewardship thresholds." />
        ) : (
          <div className="space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-white/[0.03]">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: severityColor[a.severity] }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{a.message}</p>
                  <p className="text-xs text-[var(--color-text-faint)]">{a.hospitalName} · {a.type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
