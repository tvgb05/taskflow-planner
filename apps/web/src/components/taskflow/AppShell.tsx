"use client";

import { FolderKanban, LayoutDashboard, LogOut, Settings } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/dashboard" className="text-lg font-bold">
              TaskFlow Planner
            </Link>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-1">
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
                      "inline-flex h-9 items-center gap-2 rounded px-3 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950",
                      active && "bg-white text-slate-950 shadow-sm",
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
            <h1 className="text-2xl font-bold tracking-normal text-slate-950">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
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
  const [profileUsername, setProfileUsername] = useState("");
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
      setProfileUsername(user.username ?? "");
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
        username: profileUsername.trim(),
        email: profileEmail.trim(),
      });

      setProfileName(payload.user.name);
      setProfileUsername(payload.user.username);
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
          className="absolute right-0 top-full z-40 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-md border border-slate-200 bg-white p-4 text-left shadow-xl"
          role="dialog"
          aria-label={t.appShell.settings}
        >
          <div className="grid gap-5">
            <form onSubmit={handleSaveProfile} className="grid gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-950">
                  {t.appShell.profile}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {t.appShell.profileDescription}
                </p>
              </div>

              <ErrorMessage message={profileError} />
              {profileMessage ? (
                <p className="rounded border border-cyan-100 bg-cyan-50 px-3 py-2 text-sm text-cyan-800">
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
                label={t.auth.username}
                value={profileUsername}
                onChange={(event) =>
                  setProfileUsername(
                    event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                  )
                }
                minLength={3}
                maxLength={30}
                hint={t.auth.usernameHint}
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
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700",
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

            <div className="grid gap-3 border-t border-slate-100 pt-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-950">
                  {t.appShell.preferences}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {t.appShell.savedOnBrowser}
                </p>
              </div>

              <Select
                label={t.appShell.language}
                value={preferences.language}
                onChange={(event) =>
                  updatePreferences({
                    language: event.target.value as AppLanguage,
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

              <label className="flex items-start gap-3 rounded-md border border-slate-200 px-3 py-3">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-500"
                  checked={preferences.learnFromTaskPatterns}
                  onChange={(event) =>
                    updatePreferences({
                      learnFromTaskPatterns: event.target.checked,
                    })
                  }
                />
                <span>
                  <span className="block text-sm font-medium text-slate-800">
                    {t.appShell.learnFromTaskPatterns}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
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
