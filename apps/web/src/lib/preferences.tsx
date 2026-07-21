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
export type ThemePreference = "auto" | "light" | "dark";

export type UserPreferences = {
  language: AppLanguage;
  languageManuallySelected: boolean;
  dateFormat: DateFormat;
  theme: ThemePreference;
  learnFromTaskPatterns: boolean;
};

type PreferencesContextValue = {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
};

const STORAGE_KEY = "taskflow_user_preferences";

export const defaultPreferences: UserPreferences = {
  language: "en",
  languageManuallySelected: false,
  dateFormat: "dd/mm/yyyy",
  theme: "auto",
  learnFromTaskPatterns: true,
};

const languages = new Set<AppLanguage>(["en", "vi"]);
const dateFormats = new Set<DateFormat>([
  "dd/mm/yyyy",
  "mm/dd/yyyy",
  "yyyy-mm-dd",
]);
const themes = new Set<ThemePreference>(["auto", "light", "dark"]);

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function detectedBrowserLanguage(): AppLanguage {
  if (typeof navigator === "undefined") {
    return defaultPreferences.language;
  }

  const browserLanguage = navigator.languages?.[0] ?? navigator.language;

  return browserLanguage?.toLowerCase().startsWith("vi") ? "vi" : "en";
}

function browserDefaultPreferences(): UserPreferences {
  return {
    ...defaultPreferences,
    language: detectedBrowserLanguage(),
  };
}

function readStoredPreferences(): UserPreferences {
  if (typeof window === "undefined") {
    return defaultPreferences;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return browserDefaultPreferences();
    }

    const parsed = JSON.parse(stored) as Partial<UserPreferences>;
    const languageManuallySelected =
      parsed.languageManuallySelected === true;

    return {
      language:
        languageManuallySelected &&
        parsed.language &&
        languages.has(parsed.language)
          ? parsed.language
          : detectedBrowserLanguage(),
      languageManuallySelected,
      dateFormat:
        parsed.dateFormat && dateFormats.has(parsed.dateFormat)
          ? parsed.dateFormat
          : defaultPreferences.dateFormat,
      theme:
        parsed.theme && themes.has(parsed.theme)
          ? parsed.theme
          : defaultPreferences.theme,
      learnFromTaskPatterns:
        typeof parsed.learnFromTaskPatterns === "boolean"
          ? parsed.learnFromTaskPatterns
          : defaultPreferences.learnFromTaskPatterns,
    };
  } catch {
    return browserDefaultPreferences();
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

  useEffect(() => {
    const browserTheme = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme() {
      const dark =
        preferences.theme === "dark" ||
        (preferences.theme === "auto" && browserTheme.matches);

      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
    }

    applyTheme();

    if (preferences.theme !== "auto") {
      return;
    }

    browserTheme.addEventListener("change", applyTheme);

    return () => browserTheme.removeEventListener("change", applyTheme);
  }, [preferences.theme]);

  const updatePreferences = useCallback(
    (updates: Partial<UserPreferences>) => {
      setPreferences((current) => ({ ...current, ...updates }));
    },
    [],
  );

  const resetPreferences = useCallback(() => {
    setPreferences(browserDefaultPreferences());
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
