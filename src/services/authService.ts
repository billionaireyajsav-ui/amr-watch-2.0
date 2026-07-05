import type { AppUser, Role } from '@/types';

// ---------------------------------------------------------------------------
// Mock auth service. Shaped to be swapped 1:1 with `firebase/auth` later
// (see services/README.md). Session persists in localStorage so refreshing
// the page keeps the user signed in, mirroring Firebase's default behaviour.
//
// Accounts are stored in localStorage under ACCOUNTS_KEY, seeded on first
// run with 3 demo accounts. Anyone can also create a brand new account from
// the "Create account" tab on the login screen — no code edits required.
// ---------------------------------------------------------------------------

const SESSION_KEY = 'amr.session.v1';
const ACCOUNTS_KEY = 'amr.accounts.v1';

interface StoredAccount {
  email: string;
  password: string;
  user: AppUser;
}

const seedAccounts: StoredAccount[] = [
  {
    email: 'admin@amrwatch.in',
    password: 'Admin@123',
    user: {
      uid: 'user_admin_1',
      name: 'Dr. Ananya Kulkarni',
      email: 'admin@amrwatch.in',
      role: 'administrator',
      avatarColor: '#2AD9C2',
    },
  },
  {
    email: 'hospital@amrwatch.in',
    password: 'Hospital@123',
    user: {
      uid: 'user_hospital_1',
      name: 'Dr. Rohit Malhotra',
      email: 'hospital@amrwatch.in',
      role: 'hospital',
      hospitalId: 'hosp_1',
      avatarColor: '#6C8BF5',
    },
  },
  {
    email: 'authority@amrwatch.in',
    password: 'Authority@123',
    user: {
      uid: 'user_authority_1',
      name: 'Ms. Kavita Bose',
      email: 'authority@amrwatch.in',
      role: 'health_authority',
      avatarColor: '#F2A93B',
    },
  },
];

const avatarPalette = ['#2AD9C2', '#6C8BF5', '#F2A93B', '#F0475A', '#8B5CF6', '#22C55E'];

function loadAccounts(): StoredAccount[] {
  const raw = localStorage.getItem(ACCOUNTS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as StoredAccount[];
    } catch {
      /* fall through to reseed */
    }
  }
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(seedAccounts));
  return seedAccounts;
}

function saveAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function delay<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function getDemoCredentials() {
  return seedAccounts.map((a) => ({ email: a.email, password: a.password, role: a.user.role }));
}

export async function signIn(email: string, password: string, remember: boolean): Promise<AppUser> {
  const accounts = loadAccounts();
  const account = accounts.find(
    (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
  );
  if (!account) {
    await delay(null, 600);
    throw new Error('Invalid email or password. Try one of the demo accounts below, or create a new account.');
  }
  await delay(null, 700);
  if (remember) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(account.user));
  } else {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(account.user));
  }
  return account.user;
}

export async function signUp(
  name: string,
  email: string,
  password: string,
  role: Role,
  hospitalId?: string
): Promise<AppUser> {
  await delay(null, 700);
  if (!name.trim()) throw new Error('Enter your full name.');
  if (!email.includes('@')) throw new Error('Enter a valid email address.');
  if (password.length < 6) throw new Error('Password must be at least 6 characters.');

  const accounts = loadAccounts();
  if (accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('An account with this email already exists. Try signing in instead.');
  }

  const user: AppUser = {
    uid: `user_${Date.now()}`,
    name: name.trim(),
    email,
    role,
    hospitalId: role === 'hospital' ? hospitalId : undefined,
    avatarColor: avatarPalette[accounts.length % avatarPalette.length],
  };

  accounts.push({ email, password, user });
  saveAccounts(accounts);
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export async function signInWithRole(role: Role): Promise<AppUser> {
  const accounts = loadAccounts();
  const account = accounts.find((a) => a.user.role === role)!;
  await delay(null, 500);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(account.user));
  return account.user;
}

export async function sendPasswordReset(email: string): Promise<void> {
  await delay(null, 700);
  if (!email.includes('@')) throw new Error('Enter a valid email address.');
  // In production this calls firebase `sendPasswordResetEmail(auth, email)`
  return;
}

export async function updateProfile(uid: string, patch: { name?: string; email?: string }): Promise<AppUser> {
  await delay(null, 500);
  const accounts = loadAccounts();
  const idx = accounts.findIndex((a) => a.user.uid === uid);
  if (idx === -1) throw new Error('Account not found.');

  if (patch.email && patch.email.toLowerCase() !== accounts[idx].email.toLowerCase()) {
    if (accounts.some((a, i) => i !== idx && a.email.toLowerCase() === patch.email!.toLowerCase())) {
      throw new Error('Another account already uses that email.');
    }
    accounts[idx].email = patch.email;
    accounts[idx].user.email = patch.email;
  }
  if (patch.name) {
    accounts[idx].user.name = patch.name;
  }

  saveAccounts(accounts);

  // keep the active session in sync so the change is reflected immediately
  const isRemembered = !!localStorage.getItem(SESSION_KEY);
  if (isRemembered) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(accounts[idx].user));
  } else {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(accounts[idx].user));
  }

  return accounts[idx].user;
}

export async function changePassword(uid: string, currentPassword: string, newPassword: string): Promise<void> {
  await delay(null, 500);
  const accounts = loadAccounts();
  const idx = accounts.findIndex((a) => a.user.uid === uid);
  if (idx === -1) throw new Error('Account not found.');
  if (accounts[idx].password !== currentPassword) throw new Error('Current password is incorrect.');
  if (newPassword.length < 6) throw new Error('New password must be at least 6 characters.');
  accounts[idx].password = newPassword;
  saveAccounts(accounts);
}

export function getCurrentSession(): AppUser | null {
  const raw = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

export function signOutUser(): void {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}
