"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import {
  AuthError,
  AuthField,
  AuthFooterLink,
  AuthShell,
} from "@/components/auth/auth-shell";
import { useAuth } from "@/contexts/auth-provider";

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await signUp(email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="The first account becomes admin. Later accounts are viewers."
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
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="mt-6">
        <AuthFooterLink
          text="Already have an account?"
          href="/login"
          linkText="Sign in"
        />
      </div>
    </AuthShell>
  );
}
