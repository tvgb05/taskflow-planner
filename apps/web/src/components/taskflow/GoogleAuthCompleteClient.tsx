"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { buttonStyles } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useAuth } from "@/lib/auth";
import { prepareGuidesForNewUser } from "@/lib/guide";
import { useAppText } from "@/lib/i18n";

export function GoogleAuthCompleteClient({
  errorCode,
  isNewUser,
}: {
  errorCode: string | null;
  isNewUser: boolean;
}) {
  const router = useRouter();
  const { booting, authenticated } = useAuth();
  const t = useAppText();

  useEffect(() => {
    if (errorCode || booting || !authenticated) {
      return;
    }

    if (isNewUser) {
      prepareGuidesForNewUser();
    }

    router.replace("/dashboard");
  }, [authenticated, booting, errorCode, isNewUser, router]);

  const providerError = errorCode
    ? errorCode === "google_not_configured"
      ? t.auth.googleNotConfigured
      : errorCode === "google_email_unverified"
        ? t.auth.googleEmailUnverified
        : errorCode === "google_account_conflict"
          ? t.auth.googleAccountConflict
          : t.auth.googleAuthFailed
    : null;
  const error =
    providerError ?? (!booting && !authenticated ? t.auth.googleSessionFailed : null);

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-xl font-bold text-slate-950">
            TaskFlow Planner
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t.auth.googleCompleting}
          </p>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error ? (
            <>
              <ErrorMessage message={error} />
              <Link href="/login" className={buttonStyles("secondary")}>
                {t.auth.backToLogin}
              </Link>
            </>
          ) : (
            <div className="flex items-center justify-center gap-3 py-8 text-sm font-medium text-slate-600">
              <LoaderCircle className="h-5 w-5 animate-spin text-cyan-700" />
              {t.auth.googleCompleting}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
