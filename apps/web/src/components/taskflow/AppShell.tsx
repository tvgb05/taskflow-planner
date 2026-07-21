"use client";

import {
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Monitor,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { ApiRequestError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAppText } from "@/lib/i18n";
import {
  type AppLanguage,
  type DateFormat,
  type ThemePreference,
  usePreferences,
} from "@/lib/preferences";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/projects", labelKey: "projects", icon: FolderKanban },
];

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { booting, authenticated } = useAuth();
  const router = useRouter();
  const t = useAppText();

  useEffect(() => {
    if (!booting && !authenticated) {
      router.replace("/login");
    }
  }, [authenticated, booting, router]);

  if (booting) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <LoadingState label={t.appShell.checkingSession} />
      </main>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}

export function AppShell({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const t = useAppText();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-50">
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/dashboard" className="text-lg font-bold">
              TaskFlow Planner
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                const label =
                  item.labelKey === "dashboard"
                    ? t.appShell.dashboard
                    : t.common.projects;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex h-9 items-center gap-2 rounded px-3 text-sm font-semibold text-slate-600 dark:text-slate-300 transition hover:bg-white dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-slate-50",
                      active && "bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-50 shadow-sm",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <SettingsMenu />
            <Button
              type="button"
              variant="secondary"
              onClick={handleLogout}
              title={t.appShell.logout}
            >
              <LogOut className="h-4 w-4" />
              {t.appShell.logout}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-normal text-slate-950 dark:text-slate-50">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                {description}
              </p>
            ) : null}
          </div>
          {action}
        </div>
        {children}
      </main>
    </div>
  );
}

function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [verificationOtp, setVerificationOtp] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, updateProfile, resendVerificationEmail, verifyEmailOtp } = useAuth();
  const { preferences, updatePreferences, resetPreferences } = usePreferences();
  const t = useAppText();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function openMenu() {
    if (!open && user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
      setProfileMessage(null);
      setProfileError(null);
      setVerificationOtp("");
    }

    setOpen((current) => !current);
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileBusy(true);
    setProfileMessage(null);
    setProfileError(null);

    try {
      const payload = await updateProfile({
        name: profileName.trim(),
        email: profileEmail.trim(),
      });

      setProfileName(payload.user.name);
      setProfileEmail(payload.user.email);
      setProfileMessage(
        payload.verification_email_sent === true
          ? t.appShell.profileSavedVerificationSent
          : payload.verification_email_sent === false
            ? t.appShell.profileSavedVerificationUnavailable
            : t.appShell.profileSaved,
      );
    } catch (error) {
      setProfileError(
        error instanceof ApiRequestError
          ? error.message
          : t.appShell.profileSaveError,
      );
    } finally {
      setProfileBusy(false);
    }
  }

  async function handleSendVerification() {
    setProfileBusy(true);
    setProfileMessage(null);
    setProfileError(null);

    try {
      const payload = await resendVerificationEmail();
      setProfileMessage(
        payload.verification_email_sent
          ? t.appShell.verificationEmailSent
          : t.appShell.verificationEmailUnavailable,
      );
    } catch (error) {
      setProfileError(
        error instanceof ApiRequestError
          ? error.message
          : t.appShell.verificationEmailError,
      );
    } finally {
      setProfileBusy(false);
    }
  }

  async function handleVerifyOtp() {
    setProfileBusy(true);
    setProfileMessage(null);
    setProfileError(null);

    try {
      await verifyEmailOtp(verificationOtp.trim());
      setVerificationOtp("");
      setProfileMessage(t.appShell.verificationOtpSuccess);
    } catch (error) {
      setProfileError(
        error instanceof ApiRequestError
          ? error.message
          : t.appShell.verificationOtpError,
      );
    } finally {
      setProfileBusy(false);
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <Button
        type="button"
        variant="secondary"
        onClick={openMenu}
        title={t.appShell.settings}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Settings className="h-4 w-4" />
        {t.appShell.settings}
      </Button>

      {open ? (
        <div
          className="absolute right-0 top-full z-40 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-left shadow-xl"
          role="dialog"
          aria-label={t.appShell.settings}
        >
          <div className="grid gap-5">
            <form onSubmit={handleSaveProfile} className="grid gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                  {t.appShell.profile}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t.appShell.profileDescription}
                </p>
              </div>

              <ErrorMessage message={profileError} />
              {profileMessage ? (
                <p className="rounded border border-cyan-100 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950/40 px-3 py-2 text-sm text-cyan-800 dark:text-cyan-200">
                  {profileMessage}
                </p>
              ) : null}

              <Input
                label={t.appShell.name}
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                disabled={profileBusy}
                required
              />
              <Input
                label={t.appShell.email}
                type="email"
                value={profileEmail}
                onChange={(event) => setProfileEmail(event.target.value)}
                disabled={profileBusy}
                required
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={cn(
                    "rounded border px-2 py-1 text-xs font-semibold",
                    user?.email_verified
                      ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                      : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
                  )}
                >
                  {user?.email_verified
                    ? t.appShell.emailVerified
                    : t.appShell.emailUnverified}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9"
                  onClick={handleSendVerification}
                  disabled={profileBusy || user?.email_verified}
                >
                  {t.appShell.sendVerificationEmail}
                </Button>
              </div>

              {!user?.email_verified ? (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
                  <Input
                    label={t.appShell.verificationOtp}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={verificationOtp}
                    onChange={(event) =>
                      setVerificationOtp(event.target.value.replace(/\D/g, ""))
                    }
                    disabled={profileBusy}
                  />
                  <Button
                    type="button"
                    className="h-10"
                    onClick={handleVerifyOtp}
                    disabled={profileBusy || verificationOtp.length !== 6}
                  >
                    {t.appShell.verifyOtp}
                  </Button>
                </div>
              ) : null}

              <Button type="submit" disabled={profileBusy}>
                {t.common.saveChanges}
              </Button>
            </form>

            <div className="grid gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                  {t.appShell.preferences}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t.appShell.savedOnBrowser}
                </p>
              </div>

              <Select
                label={t.appShell.language}
                value={preferences.language}
                onChange={(event) =>
                  updatePreferences({
                    language: event.target.value as AppLanguage,
                    languageManuallySelected: true,
                  })
                }
              >
                <option value="en">{t.appShell.english}</option>
                <option value="vi">{t.appShell.vietnamese}</option>
              </Select>

              <Select
                label={t.appShell.dateFormat}
                value={preferences.dateFormat}
                onChange={(event) =>
                  updatePreferences({
                    dateFormat: event.target.value as DateFormat,
                  })
                }
              >
                <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                <option value="yyyy-mm-dd">YYYY-MM-DD</option>
              </Select>

              <fieldset className="grid gap-1.5">
                <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t.appShell.theme}
                </legend>
                <div className="grid grid-cols-3 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-1">
                  {(
                    [
                      ["auto", Monitor, t.appShell.themeAuto],
                      ["light", Sun, t.appShell.themeLight],
                      ["dark", Moon, t.appShell.themeDark],
                    ] as const
                  ).map(([theme, Icon, label]) => (
                    <label
                      key={theme}
                      className={cn(
                        "flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded px-2 text-xs font-semibold text-slate-600 dark:text-slate-300 transition hover:bg-white dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-slate-50",
                        preferences.theme === theme &&
                          "bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-50 shadow-sm",
                      )}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value={theme}
                        className="sr-only"
                        checked={preferences.theme === theme}
                        onChange={() =>
                          updatePreferences({
                            theme: theme as ThemePreference,
                          })
                        }
                      />
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="flex items-start gap-3 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-3">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-cyan-700 dark:text-cyan-300 focus:ring-cyan-500"
                  checked={preferences.learnFromTaskPatterns}
                  onChange={(event) =>
                    updatePreferences({
                      learnFromTaskPatterns: event.target.checked,
                    })
                  }
                />
                <span>
                  <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                    {t.appShell.learnFromTaskPatterns}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {t.appShell.learnFromTaskPatternsHint}
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={resetPreferences}>
              {t.common.reset}
            </Button>
            <Button type="button" onClick={() => setOpen(false)}>
              {t.common.done}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
