"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input";
import { ApiRequestError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAppText } from "@/lib/i18n";
import type { ValidationErrors } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const { booting, authenticated, login } = useAuth();
  const t = useAppText();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors | undefined>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!booting && authenticated) {
      router.replace("/dashboard");
    }
  }, [authenticated, booting, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setErrors(undefined);

    try {
      await login({ identifier, password });
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

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-xl font-bold text-slate-950">TaskFlow Planner</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t.auth.loginSubtitle}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <ErrorMessage message={message} errors={errors} />
            <Input
              label={t.auth.loginIdentifier}
              name="identifier"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              autoComplete="username"
              required
            />
            <Input
              label={t.auth.password}
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <Button type="submit" disabled={submitting}>
              {t.auth.login}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            {t.auth.needAccount}{" "}
            <Link href="/register" className="font-semibold text-cyan-700">
              {t.auth.register}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
