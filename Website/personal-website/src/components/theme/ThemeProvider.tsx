import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "pm-theme";

interface ThemeContextValue {
  /** What the user picked. "system" follows the machine. */
  preference: ThemePreference;
  /** What is actually on screen right now. */
  resolved: ResolvedTheme;
  setPreference: (next: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  preference: "system",
  resolved: "dark",
  setPreference: () => {},
});

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    /* Storage unavailable. The system theme is the correct fallback. */
  }
  return "system";
}

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Owns the theme preference. The preference is stored only in localStorage, on
 * this machine; it is never sent to the API and no request shape depends on it.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Render the server-safe default first, then reconcile on mount. The
  // blocking script in _document.tsx has already painted the right colors,
  // so this reconciliation is invisible.
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("dark");

  useEffect(() => {
    setPreferenceState(readStoredPreference());
  }, []);

  // Apply the preference to <html> and keep following the system while the
  // preference is "system".
  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const next = preference === "system" ? systemTheme() : preference;
      if (preference === "system") {
        root.removeAttribute("data-theme");
      } else {
        root.setAttribute("data-theme", preference);
      }
      setResolved(next);
    };

    apply();

    if (preference !== "system" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* Nothing to persist to. The choice still applies for this session. */
    }
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
