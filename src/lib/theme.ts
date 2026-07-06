export type AccentKey = 'teal' | 'blue' | 'amber';

export const accentPalette: Record<AccentKey, { culture: string; cultureDim: string }> = {
  teal: { culture: '#2AD9C2', cultureDim: '#1B8F80' },
    blue: { culture: '#6C8BF5', cultureDim: '#4A63C9' },
      amber: { culture: '#F2A93B', cultureDim: '#C6842A' },
      };

      const STORAGE_KEY = 'amr.accent.v1';

      export function applyAccent(key: AccentKey) {
        const palette = accentPalette[key];
          document.documentElement.style.setProperty('--color-culture', palette.culture);
            document.documentElement.style.setProperty('--color-culture-dim', palette.cultureDim);
              localStorage.setItem(STORAGE_KEY, key);
              }

              export function getStoredAccent(): AccentKey {
                const stored = localStorage.getItem(STORAGE_KEY);
                  if (stored === 'teal' || stored === 'blue' || stored === 'amber') return stored;
                    return 'teal';
                    }

                    /** Call once on app boot so a previously chosen accent persists across reloads. */
                    export function initAccent() {
                      applyAccent(getStoredAccent());
                      }
                      