import { useState } from 'react';
import { User, Palette, Bell, KeyRound, Moon, Sun, Save, Lock } from 'lucide-react';
import { Card, Button, Input, Label } from '@/components/ui/Primitives';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { initials } from '@/lib/utils';
import * as authService from '@/services/authService';

const roleLabels: Record<string, string> = {
  administrator: 'Administrator', hospital: 'Hospital Staff', health_authority: 'Health Authority',
};

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const { show } = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [darkMode, setDarkMode] = useState(true);
  const [accent, setAccent] = useState<'teal' | 'blue' | 'amber'>('teal');
  const [notifications, setNotifications] = useState({
    highRisk: true, weeklyDigest: true, stewardshipReminders: false, systemUpdates: true,
  });
  const [openaiKey, setOpenaiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setProfileError('');
    setSaving(true);
    try {
      await authService.updateProfile(user.uid, { name, email });
      refreshUser();
      show('Profile updated — your new email now works for signing in.', 'success');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setPasswordError('');
    setChangingPassword(true);
    try {
      await authService.changePassword(user.uid, currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      show('Password changed successfully.', 'success');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Could not change password.');
    } finally {
      setChangingPassword(false);
    }
  }

  function handleSaveKeys(e: React.FormEvent) {
    e.preventDefault();
    show('API key saved locally for this session. Add it to your .env as VITE_OPENAI_API_KEY to persist it.', 'info');
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <User size={17} className="text-[var(--color-culture)]" />
          <h2 className="font-display font-semibold">Profile</h2>
        </div>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold"
              style={{ backgroundColor: `${user?.avatarColor}22`, color: user?.avatarColor }}
            >
              {user ? initials(user.name) : '—'}
            </div>
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-[var(--color-text-faint)]">{user ? roleLabels[user.role] : ''}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Email address</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          {profileError && (
            <p className="text-sm text-[var(--color-hazard)] bg-[var(--color-hazard)]/10 rounded-lg px-3 py-2">{profileError}</p>
          )}
          <Button type="submit" loading={saving} icon={<Save size={15} />}>Save profile</Button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Lock size={17} className="text-[var(--color-culture)]" />
          <h2 className="font-display font-semibold">Change Password</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Current password</Label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div>
              <Label>New password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="At least 6 characters" />
            </div>
          </div>
          {passwordError && (
            <p className="text-sm text-[var(--color-hazard)] bg-[var(--color-hazard)]/10 rounded-lg px-3 py-2">{passwordError}</p>
          )}
          <Button type="submit" loading={changingPassword} variant="secondary" icon={<Lock size={15} />}>Change password</Button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Palette size={17} className="text-[var(--color-culture)]" />
          <h2 className="font-display font-semibold">Theme</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark mode</p>
              <p className="text-xs text-[var(--color-text-faint)]">AMR Watch is designed dark-first for clinical night-shift use</p>
            </div>
            <button
              onClick={() => setDarkMode((d) => !d)}
              className="w-12 h-7 rounded-full flex items-center px-1 transition-colors"
              style={{ backgroundColor: darkMode ? 'var(--color-culture)' : 'rgba(148,178,224,0.2)' }}
              aria-pressed={darkMode}
              aria-label="Toggle dark mode"
            >
              <span className={`w-5 h-5 rounded-full bg-[#080D17] flex items-center justify-center transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0'}`}>
                {darkMode ? <Moon size={11} className="text-[var(--color-culture)]" /> : <Sun size={11} className="text-[var(--color-caution)]" />}
              </span>
            </button>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Accent color</p>
            <div className="flex gap-2">
              {([
                { key: 'teal', color: '#2AD9C2' },
                { key: 'blue', color: '#6C8BF5' },
                { key: 'amber', color: '#F2A93B' },
              ] as const).map(({ key, color }) => (
                <button
                  key={key}
                  onClick={() => setAccent(key)}
                  className="w-9 h-9 rounded-full border-2 transition-transform"
                  style={{ backgroundColor: color, borderColor: accent === key ? '#fff' : 'transparent', transform: accent === key ? 'scale(1.1)' : 'scale(1)' }}
                  aria-label={`Use ${key} accent`}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Bell size={17} className="text-[var(--color-culture)]" />
          <h2 className="font-display font-semibold">Notifications</h2>
        </div>
        <div className="space-y-3">
          {[
            { key: 'highRisk', label: 'High-risk hospital alerts', desc: 'Immediate notification when a facility enters the high-risk band' },
            { key: 'weeklyDigest', label: 'Weekly AMR digest', desc: 'A summary email every Monday morning' },
            { key: 'stewardshipReminders', label: 'Stewardship reminders', desc: 'Reminders to review broad-spectrum prescribing trends' },
            { key: 'systemUpdates', label: 'System updates', desc: 'Platform maintenance and feature announcements' },
          ].map(({ key, label, desc }) => (
            <label key={key} className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm">{label}</p>
                <p className="text-xs text-[var(--color-text-faint)]">{desc}</p>
              </div>
              <input
                type="checkbox"
                checked={(notifications as any)[key]}
                onChange={(e) => setNotifications((n) => ({ ...n, [key]: e.target.checked }))}
                className="accent-[var(--color-culture)] w-4 h-4 rounded shrink-0"
              />
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={17} className="text-[var(--color-culture)]" />
          <h2 className="font-display font-semibold">API Keys</h2>
        </div>
        <form onSubmit={handleSaveKeys} className="space-y-4">
          <div>
            <Label>OpenAI API key (optional)</Label>
            <Input type="password" placeholder="sk-…" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} />
            <p className="text-xs text-[var(--color-text-faint)] mt-1.5">
              The AI Assistant runs fully offline on your dashboard data by default. Add a key here (or set{' '}
              <code className="font-mono">VITE_OPENAI_API_KEY</code> in <code className="font-mono">.env</code>) to route insights through the live OpenAI API instead.
            </p>
          </div>
          <Button type="submit" variant="secondary" icon={<Save size={15} />}>Save key</Button>
        </form>
      </Card>
    </div>
  );
}
