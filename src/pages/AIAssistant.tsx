import { useEffect, useState } from 'react';
import { Sparkles, ShieldQuestion, ClipboardCheck, TrendingUp, FlaskConical, Globe2, Loader2, Info } from 'lucide-react';
import { Card, Select, Button, EmptyState, Skeleton } from '@/components/ui/Primitives';
import * as dataService from '@/services/dataService';
import * as aiService from '@/services/aiService';
import type { Hospital, Patient, AIInsight } from '@/types';

const kinds = [
  { key: 'risk_explanation', label: 'AMR Risk Explanation', icon: ShieldQuestion, needsHospital: true },
  { key: 'recommendation', label: 'Hospital Recommendations', icon: ClipboardCheck, needsHospital: true },
  { key: 'stewardship', label: 'Antibiotic Stewardship Suggestions', icon: FlaskConical, needsHospital: true },
  { key: 'trend_summary', label: 'Trend Summary', icon: TrendingUp, needsHospital: true },
  { key: 'public_health', label: 'Public Health Recommendations', icon: Globe2, needsHospital: false },
] as const;

export default function AIAssistant() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [activeKind, setActiveKind] = useState<typeof kinds[number]['key']>('risk_explanation');
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState<AIInsight[]>([]);

  useEffect(() => {
    (async () => {
      const [h, p] = await Promise.all([dataService.listHospitals(), dataService.listPatients()]);
      setHospitals(h);
      setPatients(p);
      setSelectedHospitalId(h[0]?.id ?? '');
      setLoading(false);
    })();
  }, []);

  const activeMeta = kinds.find((k) => k.key === activeKind)!;
  const hospital = hospitals.find((h) => h.id === selectedHospitalId);

  async function handleGenerate() {
    setGenerating(true);
    let insight: AIInsight;
    switch (activeKind) {
      case 'risk_explanation':
        insight = await aiService.generateRiskExplanation(hospital!);
        break;
      case 'recommendation':
        insight = await aiService.generateRecommendation(hospital!);
        break;
      case 'stewardship':
        insight = await aiService.generateStewardshipInsight(hospital!, patients);
        break;
      case 'trend_summary':
        insight = await aiService.generateTrendSummary(hospital!);
        break;
      case 'public_health':
        insight = await aiService.generatePublicHealthInsight(hospitals);
        break;
    }
    setHistory((h) => [insight, ...h]);
    setGenerating(false);
  }

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[var(--color-culture)]/10 to-transparent">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-[var(--color-culture)]" />
          <h2 className="font-display text-lg font-semibold">AMR AI Assistant</h2>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
          Generates stewardship insights strictly from your dashboard's own data — never invented facts.
          Every response below is clearly labelled as data-derived.
        </p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <Card className="space-y-4 h-fit">
          <div>
            <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">Insight type</p>
            <div className="space-y-1.5">
              {kinds.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveKind(key)}
                  className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-left transition-colors ${
                    activeKind === key ? 'bg-[var(--color-culture)]/12 text-[var(--color-culture)]' : 'text-[var(--color-text-muted)] hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
          </div>

          {activeMeta.needsHospital && (
            <div>
              <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Hospital</p>
              <Select value={selectedHospitalId} onChange={(e) => setSelectedHospitalId(e.target.value)}>
                {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </Select>
            </div>
          )}

          <Button className="w-full" onClick={handleGenerate} loading={generating} icon={<Sparkles size={16} />}>
            Generate insight
          </Button>
        </Card>

        <div className="space-y-4">
          {history.length === 0 && !generating ? (
            <Card>
              <EmptyState icon={<Sparkles size={28} />} title="No insights generated yet" description="Pick an insight type and hospital, then generate your first AI insight." />
            </Card>
          ) : (
            <>
              {generating && (
                <Card className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                  <Loader2 size={16} className="animate-spin text-[var(--color-culture)]" /> Analyzing dashboard data…
                </Card>
              )}
              {history.map((insight) => (
                <Card key={insight.id}>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <h3 className="font-display font-semibold text-sm">{insight.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-line text-[var(--color-text-primary)]">{insight.content}</p>
                  {insight.basedOnData && (
                    <div className="flex items-center gap-1.5 mt-3 text-[11px] text-[var(--color-culture)]">
                      <Info size={12} /> Based on your uploaded dashboard data
                    </div>
                  )}
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
