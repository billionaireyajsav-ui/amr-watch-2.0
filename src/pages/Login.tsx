import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Mail, Lock, Eye, EyeOff, ShieldCheck, Building2, Landmark, ArrowRight, KeyRound, User, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button, Input, Label, Select } from '@/components/ui/Primitives';
import * as authService from '@/services/authService';
import * as dataService from '@/services/dataService';
import type { Role, Hospital } from '@/types';

const roleOptions: { role: Role; label: string; icon: typeof ShieldCheck; desc: string }[] = [
  { role: 'administrator', label: 'Administrator', icon: ShieldCheck, desc: 'Full network access' },
  { role: 'hospital', label: 'Hospital', icon: Building2, desc: 'Manage your patients' },
  { role: 'health_authority', label: 'Health Authority', icon: Landmark, desc: 'Read-only analytics' },
];

type Mode = 'signin' | 'signup' | 'forgot';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from ?? '/dashboard';

  const [mode, setMode] = useState<Mode>('signin');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  // sign in state
  const [selectedRole, setSelectedRole] = useState<Role>('administrator');
  const [email, setEmail] = useState('admin@amrwatch.in');
  const [password, setPassword] = useState('Admin@123');

  // sign up state
  const [suName, setSuName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suRole, setSuRole] = useState<Role>('administrator');
  const [suHospitalId, setSuHospitalId] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    dataService.listHospitals().then((h) => {
      setHospitals(h);
      setSuHospitalId(h[0]?.id ?? '');
    });
  }, []);

  function selectRole(role: Role) {
    setSelectedRole(role);
    const account = authService.getDemoCredentials().find((a) => a.role === role);
    if (account) {
      setEmail(account.email);
      setPassword(account.password);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password, remember);
      show('Signed in successfully.', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp(suName, suEmail, suPassword, suRole, suRole === 'hospital' ? suHospitalId : undefined);
      show('Account created — you\'re signed in.', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.sendPasswordReset(resetEmail);
      setResetSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      {/* ambient culture-plate motif */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-[var(--color-culture)]/10"
            style={{ width: 380 + i * 220, height: 380 + i * 220, left: `${10 + i * 8}%`, top: `${-8 + i * 6}%` }}
            animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 6 + i, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-culture)] to-[var(--color-info)] flex items-center justify-center mb-4 shadow-[0_8px_32px_-4px_rgba(42,217,194,0.5)]">
            <Activity size={26} className="text-[#06120F]" strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-2xl font-bold">AMR Watch</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1 text-center">
            Antimicrobial Resistance Monitoring Network — Delhi NCR
          </p>
        </div>

        <div className="glass-strong rounded-2xl p-6 sm:p-7 shadow-2xl">
          {mode !== 'forgot' && (
            <div className="flex rounded-xl bg-white/[0.04] p-1 mb-6">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${mode === 'signin' ? 'bg-[var(--color-culture)] text-[#06120F]' : 'text-[var(--color-text-muted)]'}`}
              >
                <User size={14} /> Sign in
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${mode === 'signup' ? 'bg-[var(--color-culture)] text-[#06120F]' : 'text-[var(--color-text-muted)]'}`}
              >
                <UserPlus size={14} /> Create account
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {mode === 'signin' && (
              <motion.div key="login" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.2 }}>
                <p className="text-xs font-medium text-[var(--color-text-muted)] mb-3">Sign in as</p>
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {roleOptions.map(({ role, label, icon: Icon }) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => selectRole(role)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl py-3 px-1.5 border transition-all ${
                        selectedRole === role
                          ? 'border-[var(--color-culture)] bg-[var(--color-culture)]/10 text-[var(--color-culture)]'
                          : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)]'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-[11px] font-medium text-center leading-tight">{label}</span>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email address</Label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label htmlFor="password" className="mb-0">Password</Label>
                      <button type="button" onClick={() => switchMode('forgot')} className="text-xs text-[var(--color-culture)] hover:underline">
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] hover:text-[var(--color-text-primary)]"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] cursor-pointer">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-[var(--color-culture)] w-4 h-4 rounded" />
                    Remember me
                  </label>

                  {error && (
                    <p className="text-sm text-[var(--color-hazard)] bg-[var(--color-hazard)]/10 rounded-lg px-3 py-2">{error}</p>
                  )}

                  <Button type="submit" loading={loading} className="w-full" icon={<ArrowRight size={16} />}>
                    Sign in
                  </Button>
                </form>

                <p className="text-[11px] text-[var(--color-text-faint)] mt-5 text-center leading-relaxed">
                  Demo credentials are pre-filled per role, or switch to "Create account" to register your own login.
                </p>
              </motion.div>
            )}

            {mode === 'signup' && (
              <motion.div key="signup" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="su-name">Full name</Label>
                    <Input id="su-name" value={suName} onChange={(e) => setSuName(e.target.value)} required placeholder="Dr. Jane Doe" />
                  </div>
                  <div>
                    <Label htmlFor="su-email">Email address</Label>
                    <Input id="su-email" type="email" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} required placeholder="you@example.com" />
                  </div>
                  <div>
                    <Label htmlFor="su-password">Password</Label>
                    <Input id="su-password" type="password" value={suPassword} onChange={(e) => setSuPassword(e.target.value)} required placeholder="At least 6 characters" />
                  </div>
                  <div>
                    <Label htmlFor="su-role">Role</Label>
                    <Select id="su-role" value={suRole} onChange={(e) => setSuRole(e.target.value as Role)}>
                      <option value="administrator">Administrator — full access</option>
                      <option value="hospital">Hospital — manage your own patients</option>
                      <option value="health_authority">Health Authority — read-only analytics</option>
                    </Select>
                  </div>
                  {suRole === 'hospital' && (
                    <div>
                      <Label htmlFor="su-hospital">Your hospital</Label>
                      <Select id="su-hospital" value={suHospitalId} onChange={(e) => setSuHospitalId(e.target.value)}>
                        {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </Select>
                    </div>
                  )}

                  {error && (
                    <p className="text-sm text-[var(--color-hazard)] bg-[var(--color-hazard)]/10 rounded-lg px-3 py-2">{error}</p>
                  )}

                  <Button type="submit" loading={loading} className="w-full" icon={<UserPlus size={16} />}>
                    Create account
                  </Button>
                </form>
                <p className="text-[11px] text-[var(--color-text-faint)] mt-5 text-center leading-relaxed">
                  Your account is stored locally in this browser — no backend required. You'll be signed in immediately.
                </p>
              </motion.div>
            )}

            {mode === 'forgot' && (
              <motion.div key="forgot" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
                {!resetSent ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <KeyRound size={18} className="text-[var(--color-culture)]" />
                      <h2 className="font-display font-semibold">Reset your password</h2>
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)] mb-5">Enter your account email and we'll send a reset link.</p>
                    <form onSubmit={handleReset} className="space-y-4">
                      <div>
                        <Label htmlFor="reset-email">Email address</Label>
                        <Input id="reset-email" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
                      </div>
                      {error && <p className="text-sm text-[var(--color-hazard)] bg-[var(--color-hazard)]/10 rounded-lg px-3 py-2">{error}</p>}
                      <div className="flex gap-2">
                        <Button type="button" variant="secondary" onClick={() => switchMode('signin')} className="flex-1">
                          Back
                        </Button>
                        <Button type="submit" loading={loading} className="flex-1">
                          Send link
                        </Button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <ShieldCheck size={32} className="text-[var(--color-culture)] mx-auto mb-3" />
                    <h2 className="font-display font-semibold mb-1">Check your inbox</h2>
                    <p className="text-sm text-[var(--color-text-muted)] mb-5">
                      If an account exists for {resetEmail}, a reset link is on its way.
                    </p>
                    <Button variant="secondary" onClick={() => { switchMode('signin'); setResetSent(false); }} className="w-full">
                      Back to sign in
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
