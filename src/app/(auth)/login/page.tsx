"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  AuthError,
  AuthField,
  AuthFooterLink,
  AuthShell,
} from "@/components/auth/auth-shell";
import { useAuth } from "@/contexts/auth-provider";
import { getUserErrorMessage, USER_ERRORS } from "@/lib/errors/user-messages";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await signIn(email, password);
      const redirectTo = searchParams.get("from") ?? "/dashboard";
      router.replace(redirectTo);
    } catch (err) {
      setError(getUserErrorMessage(err, USER_ERRORS.signInFailed));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Use your email and password to access the dashboard."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? <AuthError message={error} /> : null}

        <AuthField
          label="Email"
          id="email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />

        <AuthField
          label="Password"
          id="password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-6">
        <AuthFooterLink
          text="No account yet?"
          href="/signup"
          linkText="Create one"
        />
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
