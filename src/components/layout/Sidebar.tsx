import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, Search, Map, Sparkles, BellRing, FileBarChart, Settings, Activity,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['administrator', 'hospital', 'health_authority'] },
  { to: '/hospitals', label: 'Hospitals', icon: Building2, roles: ['administrator', 'health_authority'] },
  { to: '/patients', label: 'Patient Records', icon: Users, roles: ['administrator', 'hospital'] },
  { to: '/search', label: 'Smart Search', icon: Search, roles: ['administrator', 'hospital', 'health_authority'] },
  { to: '/map', label: 'City Map', icon: Map, roles: ['administrator', 'hospital', 'health_authority'] },
  { to: '/ai-assistant', label: 'AI Assistant', icon: Sparkles, roles: ['administrator', 'hospital', 'health_authority'] },
  { to: '/alerts', label: 'Alerts', icon: BellRing, roles: ['administrator', 'hospital', 'health_authority'] },
  { to: '/reports', label: 'Reports', icon: FileBarChart, roles: ['administrator', 'hospital', 'health_authority'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['administrator', 'hospital', 'health_authority'] },
];

export function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const { user } = useAuth();
  const visible = navItems.filter((item) => !user || item.roles.includes(user.role));

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onCloseMobile} aria-hidden="true" />
      )}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen w-64 shrink-0 z-50 lg:z-0 flex flex-col glass-strong lg:glass border-r border-[var(--color-border)] transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[var(--color-border)]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-culture)] to-[var(--color-info)] flex items-center justify-center shrink-0">
            <Activity size={18} className="text-[#06120F]" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="font-display font-semibold text-sm leading-tight truncate">AMR Watch</p>
            <p className="text-[10px] text-[var(--color-text-faint)] truncate">Delhi NCR Surveillance</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visible.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--color-culture)]/12 text-[var(--color-culture)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/[0.04]'
                )
              }
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-[var(--color-border)]">
          <p className="text-[10px] text-[var(--color-text-faint)] leading-relaxed">
            World Microbiome Day Hackathon — ASM · IIT Delhi
          </p>
        </div>
      </aside>
    </>
  );
}
