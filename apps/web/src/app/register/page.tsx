"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { RecaptchaWidget } from "@/components/taskflow/RecaptchaWidget";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input";
import { ApiRequestError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { prepareGuidesForNewUser } from "@/lib/guide";
import { useAppText } from "@/lib/i18n";
import type { ValidationErrors } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();
  const { booting, authenticated, register, sendRegistrationOtp } = useAuth();
  const t = useAppText();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [otp, setOtp] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors | undefined>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!booting && authenticated) {
      router.replace("/dashboard");
    }
  }, [authenticated, booting, router]);

  useEffect(() => {
    if (otpCooldown <= 0) return;

    const timer = window.setTimeout(() => {
      setOtpCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [otpCooldown]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setErrors(undefined);

    try {
      await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        otp,
      });
      prepareGuidesForNewUser();
      router.replace("/dashboard");
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setMessage(error.message);
        setErrors(error.errors);
      } else {
        setMessage(t.auth.apiError);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendOtp() {
    if (!email) return;
    setOtpSending(true);
    setMessage(null);
    setErrors(undefined);

    try {
      await sendRegistrationOtp({
        email,
        recaptcha_token: recaptchaToken,
      });
      setOtpSent(true);
      setOtpCooldown(60);
    } catch (error) {
      setMessage(error instanceof ApiRequestError ? error.message : t.auth.otpSendError);
    } finally {
      setOtpSending(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-xl font-bold text-slate-950">
            {t.auth.createAccount}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t.auth.registerSubtitle}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <ErrorMessage message={message} errors={errors} />
            <Input
              label={t.auth.name}
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
            />
            <Input
              label={t.auth.password}
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
            <Input
              label={t.auth.confirmPassword}
              name="password_confirmation"
              type="password"
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              autoComplete="new-password"
              required
            />
            <Input
              label={t.auth.email}
              name="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setOtp("");
                setOtpSent(false);
                setMessage(null);
                setErrors(undefined);
              }}
              autoComplete="email"
              required
            />
            {otpSent ? (
              <p className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-800" role="status">
                <span className="font-semibold">{t.auth.otpSent}</span>{" "}
                {t.auth.checkMailFolders}
              </p>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
              <Input
                label={t.auth.otp}
                name="otp"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                required
              />
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-36"
                onClick={handleSendOtp}
                disabled={otpSending || !email || otpCooldown > 0}
              >
                {otpSending
                  ? t.common.loading
                  : otpCooldown > 0
                    ? `${t.auth.sendOtpCountdown} ${otpCooldown}s`
                    : t.auth.sendOtp}
              </Button>
            </div>
            <RecaptchaWidget onChange={setRecaptchaToken} />
            <Button type="submit" disabled={submitting || !otpSent}>
              {t.auth.register}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            {t.auth.alreadyHaveAccount}{" "}
            <Link href="/login" className="font-semibold text-cyan-700">
              {t.auth.login}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
