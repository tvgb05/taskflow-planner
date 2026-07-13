"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Preferences hydrate from localStorage after mount. */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AppLanguage = "en" | "vi";
export type DateFormat = "dd/mm/yyyy" | "mm/dd/yyyy" | "yyyy-mm-dd";

export type UserPreferences = {
  language: AppLanguage;
  dateFormat: DateFormat;
};

type PreferencesContextValue = {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
};

const STORAGE_KEY = "taskflow_user_preferences";

export const defaultPreferences: UserPreferences = {
  language: "en",
  dateFormat: "dd/mm/yyyy",
};

const languages = new Set<AppLanguage>(["en", "vi"]);
const dateFormats = new Set<DateFormat>([
  "dd/mm/yyyy",
  "mm/dd/yyyy",
  "yyyy-mm-dd",
]);

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function readStoredPreferences(): UserPreferences {
  if (typeof window === "undefined") {
    return defaultPreferences;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return defaultPreferences;
    }

    const parsed = JSON.parse(stored) as Partial<UserPreferences>;

    return {
      language:
        parsed.language && languages.has(parsed.language)
          ? parsed.language
          : defaultPreferences.language,
      dateFormat:
        parsed.dateFormat && dateFormats.has(parsed.dateFormat)
          ? parsed.dateFormat
          : defaultPreferences.dateFormat,
    };
  } catch {
    return defaultPreferences;
  }
}

export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] =
    useState<UserPreferences>(defaultPreferences);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPreferences(readStoredPreferences());
    setHydrated(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = preferences.language;

    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    }
  }, [hydrated, preferences]);

  const updatePreferences = useCallback(
    (updates: Partial<UserPreferences>) => {
      setPreferences((current) => ({ ...current, ...updates }));
    },
    [],
  );

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
  }, []);

  const value = useMemo(
    () => ({ preferences, updatePreferences, resetPreferences }),
    [preferences, updatePreferences, resetPreferences],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider.");
  }

  return context;
}
