import { useState } from 'react';
import { Menu, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { initials } from '@/lib/utils';

const roleLabels: Record<string, string> = {
  administrator: 'Administrator',
  hospital: 'Hospital Staff',
  health_authority: 'Health Authority',
};

export function Topbar({ title, onMenuClick }: { title: string; onMenuClick: () => void }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleSignOut() {
    signOut();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-30 glass border-b border-[var(--color-border)] px-4 sm:px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-1.5 rounded-lg hover:bg-white/5"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-display text-lg sm:text-xl font-semibold truncate">{title}</h1>
      </div>

      {user && (
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-white/[0.05] transition-colors"
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
              style={{ backgroundColor: `${user.avatarColor}22`, color: user.avatarColor }}
            >
              {initials(user.name)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium leading-tight">{user.name}</p>
              <p className="text-[11px] text-[var(--color-text-faint)] leading-tight">{roleLabels[user.role]}</p>
            </div>
            <ChevronDown size={14} className="text-[var(--color-text-faint)] hidden sm:block" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-52 glass-strong rounded-xl shadow-2xl z-20 py-1.5">
                <div className="px-3.5 py-2 border-b border-[var(--color-border)]">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-[var(--color-text-faint)] truncate">{user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-[var(--color-hazard)] hover:bg-[var(--color-hazard)]/10 transition-colors"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
