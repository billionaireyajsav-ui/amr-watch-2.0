import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Skeleton, Badge, Button } from '@/components/ui/Primitives';
import * as dataService from '@/services/dataService';
import type { Hospital } from '@/types';
import { riskColor, riskLabel } from '@/lib/utils';

const VIEW_W = 640;
const VIEW_H = 460;

export default function CityMap() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<Hospital | null>(null);

  useEffect(() => {
    (async () => {
      const h = await dataService.listHospitals();
      setHospitals(h);
      setLoading(false);
    })();
  }, []);

  const { points, bounds } = useMemo(() => {
    if (hospitals.length === 0) return { points: [], bounds: null };
    const lats = hospitals.map((h) => h.lat);
    const lngs = hospitals.map((h) => h.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const pad = 60;
    const pts = hospitals.map((h) => {
      const x = pad + ((h.lng - minLng) / (maxLng - minLng || 1)) * (VIEW_W - pad * 2);
      const y = VIEW_H - pad - ((h.lat - minLat) / (maxLat - minLat || 1)) * (VIEW_H - pad * 2);
      return { hospital: h, x, y };
    });
    return { points: pts, bounds: { minLat, maxLat, minLng, maxLng } };
  }, [hospitals]);

  if (loading) return <Skeleton className="h-[500px]" />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold">Delhi NCR Facility Map</h3>
          <div className="flex items-center gap-3 text-xs">
            {(['low', 'moderate', 'high'] as const).map((r) => (
              <span key={r} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: riskColor[r] }} />
                {riskLabel[r]}
              </span>
            ))}
          </div>
        </div>
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-[440px] rounded-xl">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148,178,224,0.06)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={VIEW_W} height={VIEW_H} fill="url(#grid)" rx="16" />
          {/* stylised river motif to anchor the map to Delhi's geography (Yamuna) */}
          <path
            d={`M ${VIEW_W * 0.62} 0 C ${VIEW_W * 0.7} ${VIEW_H * 0.3}, ${VIEW_W * 0.55} ${VIEW_H * 0.6}, ${VIEW_W * 0.66} ${VIEW_H}`}
            fill="none"
            stroke="rgba(108,139,245,0.15)"
            strokeWidth="18"
            strokeLinecap="round"
          />
          {points.map(({ hospital, x, y }) => (
            <g
              key={hospital.id}
              transform={`translate(${x}, ${y})`}
              className="cursor-pointer"
              onMouseEnter={() => setHovered(hospital)}
              onMouseLeave={() => setHovered((h) => (h?.id === hospital.id ? null : h))}
              onClick={() => navigate(`/hospitals/${hospital.id}`)}
            >
              <circle r="14" fill={riskColor[hospital.riskLevel]} opacity="0.18">
                <animate attributeName="r" values="14;18;14" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.18;0;0.18" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <circle r="7" fill={riskColor[hospital.riskLevel]} stroke="#080D17" strokeWidth="2" />
            </g>
          ))}
        </svg>
        {hovered && (
          <div className="absolute bottom-6 left-6 right-6 sm:right-auto sm:w-72 glass-strong rounded-xl p-4 pointer-events-none">
            <p className="font-medium text-sm">{hovered.name}</p>
            <p className="text-xs text-[var(--color-text-faint)] mb-2">{hovered.district}</p>
            <div className="flex items-center gap-2">
              <Badge color={riskColor[hovered.riskLevel]}>{riskLabel[hovered.riskLevel]}</Badge>
              <span className="text-xs text-[var(--color-text-muted)]">AMR {hovered.amrScore}</span>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="font-display font-semibold mb-3">Facilities</h3>
        <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-1">
          {hospitals
            .slice()
            .sort((a, b) => b.amrScore - a.amrScore)
            .map((h) => (
              <button
                key={h.id}
                onClick={() => navigate(`/hospitals/${h.id}`)}
                onMouseEnter={() => setHovered(h)}
                className="w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 hover:bg-white/[0.04] text-left transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{h.name}</p>
                  <p className="text-xs text-[var(--color-text-faint)]">{h.district}</p>
                </div>
                <Badge color={riskColor[h.riskLevel]}>{h.amrScore}</Badge>
              </button>
            ))}
        </div>
      </Card>
    </div>
  );
}
