export type AccentKey = 'teal' | 'blue' | 'amber';

export const accentPalette: Record<AccentKey, { culture: string; cultureDim: string }> = {
  teal: { culture: '#2AD9C2', cultureDim: '#1B8F80' },
  blue: { culture: '#6C8BF5', cultureDim: '#4A63C9' },
  amber: { culture: '#F2A93B', cultureDim: '#C6842A' },
};

const ACCENT_STORAGE_KEY = 'amr.accent.v1';
const DARK_MODE_STORAGE_KEY = 'amr.darkmode.v1';

export function applyAccent(key: AccentKey) {
  const palette = accentPalette[key];
  document.documentElement.style.setProperty('--color-culture', palette.culture);
  document.documentElement.style.setProperty('--color-culture-dim', palette.cultureDim);
  localStorage.setItem(ACCENT_STORAGE_KEY, key);
}

export function getStoredAccent(): AccentKey {
  const stored = localStorage.getItem(ACCENT_STORAGE_KEY);
  if (stored === 'teal' || stored === 'blue' || stored === 'amber') return stored;
  return 'teal';
}

export function applyDarkMode(isDark: boolean) {
  document.documentElement.classList.toggle('light', !isDark);
  localStorage.setItem(DARK_MODE_STORAGE_KEY, isDark ? 'dark' : 'light');
}

export function getStoredDarkMode(): boolean {
  const stored = localStorage.getItem(DARK_MODE_STORAGE_KEY);
  return stored !== 'light';
}

export function initAccent() {
  applyAccent(getStoredAccent());
  applyDarkMode(getStoredDarkMode());
}